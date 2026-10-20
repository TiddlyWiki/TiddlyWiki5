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
		expect(serialize("A\n\nB")).toBe("A\n\nB");
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
		expect(serialize("A\n\n\nB")).toBe("A\n\n\nB");
		expect(paragraphCount("A\n\n\n\nB")).toBe(4);
		expect(serialize("A\n\n\n\nB")).toBe("A\n\n\n\nB");
	});

	it("should preserve extra blank lines after non-paragraph blocks", function() {
		var listThenParagraph = parse("* one\n* two\n\n\n\nB");
		expect(listThenParagraph.map(function(node) { return node.rule; })).toEqual(["list", "blankline", "blankline", "parseblock"]);
		expect(serialize("* one\n* two\n\n\n\nB")).toBe("* one\n* two\n\n\n\nB");

		var listThenMacro = parse("* one\n* two\n\n\n\n<<now YYYY>>");
		expect(listThenMacro.map(function(node) { return node.rule; })).toEqual(["list", "blankline", "blankline", "macrocallblock"]);
	});

	it("should preserve extra blank lines after blocks that consume their line end", function() {
		// The block span ends before the line end these rules consume, so the blank run starts inside the consumed part
		$tw.utils.each([
			["|a|\n\n\nB", ["table", "blankline", "parseblock"]],
			["---\n\n\nB", ["horizrule", "blankline", "parseblock"]],
			["{{X}}\n\n\nB", ["transcludeblock", "blankline", "parseblock"]]
		], function(testCase) {
			expect(parse(testCase[0]).map(function(node) { return node.rule; })).toEqual(testCase[1]);
			expect(serialize(testCase[0])).toBe(testCase[0]);
		});
	});

	it("should not count the blank line that opens a block body", function() {
		function bodyRules(text, getBody) {
			return getBody(parse(text)[0]).map(function(node) { return node.rule; });
		}
		var htmlBody = function(node) { return node.children; },
			ifBody = function(node) { return node.children[0].children; };
		expect(bodyRules("<div>\n\nfoo\n</div>", htmlBody)).toEqual(["parseblock"]);
		expect(bodyRules("<div>\n\n\nfoo\n</div>", htmlBody)).toEqual(["blankline", "parseblock"]);
		expect(serialize("<div>\n\n\nfoo\n</div>")).toBe("<div>\n\n\nfoo\n</div>");
		expect(bodyRules("<%if [[x]]%>\n\nfoo\n<%endif%>", ifBody)).toEqual(["parseblock"]);
		expect(bodyRules("<%if [[x]]%>\n\n\nfoo\n<%endif%>", ifBody)).toEqual(["blankline", "parseblock"]);
		expect(bodyRules("<<<\n\nfoo\n<<<", htmlBody)).toEqual(["blankline", "parseblock"]);
		expect(serialize("<<<\n\nfoo\n<<<")).toBe("<<<\n\nfoo\n<<<");
	});

	it("should mark only the first blank line of the whole text as leading", function() {
		// A serializer doubles the newline of a leading blank line; inside a container the marker line already ended
		expect(parse("\n\nA")[0].isLeadingBlankLine).toBe(true);
		expect(parse("<<<\n\n\nfoo\n<<<")[0].children[0].isLeadingBlankLine).toBe(false);
		expect(parse("<div>\n\n\nfoo\n</div>")[0].children[0].isLeadingBlankLine).toBe(false);
	});

	it("should preserve trailing empty paragraphs", function() {
		expect(paragraphCount("A\n\n\n")).toBe(2);
		expect(serialize("A\n\n\n")).toBe("A\n\n\n");
	});

	it("should not turn a single leading newline into an empty paragraph", function() {
		expect(paragraphCount("\nA")).toBe(1);
		expect(serialize("\nA")).toBe("A");
	});

	it("should preserve leading empty paragraphs when there are two or more leading newlines", function() {
		expect(paragraphCount("\n\nA")).toBe(2);
		expect(serialize("\n\nA")).toBe("\n\nA");
		expect(paragraphCount("\n\n\nA")).toBe(3);
		expect(serialize("\n\n\nA")).toBe("\n\n\nA");
	});
});