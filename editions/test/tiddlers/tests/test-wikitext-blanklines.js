/*\
title: test-wikitext-blanklines.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for preserving extra blank lines as empty paragraph blocks.

\*/

"use strict";

describe("Wikitext blank line preservation", function() {
	function parse(text) {
		return $tw.wiki.parseText("text/vnd.tiddlywiki", text, { preserveBlankLines: true }).tree;
	}

	function serialize(text) {
		return $tw.utils.serializeWikitextParseTree(parse(text));
	}

	function paragraphCount(text) {
		return parse(text).filter(function(node) {
			return node.type === "element" && node.tag === "p";
		}).length;
	}

	it("should keep a single blank line as a paragraph separator", function() {
		expect(paragraphCount("A\n\nB")).toBe(2);
		expect(serialize("A\n\nB")).toBe("A\n\nB\n\n");
	});

	it("should leave extra blank lines ignored by default", function() {
		const tree = $tw.wiki.parseText("text/vnd.tiddlywiki", "A\n\n\nB").tree;
		expect(tree.length).toBe(2);
		expect(tree.map(function(node) { return node.rule; })).toEqual(["parseblock", "parseblock"]);
	});

	it("should preserve extra blank lines as empty paragraphs", function() {
		expect(paragraphCount("A\n\n\nB")).toBe(3);
		expect(serialize("A\n\n\nB")).toBe("A\n\n\nB\n\n");
		expect(paragraphCount("A\n\n\n\nB")).toBe(4);
		expect(serialize("A\n\n\n\nB")).toBe("A\n\n\n\nB\n\n");
	});

	it("should preserve trailing empty paragraphs", function() {
		expect(paragraphCount("A\n\n\n")).toBe(2);
		expect(serialize("A\n\n\n")).toBe("A\n\n\n");
	});

	it("should not turn a single leading newline into an empty paragraph", function() {
		expect(paragraphCount("\nA")).toBe(1);
		expect(serialize("\nA")).toBe("A\n\n");
	});

	it("should preserve leading empty paragraphs when there are two or more leading newlines", function() {
		expect(paragraphCount("\n\nA")).toBe(2);
		expect(serialize("\n\nA")).toBe("\n\nA\n\n");
		expect(paragraphCount("\n\n\nA")).toBe(3);
		expect(serialize("\n\n\nA")).toBe("\n\n\nA\n\n");
	});
});