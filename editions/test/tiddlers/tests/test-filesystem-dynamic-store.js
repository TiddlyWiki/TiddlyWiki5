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
				// The watcher callback is exercised through scheduleFileEvent()
				// below so the tests do not rely on platform filesystem events.
				watch: false,
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

		it("retries transient file locks with configurable exponential backoff", function(done) {
			var attempts = 0,
				store = $tw.boot.dynamicStores[0],
				changeInfo,
				changeHook = function(info) {
					changeInfo = info;
					return info;
				};
			$tw.hooks.addHook("th-filesystem-change",changeHook);
			store.writeRetry = {attempts: 3,initialDelay: 1,maxDelay: 2};
			spyOn($tw.utils,"saveTiddlerToFile").and.callFake(function(tiddler,fileInfo,callback) {
				attempts++;
				if(attempts < 3) {
					var error = new Error("locked");
					error.code = "EBUSY";
					return callback(error);
				}
				callback(null,fileInfo);
			});
			spyOn($tw.utils,"cleanupTiddlerFiles").and.callFake(function(options,callback) {
				callback(null,options.bootInfo);
			});
			var tiddler = new $tw.Tiddler({
				title: "locked-note",
				type: "text/x-markdown",
				text: "Eventually saved"
			});
			wiki.addTiddler(tiddler);
			adaptor.saveTiddler(tiddler,function(error) {
				$tw.hooks.removeHook("th-filesystem-change",changeHook);
				expect(error).toBeFalsy();
				expect(attempts).toBe(3);
				expect(changeInfo.operation).toBe("save");
				expect(changeInfo.title).toBe("locked-note");
				done();
			},{tiddlerInfo: {}});
		});

		it("keeps the same filepath after a persistent Windows-style lock", function(done) {
			var store = $tw.boot.dynamicStores[0];
			store.writeRetry = {attempts: 2,initialDelay: 1,maxDelay: 1};
			spyOn($tw.utils,"saveTiddlerToFile").and.callFake(function(tiddler,fileInfo,callback) {
				var error = new Error("locked");
				error.code = "EPERM";
				error.syscall = "open";
				callback(error);
			});
			var tiddler = new $tw.Tiddler({
				title: "persistently-locked",
				type: "text/x-markdown",
				text: "Keep my path"
			});
			wiki.addTiddler(tiddler);
			adaptor.getTiddlerFileInfo(tiddler,function(error,initialFileInfo) {
				expect(error).toBeFalsy();
				adaptor.saveTiddler(tiddler,function(error) {
					expect(error).toBeTruthy();
					expect($tw.boot.files[tiddler.fields.title].writeError).not.toBe(true);
					adaptor.getTiddlerFileInfo(tiddler,function(error,retryFileInfo) {
						expect(error).toBeFalsy();
						expect(retryFileInfo.filepath).toBe(initialFileInfo.filepath);
						expect(retryFileInfo.filepath).not.toContain("_1.");
						done();
					});
				},{tiddlerInfo: {}});
			});
		});

		it("registers a dynamic store from an in-memory filesInfo specification", function() {
			var injectedDirectory = path.join(tmpRoot,"injected"),
				filepath = path.join(injectedDirectory,"memory.md"),
				ignoredDirectory = path.join(injectedDirectory,"attachments");
			fs.mkdirSync(injectedDirectory);
			fs.mkdirSync(ignoredDirectory);
			fs.writeFileSync(filepath,"In memory\n");
			fs.writeFileSync(path.join(ignoredDirectory,"ignored.md"),"Attachment\n");
			if(process.platform !== "win32") {
				fs.symlinkSync(filepath,path.join(injectedDirectory,"linked.md"));
			}
			var loaded = $tw.loadTiddlersFromSpecification(tmpRoot,$tw.boot.excludeRegExp,{
				directories: [{
					path: "injected",
					filesRegExp: "^.*\\.md$",
					searchSubdirectories: true,
					isTiddlerFile: false,
					fields: {
						title: {source: "basename"},
						type: "text/markdown"
					},
					dynamicStore: {
						saveFilter: "[type[text/markdown]]",
						reselectOnSave: true,
						watch: false,
						watcherProvider: "test-provider",
						ignoredPathRegExp: "^attachments(?:/|$)",
						followSymlinks: false
					}
				}]
			});
			var store = $tw.boot.dynamicStores.filter(function(candidate) {
				return candidate.id === injectedDirectory;
			})[0];
			expect(fs.existsSync(path.join(tmpRoot,"tiddlywiki.files"))).toBe(false);
			expect(loaded.length).toBe(1);
			expect(loaded[0].tiddlers[0].title).toBe("memory");
			expect(loaded[0].dynamicStoreId).toBe(injectedDirectory);
			expect(store.watcherProvider).toBe("test-provider");
			expect(store.ignoredPathRegExp).toBe("^attachments(?:/|$)");
			expect(store.reselectOnSave).toBe(true);
			expect(store.followSymlinks).toBe(false);
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

		it("does not route a tiddler when a save filter returns a different title", function() {
			$tw.boot.dynamicStores[0].saveFilter = "[tag[route-me]]";
			wiki.addTiddler(new $tw.Tiddler({title: "routed", tags: ["route-me"], text: "other tiddler"}));
			wiki.addTiddler(new $tw.Tiddler({title: "not-routed", text: "candidate"}));
			expect(adaptor.findDynamicStoreForTiddler(wiki.getTiddler("not-routed"))).toBeNull();
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

		it("can reselect a dynamic store when a routed tiddler changes", function(done) {
			$tw.boot.dynamicStores[0].reselectOnSave = true;
			$tw.boot.files["movable"] = {
				filepath: path.join(storeDir,"movable.tid"),
				type: "application/x-tiddler",
				hasMetaFile: false,
				isEditableFile: true,
				originalpath: "movable.tid",
				dynamicStoreId: storeDir
			};
			wiki.addTiddler(new $tw.Tiddler({
				title: "movable",
				type: "text/vnd.tiddlywiki",
				text: "Move back to the default store"
			}));
			adaptor.getTiddlerFileInfo(wiki.getTiddler("movable"),function(err,fileInfo) {
				expect(err).toBeFalsy();
				expect(fileInfo.filepath.indexOf(wikiTiddlers)).toBe(0);
				expect(fileInfo.dynamicStoreId).toBeFalsy();
				done();
			});
		});

		// Note: the chokidar watcher's only job is to call processFileEvent in
		// response to fs events. We invoke processFileEvent directly here so the
		// tests don't depend on real fs notifications being delivered (some CI
		// sandboxes do not propagate inotify events to chokidar).

		it("processes external additions, changes and deletions", function(done) {
			var store = $tw.boot.dynamicStores[0],
				changes = [],
				changeHook = function(info) {
					changes.push({operation: info.operation,title: info.title});
					return info;
				};
			$tw.hooks.addHook("th-filesystem-watcher-change",changeHook);
			var filepath = path.join(storeDir,"external.tid");
			fs.writeFileSync(filepath,"title: external\ntype: text/x-markdown\n\nInitial\n");
			adaptor.processFileEvent(store,filepath,"change");
			adaptor.getUpdatedTiddlers({},function(err,updates) {
				expect(err).toBeFalsy();
				expect(updates.modifications).toContain("external");
				adaptor.loadTiddler("external",function(err,fields) {
					expect(err).toBeFalsy();
					expect(fields).toBeTruthy();
					expect(fields.title).toBe("external");
					expect(fields.text).toContain("Initial");
					wiki.addTiddler(new $tw.Tiddler(fields));
					// Edit
					fs.writeFileSync(filepath,"title: external\ntype: text/x-markdown\n\nChanged\n");
					adaptor.processFileEvent(store,filepath,"change");
					adaptor.getUpdatedTiddlers({},function(err,updates) {
						expect(updates.modifications).toContain("external");
						// Delete
						fs.unlinkSync(filepath);
						adaptor.processFileEvent(store,filepath,"unlink");
						adaptor.getUpdatedTiddlers({},function(err,updates) {
							$tw.hooks.removeHook("th-filesystem-watcher-change",changeHook);
							expect(updates.deletions).toContain("external");
							expect(changes).toEqual([
								{operation: "add",title: "external"},
								{operation: "change",title: "external"},
								{operation: "delete",title: "external"}
							]);
							done();
						});
					});
				});
			});
		});

		it("uses an incremental reverse index for files containing multiple tiddlers", function() {
			var filepath = path.join(storeDir,"bundle.json"),
				fileInfo = {
					filepath: filepath,
					type: "application/json",
					hasMetaFile: false,
					isEditableFile: true,
					dynamicStoreId: storeDir
				};
			adaptor.setTiddlerFileInfo("one",fileInfo);
			adaptor.setTiddlerFileInfo("two",fileInfo);
			expect(adaptor.getTitlesForFilepath(filepath).sort()).toEqual(["one","two"]);
			adaptor.removeTiddlerFileInfo("one");
			expect(adaptor.getTitlesForFilepath(filepath)).toEqual(["two"]);
		});

		it("reuses an existing filepath when its stored spelling is equivalent", function() {
			var filepath = path.join(storeDir,"stable.tid"),
				equivalentPath = storeDir + path.sep + "." + path.sep + "stable.tid";
			fs.writeFileSync(filepath,"title: stable\n\nStable\n");
			var generated = $tw.utils.generateTiddlerFilepath("stable",{
				directory: storeDir,
				extension: ".tid",
				fileInfo: {filepath: equivalentPath}
			});
			expect(generated).toBe(filepath);
			expect(generated).not.toContain("_1.tid");
		});

		it("applies tiddlywiki.files field rules when a watched raw file changes", function(done) {
			var store = $tw.boot.dynamicStores[0],
				filepath = path.join(storeDir,"raw-note.md");
			store.filesRegExp = ".*\\.md$";
			store.isTiddlerFile = false;
			store.fields = {
				title: {source: "basename"},
				type: "text/markdown"
			};
			fs.writeFileSync(filepath,"# Raw note\n");
			adaptor.processFileEvent(store,filepath,"change");
			adaptor.getUpdatedTiddlers({},function(err,updates) {
				expect(err).toBeFalsy();
				expect(updates.modifications).toContain("raw-note");
				adaptor.loadTiddler("raw-note",function(err,fields) {
					expect(err).toBeFalsy();
					expect(fields.title).toBe("raw-note");
					expect(fields.type).toBe("text/markdown");
					expect(fields.text).toBe("# Raw note\n");
					done();
				});
			});
		});

		it("accepts an injected watcher provider", function(done) {
			var store = $tw.boot.dynamicStores[0],
				filepath = path.join(storeDir,"provided.tid"),
				watcherOptions,
				closed = false;
			store.watcherProvider = "test-provider";
			adaptor.watcherProviders["test-provider"] = {
				create: function(options) {
					watcherOptions = options;
					return Promise.resolve({
						close: function() {
							closed = true;
						}
					});
				}
			};
			adaptor.setupWatcher(store);
			expect(watcherOptions.directory).toBe(storeDir);
			expect(adaptor.isReady()).toBe(false);
			fs.writeFileSync(filepath,"title: provided\n\nFrom provider\n");
			watcherOptions.onEvent(filepath,"change");
			setTimeout(function() {
				adaptor.getUpdatedTiddlers({},function(err,updates) {
					expect(err).toBeFalsy();
					expect(updates.modifications).toContain("provided");
					expect(adaptor.isReady()).toBe(true);
					adaptor.close().then(function() {
						expect(closed).toBe(true);
						done();
					});
				});
			},store.debounce + 20);
		});

		it("filters provider events with configurable path exclusions", function() {
			var store = $tw.boot.dynamicStores[0];
			store.ignoredPathRegExp = "(^|/)attachments/";
			expect(adaptor.isPathIgnored(store,path.join(storeDir,"attachments","large.pdf"))).toBe(true);
			expect(adaptor.isPathIgnored(store,path.join(storeDir,"notes","note.tid"))).toBe(false);
			expect(adaptor.isPathIgnored(store,path.join(tmpRoot,"outside.tid"))).toBe(true);
		});

		it("moves an opted-in external attachment when routing between stores", function(done) {
			var oldStore = $tw.boot.dynamicStores[0],
				oldRoot = path.join(tmpRoot,"old-wiki"),
				newRoot = path.join(tmpRoot,"new-wiki"),
				newStoreDirectory = path.join(newRoot,"tiddlers"),
				sourcePath = path.join(oldRoot,"files","image.bin"),
				targetPath = path.join(newRoot,"files","image.bin");
			fs.mkdirSync(path.dirname(sourcePath),{recursive: true});
			fs.mkdirSync(newStoreDirectory,{recursive: true});
			fs.writeFileSync(sourcePath,"attachment");
			oldStore.externalAttachments = {
				basePath: oldRoot,
				pathPrefix: "files",
				moveOnRoute: true
			};
			$tw.boot.dynamicStores.push({
				id: newStoreDirectory,
				directory: newStoreDirectory,
				saveFilter: "",
				watch: false,
				externalAttachments: {
					basePath: newRoot,
					pathPrefix: "files",
					moveOnRoute: true
				}
			});
			var tiddler = new $tw.Tiddler({
				title: "external-image",
				_canonical_uri: "files/image.bin",
				text: ""
			});
			adaptor.moveExternalAttachment(tiddler,{
				filepath: path.join(storeDir,"external-image.tid"),
				dynamicStoreId: oldStore.id
			},{
				filepath: path.join(newStoreDirectory,"external-image.tid"),
				dynamicStoreId: newStoreDirectory
			},function() {
				expect(fs.existsSync(sourcePath)).toBe(false);
				expect(fs.readFileSync(targetPath,"utf8")).toBe("attachment");
				done();
			});
		});

		it("suppresses echoes when the file on disk matches the current wiki tiddler", function(done) {
			var store = $tw.boot.dynamicStores[0];
			wiki.addTiddler(new $tw.Tiddler({title: "echo", type: "text/x-markdown", text: "same\n"}));
			var filepath = path.join(storeDir,"echo.tid");
			fs.writeFileSync(filepath,"title: echo\ntype: text/x-markdown\n\nsame\n");
			adaptor.processFileEvent(store,filepath,"change");
			adaptor.getUpdatedTiddlers({},function(err,updates) {
				expect(updates.modifications).not.toContain("echo");
				done();
			});
		});

		it("suppresses a delayed self-write echo after the in-memory tiddler has changed", function(done) {
			var store = $tw.boot.dynamicStores[0],
				filepath = path.join(storeDir,"typing.tid");
			fs.writeFileSync(filepath,"title: typing\ntype: text/x-markdown\n\nSaved\n");
			adaptor.recordFileWrite({
				filepath: filepath,
				hasMetaFile: false
			});
			// This is the data-loss race: a newer keystroke reaches the wiki
			// before the watcher reports the older version just saved to disk.
			wiki.addTiddler(new $tw.Tiddler({
				title: "typing",
				type: "text/x-markdown",
				text: "Newer unsaved edit"
			}));
			adaptor.scheduleFileEvent(store,filepath,"change");
			// chokidar can deliver more than one notification for a write.
			adaptor.scheduleFileEvent(store,filepath,"change");
			setTimeout(function() {
				adaptor.getUpdatedTiddlers({},function(err,updates) {
					expect(err).toBeFalsy();
					expect(updates.modifications).not.toContain("typing");
					done();
				});
			},store.debounce + 20);
		});

		it("reloads a tiddler when its companion metadata file is deleted", function(done) {
			var store = $tw.boot.dynamicStores[0],
				filepath = path.join(storeDir,"sidecar.txt"),
				metaPath = filepath + ".meta";
			store.isTiddlerFile = false;
			store.filesRegExp = ".*\\.txt$";
			fs.writeFileSync(filepath,"body");
			fs.writeFileSync(metaPath,"title: sidecar\ncaption: Before\n");
			adaptor.setTiddlerFileInfo("sidecar",{
				filepath: filepath,
				type: "text/plain",
				hasMetaFile: true,
				isEditableFile: true,
				dynamicStoreId: store.id
			});
			wiki.addTiddler(new $tw.Tiddler({
				title: "sidecar",
				caption: "Before",
				text: "body"
			}));
			fs.unlinkSync(metaPath);
			adaptor.scheduleFileEvent(store,metaPath,"unlink");
			setTimeout(function() {
				adaptor.getUpdatedTiddlers({},function(err,updates) {
					expect(err).toBeFalsy();
					expect(updates.modifications).toContain("sidecar");
					expect(updates.deletions).not.toContain("sidecar");
					adaptor.loadTiddler("sidecar",function(err,fields) {
						expect(err).toBeFalsy();
						expect(fields.title).toBe("sidecar");
						expect(fields.caption).toBeUndefined();
						expect(fields.text).toBe("body");
						done();
					});
				});
			},store.debounce + 20);
		});

		it("treats an unlink notification as a change when the file has been recreated", function(done) {
			var store = $tw.boot.dynamicStores[0],
				filepath = path.join(storeDir,"atomic.tid");
			adaptor.setTiddlerFileInfo("atomic",{
				filepath: filepath,
				type: "application/x-tiddler",
				hasMetaFile: false,
				isEditableFile: true,
				dynamicStoreId: store.id
			});
			wiki.addTiddler(new $tw.Tiddler({title: "atomic", text: "Before"}));
			fs.writeFileSync(filepath,"title: atomic\n\nAfter\n");
			adaptor.processFileEvent(store,filepath,"unlink");
			adaptor.getUpdatedTiddlers({},function(err,updates) {
				expect(err).toBeFalsy();
				expect(updates.modifications).toContain("atomic");
				expect(updates.deletions).not.toContain("atomic");
				done();
			});
		});
	});
}
