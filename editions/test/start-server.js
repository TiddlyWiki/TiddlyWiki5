/*\
title: editions/test/start-server.js
type: application/javascript

Playwright E2E test helper: builds the test TW edition then serves the output
directory over HTTP so browsers can load it without file:// restrictions.

Usage:
  node editions/test/start-server.js              # build + serve
  node editions/test/start-server.js --no-build   # serve only (skip rebuild)

Environment:
  TEST_SERVER_PORT  TCP port to listen on (default: 8765)
\*/

"use strict";

const { execSync } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = parseInt(process.env.TEST_SERVER_PORT || "8765", 10);
const repoRoot = path.resolve(__dirname, "..", "..");
const outputDir = path.resolve(__dirname, "output");
const skipBuild = process.argv.includes("--no-build");

// ---------- Build phase ----------
if(!skipBuild) {
	console.log("[test-server] Building test edition...");
	try {
		execSync(
			"node tiddlywiki.js editions/test --output editions/test/output --build index",
			{ cwd: repoRoot, stdio: "inherit" }
		);
		console.log("[test-server] Build complete.");
	} catch(e) {
		console.error("[test-server] Build failed:", e.message);
		process.exit(1);
	}
}

// ---------- MIME type map ----------
const MIME = {
	".html": "text/html; charset=utf-8",
	".js":   "application/javascript; charset=utf-8",
	".css":  "text/css; charset=utf-8",
	".svg":  "image/svg+xml",
	".png":  "image/png",
	".ico":  "image/x-icon",
	".json": "application/json; charset=utf-8"
};

// ---------- HTTP server ----------
const server = http.createServer(function(req, res) {
	// Strip query string and decode
	var urlPath;
	try {
		urlPath = decodeURIComponent(req.url.split("?")[0]);
	} catch(e) {
		urlPath = req.url.split("?")[0];
	}

	var target = (urlPath === "/" || urlPath === "") ? "/test.html" : urlPath;
	var filePath = path.normalize(path.join(outputDir, target));

	// Prevent path traversal
	if(!filePath.startsWith(outputDir + path.sep) && filePath !== outputDir) {
		res.writeHead(403, { "Content-Type": "text/plain" });
		res.end("Forbidden");
		return;
	}

	fs.readFile(filePath, function(err, data) {
		if(err) {
			res.writeHead(404, { "Content-Type": "text/plain" });
			res.end("Not found: " + target);
			return;
		}
		var ext = path.extname(filePath).toLowerCase();
		var contentType = MIME[ext] || "application/octet-stream";
		res.writeHead(200, {
			"Content-Type": contentType
		});
		res.end(data);
	});
});

server.on("error", function(err) {
	if(err.code === "EADDRINUSE") {
		console.error("[test-server] Port " + PORT + " already in use. Use --no-build flag or set TEST_SERVER_PORT.");
	} else {
		console.error("[test-server] Server error:", err.message);
	}
	process.exit(1);
});

server.listen(PORT, "127.0.0.1", function() {
	console.log("[test-server] Serving at http://127.0.0.1:" + PORT + "/");
	console.log("[test-server] Test wiki: http://127.0.0.1:" + PORT + "/test.html");
});
