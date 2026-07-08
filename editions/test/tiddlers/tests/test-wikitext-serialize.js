/*\
title: test-wikitext-serialize.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the wikitext inverse-rendering from Wiki AST.

\*/

describe("WikiAST serialization unit tests", function () {
	var cases = $tw.wiki.filterTiddlers("[all[shadows+tiddlers]tag[$:/tags/wikitext-serialize-test-spec]]");
	$tw.utils.each(cases, function (title) {
		it("should serialize correctly for " + title, function () {
			var parser = $tw.wiki.parseTiddler(title);
			var serialized = $tw.utils.serializeWikitextParseTree(parser.tree,{source: parser.source}).trimEnd();
			expect(serialized).toBe($tw.wiki.getTiddlerText(title).trimEnd());
		});
	});
});

/*
Normalization tests: the input cannot round-trip byte-identical because the
AST does not record the distinguishing surface detail. Each compound tiddler
(type text/vnd.tiddlywiki-multiple) holds an "Input" and an "ExpectedOutput"
subtiddler. An Input field "mode: canonical" tests the fallback serialization
without source access; the default tests fidelity mode with the source.
*/
describe("WikiAST serialization normalization tests", function () {
	var cases = $tw.wiki.filterTiddlers("[all[shadows+tiddlers]type[text/vnd.tiddlywiki-multiple]tag[$:/tags/wikitext-serialize-normalize-spec]]");
	$tw.utils.each(cases, function (title) {
		it("should normalize correctly for " + title, function () {
			var subTiddlers = {};
			$tw.utils.each(readMultipleTiddlersTiddler(title), function (fields) {
				subTiddlers[fields.title] = fields;
			});
			if(!subTiddlers.Input) {
				throw "Missing 'Input' subtiddler";
			}
			if(!subTiddlers.ExpectedOutput) {
				throw "Missing 'ExpectedOutput' subtiddler";
			}
			var input = subTiddlers.Input.text || "",
				parser = $tw.wiki.parseText("text/vnd.tiddlywiki",input),
				options = subTiddlers.Input.mode === "canonical" ? {} : {source: input},
				serialized = $tw.utils.serializeWikitextParseTree(parser.tree,options);
			expect(serialized.trimEnd()).toBe((subTiddlers.ExpectedOutput.text || "").trimEnd());
		});
	});

	function readMultipleTiddlersTiddler(title) {
		var rawTiddlers = $tw.wiki.getTiddlerText(title).split(/\r?\n\+\r?\n/mg);
		var tiddlers = [];
		$tw.utils.each(rawTiddlers,function(rawTiddler) {
			var fields = Object.create(null),
				split = rawTiddler.split(/\r?\n\r?\n/mg);
			if(split.length >= 1) {
				fields = $tw.utils.parseFields(split[0],fields);
			}
			if(split.length >= 2) {
				fields.text = split.slice(1).join("\n\n");
			}
			tiddlers.push(fields);
		});
		return tiddlers;
	}
});
