/*\
title: test-wikitext-blanklines.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for preserving extra blank lines as empty paragraph blocks.

\*/

"use strict";

describe("Wikitext blank line preservation", function() {
	const PRESERVE_BLANK_LINES_CONFIG = "$:/config/Parser/PreserveBlankLines";

	function parse(text, options) {
		options = options || { preserveBlankLines: true };
		return $tw.wiki.parseText("text/vnd.tiddlywiki", text, options).tree;
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

	it("should leave extra blank lines ignored when disabled", function() {
		const tree = parse("A\n\n\nB", { preserveBlankLines: false });
		expect(tree.length).toBe(2);
		expect(tree.map(function(node) { return node.rule; })).toEqual(["parseblock", "parseblock"]);
	});

	it("should use the parser config when no explicit option is provided", function() {
		const previousTiddler = $tw.wiki.getTiddler(PRESERVE_BLANK_LINES_CONFIG);
		try {
			$tw.wiki.addTiddler({title: PRESERVE_BLANK_LINES_CONFIG, text: "no"});
			expect(parse("A\n\n\nB", {}).map(function(node) { return node.rule; })).toEqual(["parseblock", "parseblock"]);
			$tw.wiki.addTiddler({title: PRESERVE_BLANK_LINES_CONFIG, text: "yes"});
			expect(parse("A\n\n\nB", {}).map(function(node) { return node.rule; })).toEqual(["parseblock", "blankline", "parseblock"]);
		} finally{
			if(previousTiddler) {
				$tw.wiki.addTiddler(previousTiddler);
			} else {
				$tw.wiki.deleteTiddler(PRESERVE_BLANK_LINES_CONFIG);
			}
		}
	});

	it("should preserve extra blank lines as empty paragraphs", function() {
		expect(paragraphCount("A\n\n\nB")).toBe(3);
		expect(parse("A\n\n\nB")[1].attributes.class.value).toBe("tc-blankline");
		expect(serialize("A\n\n\nB")).toBe("A\n\n\nB\n\n");
		expect(paragraphCount("A\n\n\n\nB")).toBe(4);
		expect(serialize("A\n\n\n\nB")).toBe("A\n\n\n\nB\n\n");
	});

	it("should preserve extra blank lines after non-paragraph blocks", function() {
		var listThenParagraph = parse("* one\n* two\n\n\n\nB");
		expect(listThenParagraph.map(function(node) { return node.rule; })).toEqual(["list", "blankline", "blankline", "parseblock"]);
		expect(serialize("* one\n* two\n\n\n\nB")).toBe("* one\n* two\n\n\n\nB\n\n");

		var listThenMacro = parse("* one\n* two\n\n\n\n<<now YYYY>>");
		expect(listThenMacro.map(function(node) { return node.rule; })).toEqual(["list", "blankline", "blankline", "macrocallblock"]);
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