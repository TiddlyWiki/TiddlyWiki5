/*\
title: test-parsetree-positions.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Regression tests for #9882: wikitext parser rules must emit accurate
`start`/`end` source positions on their parse tree nodes. Tooling that maps
rendered output back to the source text relies on these offsets.

\*/

"use strict";

describe("Parse tree source position tests (#9882)", function() {

	// Create a wiki
	var wiki = $tw.test.wiki();

	// Define a parsing shortcut
	var parse = function(text) {
		return wiki.parseText("text/vnd.tiddlywiki",text).tree;
	};

	it("should give inline code runs a text node that spans only the code, not the backticks", function() {
		// codeinline.js: `code` gives a text node "code" spanning offsets 1 to 5. The closing backtick at 5 is excluded.
		// Bug: `end` was set to `this.parser.pos`, which sits past the closing backtick, so end was 6 and the span swallowed the backtick.
		expect(parse("`code`")).toEqual(
			[ { type: "element", tag: "p", rule: "parseblock", start: 0, end: 6, children: [ { type: "element", tag: "code", rule: "codeinline", start: 0, end: 6, children: [ { type: "text", text: "code", start: 1, end: 5 } ] } ] } ]
		);
		// ``a`b`` gives text "a`b" spanning 2 to 5. `end` must be the offset of the closing marker whatever its length.
		// Bug: `end` was `this.parser.pos` (7), two characters past the code, so it also swallowed the closing ``.
		expect(parse("``a`b``")).toEqual(
			[ { type: "element", tag: "p", rule: "parseblock", start: 0, end: 7, children: [ { type: "element", tag: "code", rule: "codeinline", start: 0, end: 7, children: [ { type: "text", text: "a`b", start: 2, end: 5 } ] } ] } ]
		);
	});

	it("should start the text node of a suppressed external link after the ~", function() {
		// extlink.js: ~https://example.com/ emits the plain text "https://example.com/", which spans offsets 1 to 21.
		// Bug: `start` was the offset of the ~ (0), so the span was one character too wide and began on the ~ that the text omits.
		expect(parse("~https://example.com/")).toEqual(
			[ { type: "element", tag: "p", rule: "parseblock", start: 0, end: 21, children: [ { type: "text", text: "https://example.com/", start: 1, end: 21, rule: "extlink" } ] } ]
		);
	});

	it("should give a suppressed wikilink's text node source positions", function() {
		// wikilinkprefix.js: ~SuppressedLink emits the plain text "SuppressedLink", spanning offsets 1 to 15.
		// Bug: the text node carried no `start`/`end` at all. The parser framework then defaulted `start` to the ~ offset (0).
		expect(parse("~SuppressedLink")).toEqual(
			[ { type: "element", tag: "p", rule: "parseblock", start: 0, end: 15, children: [ { type: "text", text: "SuppressedLink", start: 1, end: 15, rule: "wikilinkprefix" } ] } ]
		);
	});

	it("should record the filter's start offset for an \\import pragma", function() {
		// import.js: \import [tag[x]] records the filter value "[tag[x]]" starting at offset 8, right after "\import ".
		// Bug: `filterStart` was assigned `this.parser.source` (the whole source string) instead of `this.parser.pos`, so `start` was a string, not an offset.
		expect(parse("\\import [tag[x]]\n")).toEqual(
			[ { type: "importvariables", rule: "import", start: 0, end: 16, attributes: { filter: { type: "string", value: "[tag[x]]", start: 8, end: 16 } }, children: [] } ]
		);
	});
});
