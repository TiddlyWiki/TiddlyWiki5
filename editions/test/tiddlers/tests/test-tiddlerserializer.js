/*\
title: test-tiddlerserializer.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for pluggable tiddler serializer modules.

\*/

/* eslint-env node, browser, jasmine */
"use strict";

describe("tiddlerserializer tests", function() {
	if(!$tw.node) {
		it("should only run in node.js", function() {
			expect(true).toBe(true);
		});
		return;
	}

	var fs = require("fs"),
		os = require("os"),
		path = require("path");

	it("should expose tiddlerSerializerModules registry", function() {
		expect($tw.Wiki.tiddlerSerializerModules).toBeDefined();
	});

	it("should avoid meta files when serializer exists for content type", function() {
		var oldSerializer = $tw.Wiki.tiddlerSerializerModules["text/x-markdown"],
			tiddler = new $tw.Tiddler({
				title: "Serializer Test",
				type: "text/x-markdown",
				text: "Hello"
			});
		$tw.Wiki.tiddlerSerializerModules["text/x-markdown"] = function() {
			return "---\ntitle: Serializer Test\n---\n\nHello";
		};
		var fileInfo = $tw.utils.generateTiddlerFileInfo(tiddler,{
			directory: os.tmpdir()
		});
		expect(fileInfo.type).toBe("text/x-markdown");
		expect(fileInfo.hasMetaFile).toBe(false);
		if(oldSerializer) {
			$tw.Wiki.tiddlerSerializerModules["text/x-markdown"] = oldSerializer;
		} else {
			delete $tw.Wiki.tiddlerSerializerModules["text/x-markdown"];
		}
	});

	it("should save using serializer output for custom type", function() {
		var oldSerializer = $tw.Wiki.tiddlerSerializerModules["text/x-markdown"],
			tiddler = new $tw.Tiddler({
				title: "Serializer Save Test",
				type: "text/x-markdown",
				text: "Body"
			}),
			tempDir = fs.mkdtempSync(path.join(os.tmpdir(),"tw-serializer-test-")),
			filepath = path.join(tempDir,"Serializer Save Test.md");
		$tw.Wiki.tiddlerSerializerModules["text/x-markdown"] = function() {
			return "---\ntitle: Serializer Save Test\n---\n\nBody";
		};
		$tw.utils.saveTiddlerToFileSync(tiddler,{
			filepath: filepath,
			type: "text/x-markdown",
			hasMetaFile: false
		});
		expect(fs.readFileSync(filepath,"utf8")).toBe("---\ntitle: Serializer Save Test\n---\n\nBody");
		expect(fs.existsSync(filepath + ".meta")).toBe(false);
		fs.unlinkSync(filepath);
		fs.rmdirSync(tempDir);
		if(oldSerializer) {
			$tw.Wiki.tiddlerSerializerModules["text/x-markdown"] = oldSerializer;
		} else {
			delete $tw.Wiki.tiddlerSerializerModules["text/x-markdown"];
		}
	});

	it("should remove old meta file when migrating markdown on save", function(done) {
		var tempDir = fs.mkdtempSync(path.join(os.tmpdir(),"tw-meta-migrate-test-")),
			filepath = path.join(tempDir,"Migrating Tiddler.md"),
			metafilepath = filepath + ".meta";
		fs.writeFileSync(filepath,"old body","utf8");
		fs.writeFileSync(metafilepath,"title: Migrating Tiddler\ntype: text/x-markdown","utf8");
		$tw.utils.cleanupTiddlerFiles({
			adaptorInfo: {
				filepath: filepath,
				hasMetaFile: true
			},
			bootInfo: {
				filepath: filepath,
				hasMetaFile: false
			},
			title: "Migrating Tiddler"
		},function(err) {
			expect(err).toBeNull();
			expect(fs.existsSync(filepath)).toBe(true);
			expect(fs.existsSync(metafilepath)).toBe(false);
			fs.unlinkSync(filepath);
			fs.rmdirSync(tempDir);
			done();
		});
	});
});
