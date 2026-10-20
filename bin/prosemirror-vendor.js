"use strict";

/*
This script intentionally has no project dependencies. It installs the exact
package versions from vendor-manifest.json into an isolated temporary folder,
then verifies or refreshes the checked-in artifacts and license notices.

	node bin/prosemirror-vendor.js --verify
	node bin/prosemirror-vendor.js --check
	node bin/prosemirror-vendor.js --write

--verify checks only the checked-in hashes and does not use the network.
--check also compares the files with fresh exact-version npm packages.
--write refreshes the artifacts, checksums, and third-party notices.
*/

const childProcess = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const pluginDirectory = path.resolve(__dirname,"..","plugins","tiddlywiki","prosemirror");
const manifestPath = path.join(pluginDirectory,"vendor-manifest.json");
const mode = process.argv[2] || "--verify";

if(!["--verify","--check","--write"].includes(mode)) {
	throw new Error("Usage: vendor.js [--verify|--check|--write]");
}

function sha256(buffer) {
	return crypto.createHash("sha256").update(buffer).digest("hex");
}

function readManifest() {
	return JSON.parse(fs.readFileSync(manifestPath,"utf8"));
}

function assertInsidePlugin(filename) {
	const resolved = path.resolve(pluginDirectory,filename);
	if(resolved === pluginDirectory || !resolved.startsWith(pluginDirectory + path.sep)) {
		throw new Error("Vendor destination escapes the plugin directory: " + filename);
	}
	return resolved;
}

function verifyCheckedIn(manifest) {
	const errors = [];
	manifest.artifacts.forEach(function(artifact) {
		const filename = assertInsidePlugin(artifact.destination);
		if(!fs.existsSync(filename)) {
			errors.push("Missing " + artifact.destination);
			return;
		}
		const actual = sha256(fs.readFileSync(filename));
		if(actual !== artifact.sha256) {
			errors.push(artifact.destination + " has " + actual + ", expected " + artifact.sha256);
		}
	});
	const noticeFilename = assertInsidePlugin(manifest.notice.destination);
	if(!fs.existsSync(noticeFilename)) {
		errors.push("Missing " + manifest.notice.destination);
	} else {
		const actual = sha256(fs.readFileSync(noticeFilename));
		if(actual !== manifest.notice.sha256) {
			errors.push(manifest.notice.destination + " has " + actual + ", expected " + manifest.notice.sha256);
		}
	}
	if(errors.length) {
		throw new Error("Vendored files failed verification:\n" + errors.join("\n"));
	}
}

function installPackages(manifest) {
	const versions = Object.create(null);
	manifest.artifacts.forEach(function(artifact) {
		const previous = versions[artifact.package];
		if(previous && previous !== artifact.version) {
			throw new Error("Conflicting versions for " + artifact.package);
		}
		versions[artifact.package] = artifact.version;
	});
	const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(),"tw-prosemirror-vendor-"));
	const temporaryPackage = {
		private: true,
		dependencies: versions
	};
	fs.writeFileSync(path.join(temporaryDirectory,"package.json"),JSON.stringify(temporaryPackage,null,2) + "\n");
	const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
	const result = childProcess.spawnSync(npmCommand,[
		"install",
		"--ignore-scripts",
		"--no-audit",
		"--no-fund",
		"--package-lock=false",
		"--save-exact"
	],{
		cwd: temporaryDirectory,
		encoding: "utf8"
	});
	if(result.status !== 0) {
		fs.rmSync(temporaryDirectory,{recursive: true,force: true});
		throw new Error("npm install failed:\n" + (result.stderr || result.stdout));
	}
	return temporaryDirectory;
}

function collectPackageData(manifest,temporaryDirectory) {
	const packages = Object.create(null);
	manifest.artifacts.forEach(function(artifact) {
		const packageDirectory = path.join(temporaryDirectory,"node_modules",artifact.package);
		const packageMetadata = JSON.parse(fs.readFileSync(path.join(packageDirectory,"package.json"),"utf8"));
		if(packageMetadata.version !== artifact.version) {
			throw new Error(artifact.package + " resolved to " + packageMetadata.version + ", expected " + artifact.version);
		}
		if(packageMetadata.license !== "MIT") {
			throw new Error(artifact.package + " has unexpected license " + packageMetadata.license);
		}
		artifact.buffer = fs.readFileSync(path.join(packageDirectory,artifact.source));
		artifact.actualSha256 = sha256(artifact.buffer);
		if(!packages[artifact.package]) {
			packages[artifact.package] = {
				name: artifact.package,
				version: artifact.version,
				license: packageMetadata.license,
				licenseText: fs.readFileSync(path.join(packageDirectory,"LICENSE"),"utf8").trimEnd()
			};
		}
	});
	return packages;
}

function createNotice(packages) {
	const sections = Object.keys(packages).sort().map(function(name) {
		const packageData = packages[name];
		return [
			packageData.name + "@" + packageData.version,
			"Source: https://www.npmjs.com/package/" + packageData.name + "/v/" + packageData.version,
			"License: " + packageData.license,
			"",
			packageData.licenseText
		].join("\n");
	});
	return Buffer.from([
		"TiddlyWiki ProseMirror plugin third-party notices",
		"",
		"Generated by bin/prosemirror-vendor.js from the exact packages in vendor-manifest.json.",
		"",
		sections.join("\n\n================================================================================\n\n"),
		""
	].join("\n"));
}

function compareInstalled(manifest,noticeBuffer) {
	const errors = [];
	manifest.artifacts.forEach(function(artifact) {
		if(artifact.actualSha256 !== artifact.sha256) {
			errors.push(artifact.package + "@" + artifact.version + "/" + artifact.source + " has " + artifact.actualSha256 + ", expected " + artifact.sha256);
		}
		const checkedIn = fs.readFileSync(assertInsidePlugin(artifact.destination));
		if(!checkedIn.equals(artifact.buffer)) {
			errors.push(artifact.destination + " is not byte-for-byte identical to the npm package");
		}
	});
	const checkedNotice = fs.readFileSync(assertInsidePlugin(manifest.notice.destination));
	if(!checkedNotice.equals(noticeBuffer)) {
		errors.push(manifest.notice.destination + " is not reproducible from the installed package licenses");
	}
	if(errors.length) {
		throw new Error("Fresh package check failed:\n" + errors.join("\n"));
	}
}

function writeInstalled(manifest,noticeBuffer) {
	manifest.artifacts.forEach(function(artifact) {
		const destination = assertInsidePlugin(artifact.destination);
		fs.mkdirSync(path.dirname(destination),{recursive: true});
		fs.writeFileSync(destination,artifact.buffer);
		artifact.sha256 = artifact.actualSha256;
		delete artifact.buffer;
		delete artifact.actualSha256;
	});
	const noticeDestination = assertInsidePlugin(manifest.notice.destination);
	fs.writeFileSync(noticeDestination,noticeBuffer);
	manifest.notice.sha256 = sha256(noticeBuffer);
	fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,"\t") + "\n");
}

const manifest = readManifest();
if(mode === "--verify") {
	verifyCheckedIn(manifest);
	console.log("Verified " + manifest.artifacts.length + " vendored artifacts and third-party notices.");
} else {
	const temporaryDirectory = installPackages(manifest);
	try {
		const packages = collectPackageData(manifest,temporaryDirectory);
		const noticeBuffer = createNotice(packages);
		if(mode === "--write") {
			writeInstalled(manifest,noticeBuffer);
			console.log("Updated " + manifest.artifacts.length + " vendored artifacts and third-party notices.");
		} else {
			verifyCheckedIn(manifest);
			compareInstalled(manifest,noticeBuffer);
			console.log("Checked " + manifest.artifacts.length + " vendored artifacts against fresh exact-version packages.");
		}
	} finally{
		fs.rmSync(temporaryDirectory,{recursive: true,force: true});
	}
}
