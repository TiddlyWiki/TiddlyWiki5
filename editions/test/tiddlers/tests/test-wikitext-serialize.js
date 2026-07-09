/*\
title: test-wikitext-serialize.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the wikitext inverse-rendering from Wiki AST.

\*/

/*
Fidelity round-trip: with the original source supplied, serialization must
reproduce every fixture byte-exact (modulo trailing whitespace).

Reproduce a single case by hand in the browser F12 console (any wiki with
the wikitext-serialize plugin installed, e.g. the test edition):

	var parser = $tw.wiki.parseTiddler("Serialize/Table-docs");
	var output = $tw.utils.serializeWikitextParseTree(parser.tree,{source: parser.source});
	output.trimEnd() === $tw.wiki.getTiddlerText("Serialize/Table-docs").trimEnd(); // true
*/
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
(type text/vnd.tiddlywiki-multiple) holds an "Input" and an "ExpectedWikitext"
subtiddler. An Input field "mode: ast-only" tests the fallback serialization
without source access; the default tests fidelity mode with the source.

Reproduce a single pair by hand in the browser F12 console: copy the Input
subtiddler text into a variable, then

	var parser = $tw.wiki.parseText("text/vnd.tiddlywiki",input);
	var output = $tw.utils.serializeWikitextParseTree(parser.tree,{source: input});
	// mode: ast-only pairs omit the source: serializeWikitextParseTree(parser.tree)
	output.trimEnd(); // must equal the ExpectedWikitext text, trimmed
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
			if(!subTiddlers.ExpectedWikitext) {
				throw "Missing 'ExpectedWikitext' subtiddler";
			}
			var input = subTiddlers.Input.text || "",
				parser = $tw.wiki.parseText("text/vnd.tiddlywiki",input),
				options = subTiddlers.Input.mode === "ast-only" ? {} : {source: input},
				serialized = $tw.utils.serializeWikitextParseTree(parser.tree,options);
			expect(serialized.trimEnd()).toBe((subTiddlers.ExpectedWikitext.text || "").trimEnd());
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

/*
AST-only semantic sweep.

This block enforces the universal serializer guarantee: EVERY rule must be
able to produce parseable, semantically equivalent wikitext from the parse
tree alone, without access to the original source. Fidelity (byte-exact)
output is covered by the identity tests above; here the serializer runs with
no `source` option, so every rule exercises its tree-only fallback path.

Byte equality is deliberately NOT asserted. The tree-only path is allowed to
normalize appearance (quote styles, merge marker direction, blank lines), as
long as re-parsing its output yields an equivalent tree. "Equivalent" means
deep-equal after removing the position fields, which necessarily refer to
two different strings.

Reproduce a single case by hand in the browser F12 console (any wiki with
the wikitext-serialize plugin installed, e.g. the test edition):

	var text = $tw.wiki.getTiddlerText("Serialize/Table-docs");
	var tree = $tw.wiki.parseText("text/vnd.tiddlywiki",text).tree;
	var output = $tw.utils.serializeWikitextParseTree(tree); // no source: AST-only
	var retree = $tw.wiki.parseText("text/vnd.tiddlywiki",output).tree;
	// tree and retree must match, ignoring the position fields listed below
	console.log(JSON.stringify(tree,null,1), JSON.stringify(retree,null,1));
*/
describe("WikiAST serialization AST-only semantic tests", function () {
	var positionFields = ["start","end","openTagStart","openTagEnd","closeTagStart","closeTagEnd"];
	/*
	Test scaffolding: clone a parse tree without the position fields, so the
	cached parser trees stay untouched.
	orderedAttributes are sorted by name because insertion order is an
	artifact of the source syntax, not semantics: parsing `|>|Cell9 |`
	records colspan before align, while the AST-only table emitter writes
	`|Cell9 |<|`, which records align before colspan. Both render
	identically; attributes are consumed by name.
	Keys holding undefined are dropped so the comparison does not depend on
	the assertion framework treating undefined and absent keys as equal
	(jasmine toEqual does, assert.deepStrictEqual does not).
	*/
	function stripPositions(node) {
		if($tw.utils.isArray(node)) {
			return node.map(stripPositions);
		}
		if(!node || typeof node !== "object") {
			return node;
		}
		var result = {};
		$tw.utils.each(node,function(value,key) {
			if(positionFields.indexOf(key) === -1 && value !== undefined) {
				if(key === "orderedAttributes") {
					value = value.slice().sort(function(a,b) {
						return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
					});
				}
				result[key] = stripPositions(value);
			}
		});
		return result;
	}
	var cases = $tw.wiki.filterTiddlers("[all[shadows+tiddlers]tag[$:/tags/wikitext-serialize-test-spec]]");
	$tw.utils.each(cases, function (title) {
		it("should serialize a semantically equivalent tree for " + title, function () {
			var parser = $tw.wiki.parseTiddler(title);
			var serialized = $tw.utils.serializeWikitextParseTree(parser.tree);
			var reparsed = $tw.wiki.parseText("text/vnd.tiddlywiki",serialized);
			expect(stripPositions(reparsed.tree)).toEqual(stripPositions(parser.tree));
		});
	});
});
