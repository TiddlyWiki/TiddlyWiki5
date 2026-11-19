/*\
title: test-wikitext-blankline-parser-contract.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for preserving extra blank lines as empty paragraph blocks.

\*/

"use strict";

describe("Wikitext blank line parsing contract", function() {
	var PRESERVE_BLANK_LINES_CONFIG = "$:/config/Parser/PreserveBlankLines";

	function parse(text, options) {
		options = options || { preserveBlankLines: true };
		return $tw.wiki.parseText("text/vnd.tiddlywiki", text, options).tree;
	}

	function paragraphCount(text) {
		return parse(text).filter(function(node) {
			return node.type === "element" && node.tag === "p";
		}).length;
	}

	it("should keep a single blank line as a paragraph separator", function() {
		expect(paragraphCount("A\n\nB")).toBe(2);
	});

	it("should leave extra blank lines ignored when disabled", function() {
		var tree = parse("A\n\n\nB", { preserveBlankLines: false });
		expect(tree.length).toBe(2);
		expect(tree.map(function(node) { return node.rule; })).toEqual(["parseblock", "parseblock"]);
	});

	it("should use the parser config when no explicit option is provided", function() {
		var previousTiddler = $tw.wiki.getTiddler(PRESERVE_BLANK_LINES_CONFIG);
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
		expect(paragraphCount("A\n\n\n\nB")).toBe(4);
	});

	it("should preserve extra blank lines after non-paragraph blocks", function() {
		var listThenParagraph = parse("* one\n* two\n\n\n\nB");
		expect(listThenParagraph.map(function(node) { return node.rule; })).toEqual(["list", "blankline", "blankline", "parseblock"]);

		var listThenMacro = parse("* one\n* two\n\n\n\n<<now YYYY>>");
		expect(listThenMacro.map(function(node) { return node.rule; })).toEqual(["list", "blankline", "blankline", "macrocallblock"]);
	});

	it("should preserve trailing empty paragraphs", function() {
		expect(paragraphCount("A\n\n\n")).toBe(2);
	});

	it("should not turn a single leading newline into an empty paragraph", function() {
		expect(paragraphCount("\nA")).toBe(1);
	});

	it("should preserve leading empty paragraphs when there are two or more leading newlines", function() {
		expect(paragraphCount("\n\nA")).toBe(2);
		expect(paragraphCount("\n\n\nA")).toBe(3);
	});

	["\n", "\r\n"].forEach(function(lineEnd) {
		describe(lineEnd === "\n" ? "LF" : "CRLF", function() {
			function source(text) {
				return text.replace(/\n/g,lineEnd);
			}

			function rules(text) {
				return parse(source(text)).map(function(node) { return node.rule; });
			}

			it("anchors separate empty paragraphs to their own source lines", function() {
				[
					["\n\n\nA", [1,2]],
					["A\n\n\n\nB", [3,4]],
					["A\n\n\n\n", [3,4]],
					["\n\n\n", [1,2]],
					["|a|\n \t\n\t\nB", [8]],
					["|a|\n\n\n\nB", [5,6]]
				].forEach(function(testCase) {
					var input = source(testCase[0]),
						blanks = parse(input).filter(function(node) { return node.rule === "blankline"; }),
						expected = testCase[1].map(function(offset) { return source(testCase[0].slice(0,offset)).length; });
					expect(blanks.map(function(node) { return node.start; })).toEqual(expected);
					expect(blanks.map(function(node) { return node.end; })).toEqual(expected);
				});
			});

			it("keeps nested empty paragraph anchors inside their own block body", function() {
				["<div>\n\n\n\nInside\n</div>", "<<<\n\n\nInside\n<<<"].forEach(function(text) {
					var input = source(text),
						blanks = parse(input)[0].children.filter(function(node) { return node.rule === "blankline"; }),
						bodyStart = input.indexOf(lineEnd) + lineEnd.length;
					expect(blanks.length).toBe(2);
					blanks.forEach(function(node,index) {
						expect(node.start).toBe(bodyStart + (text.slice(0,4) === "<div" ? index + 1 : index) * lineEnd.length);
						expect(node.end).toBe(node.start);
					});
				});
			});

			it("counts the entire whitespace run after a block only once", function() {
				["|a|", "---", "{{X}}", "* one", "<<now YYYY>>"].forEach(function(block) {
					var tree = parse(source(block + "\n\n\nB"));
					expect(tree.length).toBe(3);
					expect(tree[1].rule).toBe("blankline");
					expect(tree[2].rule).toBe("parseblock");
				});
				expect(rules("|a|\n \t\n\t\nB")).toEqual(["table", "blankline", "parseblock"]);
			});

			it("excludes the HTML opening tag's line end from the body blank lines", function() {
				var body = parse(source("<div>\n\nfoo\n</div>"))[0].children;
				expect(body.map(function(node) { return node.rule; })).toEqual(["parseblock"]);
				body = parse(source("<div>\n\n\nfoo\n</div>"))[0].children;
				expect(body.map(function(node) { return node.rule; })).toEqual(["blankline", "parseblock"]);
			});

			it("excludes if, elseif and else marker line ends from body blank lines", function() {
				["\n\n", "\n\n\n"].forEach(function(gap) {
					var text = "<%if [[x]]%>" + gap + "yes\n<%elseif [[y]]%>" + gap + "maybe\n<%else%>" + gap + "no\n<%endif%>",
						condition = parse(source(text))[0],
						elseif = condition.children[1].children[0],
						expected = gap.length === 2 ? ["parseblock"] : ["blankline", "parseblock"];
					expect(condition.children[0].children.map(function(node) { return node.rule; })).toEqual(expected);
					expect(elseif.children[0].children.map(function(node) { return node.rule; })).toEqual(expected);
					expect(elseif.children[1].children.map(function(node) { return node.rule; })).toEqual(expected);
				});
			});

			it("marks a leading blank line only at the root", function() {
				var tree = parse(source("\n\n\nA"));
				expect(tree[0].isLeadingBlankLine).toBe(true);
				expect(tree[1].isLeadingBlankLine).toBe(false);
				["<<<\n\nfoo\n<<<", "<div>\n\n\nfoo\n</div>"].forEach(function(text) {
					expect(parse(source(text))[0].children[0].isLeadingBlankLine).toBe(false);
				});
				expect(parse(source("<%if [[x]]%>\n\n\nfoo\n<%endif%>"))[0].children[0].children[0].isLeadingBlankLine).toBe(false);
			});

			it("handles whitespace-only input and trailing blank lines", function() {
				expect(rules("\n")).toEqual([]);
				expect(rules("\n\n")).toEqual(["blankline"]);
				expect(rules("A\n\n\n")).toEqual(["parseblock", "blankline"]);
				expect(rules("|a|\n\n\n")).toEqual(["table", "blankline"]);
			});
		});
	});

	it("lets an explicit false override the wiki configuration in nested blocks", function() {
		var previous = $tw.wiki.getTiddler(PRESERVE_BLANK_LINES_CONFIG);
		try {
			$tw.wiki.addTiddler({title: PRESERVE_BLANK_LINES_CONFIG, text: "yes"});
			var tree = parse("<div>\n\nA\n\n\nB\n</div>", {preserveBlankLines: false});
			expect(tree[0].children.map(function(node) { return node.rule; })).toEqual(["parseblock", "parseblock"]);
		} finally{
			if(previous) {
				$tw.wiki.addTiddler(previous);
			} else {
				$tw.wiki.deleteTiddler(PRESERVE_BLANK_LINES_CONFIG);
			}
		}
	});

	it("keeps whitespace-only inline parsing unchanged", function() {
		expect(parse("\n\n", {parseAsInline: true, preserveBlankLines: true})).toEqual([]);
	});
});
