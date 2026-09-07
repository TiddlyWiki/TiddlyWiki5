/*\
title: test-wikitext-block-terminators.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Regression tests: block terminators must claim the newline before their
closing marker.

A single newline before a block closing marker belongs to the terminator,
not to the preceding paragraph. Before the fix the ^-anchored terminators
of quoteblock and styleblock (and the unanchored ones of html and
conditional) matched AFTER the newline, so the paragraph text node ended
with an invisible "\n" while the blank line form (foo\n\n<<<) did not.
These tests are red without the terminator fix in the core rules
quoteblock.js, styleblock.js, html.js and conditional.js, and green with
it.

Reproduce in the browser F12 console, e.g. for the quoteblock case:

	$tw.wiki.parseText("text/vnd.tiddlywiki","<<<\nfoo\n<<<").tree
	// inspect: tree[0] is the blockquote, tree[0].children[0] the p,
	// its first child must be {type: "text", text: "foo"} without "\n"

\*/

"use strict";

describe("WikiText block terminator tests", function() {

	var wiki = $tw.test.wiki();

	var parse = function(text) {
		return wiki.parseText("text/vnd.tiddlywiki",text).tree;
	};

	it("should not swallow the newline before a quoteblock terminator", function() {
		// the single newline and blank line forms must agree
		expect(parse("<<<\nfoo\n<<<")[0].children[0].children[0].text).toBe("foo");
		expect(parse("<<<\nfoo\n\n<<<")[0].children[0].children[0].text).toBe("foo");
	});

	it("should not swallow the newline before a styleblock terminator", function() {
		// the rule returns a void wrapper around the styled blocks
		expect(parse("@@.myClass\nfoo\n@@")[0].children[0].children[0].text).toBe("foo");
	});

	it("should not swallow the newline before an html close tag", function() {
		expect(parse("<div>\n\nfoo\n</div>")[0].children[0].children[0].text).toBe("foo");
	});

	it("should not swallow the newline before a conditional terminator", function() {
		// the block body sits in the synthesized $list-template
		expect(parse("<%if [[x]]%>\n\nfoo\n<%endif%>")[0].children[0].children[0].children[0].text).toBe("foo");
	});

});
