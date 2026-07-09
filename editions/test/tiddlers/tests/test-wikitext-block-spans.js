/*\
title: test-wikitext-block-spans.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Span discipline: a block node's span must end at its last syntactic byte.
Line ends and blank lines that separate blocks belong to the gaps between
sibling spans, never inside a span. Without this, every consumer that maps
spans back to syntax has to know per rule whether the trailing line end was
consumed, and a serializer must repair or trim tails per rule.

One spec per block rule (and one per pragma rule, whose spans must also end
at their own syntax before the chained children begin), so a red spec names
the offending rule directly.

Reproduce a single case in the browser F12 console, e.g. for the table:

	var tree = $tw.wiki.parseText("text/vnd.tiddlywiki","|a|b|\n|c|d|\n\nafter").tree;
	var table = tree[0];
	// the span must end at the last "|", not after the newline:
	"\n\r".indexOf($tw.wiki.getTiddlerText !== null && "|a|b|\n|c|d|\n\nafter".charAt(table.end - 1)) === -1

\*/

"use strict";

describe("WikiText block span tests", function() {

	var wiki = $tw.test.wiki();

	/*
	Find the first node with the given rule name, depth first
	*/
	function findRule(nodes,rule) {
		var found = null;
		$tw.utils.each(nodes,function(node) {
			if(node.rule === rule) {
				found = node;
				return false;
			}
			if(node.children) {
				found = findRule(node.children,rule);
				return !found;
			}
		});
		return found;
	}

	/*
	Parse the source, locate the rule's node and assert its span covers
	exactly the construct: it starts at the first syntactic byte (all
	specimens place the construct at position 0) and it does not end at a
	consumed line end
	*/
	function expectCleanSpanEnd(source,rule) {
		var tree = wiki.parseText("text/vnd.tiddlywiki",source).tree;
		var node = findRule(tree,rule);
		expect(node ? node.rule : "NODE NOT FOUND for " + rule).toBe(rule);
		if(node.start !== 0) {
			expect(rule + " span starts at " + node.start).toBe(rule + " span starts at its first syntactic byte");
		}
		var lastByte = source.charAt(node.end - 1);
		if(lastByte === "\n" || lastByte === "\r") {
			// Fail with a readable message naming the offending span
			expect(rule + " span " + node.start + ".." + node.end + " ends with " + JSON.stringify(lastByte)).toBe(rule + " span ends at its last syntactic byte");
		}
	}

	it("should end the paragraph span at its text", function() {
		expectCleanSpanEnd("some text\n\nafter","parseblock");
	});

	it("should end the heading span at its text", function() {
		expectCleanSpanEnd("! Heading\n\nafter","heading");
	});

	it("should end the horizrule span at the last dash", function() {
		expectCleanSpanEnd("---\n\nafter","horizrule");
	});

	it("should end the codeblock span at the closing fence", function() {
		expectCleanSpanEnd("```\nvar x = 1;\n```\n\nafter","codeblock");
	});

	it("should end the typedblock span at the closing marker", function() {
		expectCleanSpanEnd("$$$text/plain\nhello\n$$$\n\nafter","typedblock");
	});

	it("should end the transcludeblock span at the closing braces", function() {
		expectCleanSpanEnd("{{MyTiddler}}\n\nafter","transcludeblock");
	});

	it("should end the filteredtranscludeblock span at the closing brace", function() {
		expectCleanSpanEnd("{{{ [tag[x]] }}}\n\nafter","filteredtranscludeblock");
	});

	it("should end the macrocallblock span at the closing marker", function() {
		expectCleanSpanEnd("<<mac>>\n\nafter","macrocallblock");
	});

	it("should end the styleblock span at the closing marker", function() {
		expectCleanSpanEnd("@@.myClass\ntext\n@@\n\nafter","styleblock");
	});

	it("should end the table span at the last pipe", function() {
		expectCleanSpanEnd("|a|b|\n|c|d|\n\nafter","table");
	});

	it("should end the list span at the last item", function() {
		expectCleanSpanEnd("* one\n* two\n\nafter","list");
	});

	it("should end the quoteblock span at the closing marker", function() {
		expectCleanSpanEnd("<<<\nquote\n<<<\n\nafter","quoteblock");
	});

	it("should end the block html span at the close tag", function() {
		expectCleanSpanEnd("<div>\n\nfoo\n\n</div>\n\nafter","html");
	});

	it("should end the block conditional span at the endif marker", function() {
		expectCleanSpanEnd("<%if [[x]]%>\n\nfoo\n<%endif%>\n\nafter","conditional");
	});

	it("should end the pragma spans at their own syntax", function() {
		expectCleanSpanEnd("\\define myMacro() nothing\n\nafter","macrodef");
		expectCleanSpanEnd("\\procedure myProc()\nnothing\n\\end\n\nafter","fnprocdef");
		expectCleanSpanEnd("\\whitespace trim\nafter","whitespace");
		expectCleanSpanEnd("\\import [[Defs]]\nafter","import");
		expectCleanSpanEnd("<!-- comment -->\n\nafter","commentblock");
	});

});
