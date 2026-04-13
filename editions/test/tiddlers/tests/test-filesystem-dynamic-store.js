/*\
title: test-filesystem-dynamic-store.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for the filesystem syncadaptor dynamic store feature: save routing
driven by saveFilter, and chokidar-based watching of out-of-band edits.

\*/
"use strict";

if($tw.node) {

	var fs = require("fs"),
		path = require("path"),
		os = require("os");

	// Load the filesystem adaptor source as if it were a TW module, so that
	// $tw is provided without having to include the plugin in the edition
	// (which would pull in the server-side syncer and keep the test runner alive).
	var adaptorPath = path.resolve($tw.boot.bootPath,"..","plugins","tiddlywiki","filesystem","filesystemadaptor.js"),
		adaptorTitle = "$:/plugins/tiddlywiki/filesystem/filesystemadaptor.js";
	if(!$tw.modules.titles[adaptorTitle]) {
		$tw.modules.titles[adaptorTitle] = {
			moduleType: "syncadaptor",
			definition: fs.readFileSync(adaptorPath,"utf8")
		};
		$tw.wiki.addTiddler({
			title: adaptorTitle,
			type: "application/javascript",
			"module-type": "syncadaptor",
			text: ""
		});
	}
	var FileSystemAdaptor = $tw.modules.execute(adaptorTitle).adaptorClass;

	function makeTempDir(prefix) {
		return fs.mkdtempSync(path.join(os.tmpdir(),prefix));
	}

	function removeDirRecursive(dir) {
		if(fs.existsSync(dir)) {
			fs.rmSync(dir,{recursive: true, force: true});
		}
	}

	function waitMs(ms) {
		return new Promise(function(resolve) { setTimeout(resolve,ms); });
	}

	describe("filesystem dynamic store", function() {

		var tmpRoot, wikiTiddlers, storeDir, origDynamicStores, origFiles, originalBootPath;
		var adaptor, wiki;

		beforeEach(function() {
			tmpRoot = makeTempDir("tw-dyn-");
			wikiTiddlers = path.join(tmpRoot,"tiddlers");
			storeDir = path.join(tmpRoot,"content");
			fs.mkdirSync(wikiTiddlers);
			fs.mkdirSync(storeDir);

			origDynamicStores = $tw.boot.dynamicStores;
			origFiles = $tw.boot.files;
			originalBootPath = $tw.boot.wikiTiddlersPath;

			$tw.boot.dynamicStores = [{
				id: storeDir,
				directory: storeDir,
				saveFilter: "[type[text/x-markdown]]",
				watch: true,
				debounce: 40,
				filesRegExp: ".*\\.tid$",
				searchSubdirectories: false,
				isTiddlerFile: true,
				fields: {}
			}];
			$tw.boot.files = Object.create(null);
			$tw.boot.wikiTiddlersPath = wikiTiddlers;

			wiki = new $tw.Wiki();
			adaptor = new FileSystemAdaptor({wiki: wiki, boot: $tw.boot});
		});

		afterEach(function(done) {
			adaptor.close().then(function() {
				$tw.boot.dynamicStores = origDynamicStores;
				$tw.boot.files = origFiles;
				$tw.boot.wikiTiddlersPath = originalBootPath;
				removeDirRecursive(tmpRoot);
				done();
			});
		});

		it("routes saves for matching tiddlers into the dynamic store directory", function(done) {
			wiki.addTiddler(new $tw.Tiddler({title: "note1", type: "text/x-markdown", text: "hello"}));
			var tiddler = wiki.getTiddler("note1");
			adaptor.getTiddlerFileInfo(tiddler,function(err,fileInfo) {
				expect(err).toBeFalsy();
				expect(fileInfo.filepath.indexOf(storeDir)).toBe(0);
				expect(fileInfo.dynamicStoreId).toBe(storeDir);
				done();
			});
		});

		it("routes saves for non-matching tiddlers into the default wiki tiddlers path", function(done) {
			wiki.addTiddler(new $tw.Tiddler({title: "note2", type: "text/vnd.tiddlywiki", text: "plain"}));
			var tiddler = wiki.getTiddler("note2");
			adaptor.getTiddlerFileInfo(tiddler,function(err,fileInfo) {
				expect(err).toBeFalsy();
				expect(fileInfo.filepath.indexOf(wikiTiddlers)).toBe(0);
				expect(fileInfo.dynamicStoreId).toBeFalsy();
				done();
			});
		});

		it("keeps saving a tiddler into the store it originally came from", function(done) {
			// Simulate a tiddler that was loaded at boot from the dynamic store
			$tw.boot.files["frozen"] = {
				filepath: path.join(storeDir,"frozen.tid"),
				type: "application/x-tiddler",
				hasMetaFile: false,
				isEditableFile: true,
				dynamicStoreId: storeDir
			};
			// Its current type no longer matches the saveFilter — store id must still win
			wiki.addTiddler(new $tw.Tiddler({title: "frozen", type: "text/vnd.tiddlywiki", text: "still here"}));
			adaptor.getTiddlerFileInfo(wiki.getTiddler("frozen"),function(err,fileInfo) {
				expect(err).toBeFalsy();
				expect(fileInfo.filepath.indexOf(storeDir)).toBe(0);
				expect(fileInfo.dynamicStoreId).toBe(storeDir);
				done();
			});
		});

		it("detects out-of-band additions and changes via chokidar", function(done) {
			if(adaptor.watchers.length === 0) {
				// chokidar unavailable in this environment
				pending("chokidar not installed");
				return done();
			}
			var filepath = path.join(storeDir,"external.tid");
			// Write initial file
			fs.writeFileSync(filepath,"title: external\ntype: text/x-markdown\n\nInitial\n");
			waitMs(200).then(function() {
				return new Promise(function(resolve) {
					adaptor.getUpdatedTiddlers({},function(err,updates) {
						expect(err).toBeFalsy();
						expect(updates.modifications).toContain("external");
						resolve();
					});
				});
			}).then(function() {
				// loadTiddler should now return the fields from disk
				return new Promise(function(resolve) {
					adaptor.loadTiddler("external",function(err,fields) {
						expect(err).toBeFalsy();
						expect(fields).toBeTruthy();
						expect(fields.title).toBe("external");
						expect(fields.text).toContain("Initial");
						resolve();
					});
				});
			}).then(function() {
				// Edit the file
				fs.writeFileSync(filepath,"title: external\ntype: text/x-markdown\n\nChanged\n");
				return waitMs(200);
			}).then(function() {
				return new Promise(function(resolve) {
					adaptor.getUpdatedTiddlers({},function(err,updates) {
						expect(updates.modifications).toContain("external");
						resolve();
					});
				});
			}).then(function() {
				// Delete the file
				fs.unlinkSync(filepath);
				return waitMs(200);
			}).then(function() {
				return new Promise(function(resolve) {
					adaptor.getUpdatedTiddlers({},function(err,updates) {
						expect(updates.deletions).toContain("external");
						resolve();
					});
				});
			}).then(done, done.fail);
		});

		it("suppresses echoes when the file on disk matches the current wiki tiddler", function(done) {
			if(adaptor.watchers.length === 0) {
				pending("chokidar not installed");
				return done();
			}
			// Seed the wiki with a tiddler whose content exactly matches what we'll write
			wiki.addTiddler(new $tw.Tiddler({title: "echo", type: "text/x-markdown", text: "same\n"}));
			var filepath = path.join(storeDir,"echo.tid");
			fs.writeFileSync(filepath,"title: echo\ntype: text/x-markdown\n\nsame\n");
			waitMs(200).then(function() {
				adaptor.getUpdatedTiddlers({},function(err,updates) {
					expect(updates.modifications).not.toContain("echo");
					done();
				});
			});
		});
	});
}
