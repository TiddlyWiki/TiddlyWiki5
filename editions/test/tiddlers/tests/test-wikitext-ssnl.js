/*\
title: test-wikitext-ssnl.js
type: application/javascript
tags: [[$:/tags/test-spec]]

The ssnl rule of the hard-line-breaks plugin: two trailing spaces, or two
spaces and a backslash, before a newline make a hard line break, see
https://github.com/TiddlyWiki/TiddlyWiki5/issues/10025

Reproduce in the browser F12 console:

	$tw.wiki.parseText("text/vnd.tiddlywiki","* one  \ntwo\n* three").tree[0].children[0].children.map(function(n) { return n.tag || n.text; })
	// ["one","br","two"]

\*/

"use strict";

describe("WikiText ssnl rule tests", function() {

	var wiki = $tw.test.wiki();

	function parse(text) {
		return wiki.parseText("text/vnd.tiddlywiki",text).tree;
	}

	// Text, or tag and rule, of each inline node
	function shape(nodes) {
		return nodes.map(function(node) {
			return node.type === "text" ? node.text : (node.tag || node.type) + (node.rule ? ":" + node.rule : "");
		});
	}

	it("should turn two trailing spaces before a newline into a br element", function() {
		var tree = parse("one  \ntwo");
		expect(shape(tree[0].children)).toEqual(["one","br:ssnl","two"]);
		expect(tree[0].children[1].start).toBe(3);
		expect(tree[0].children[1].end).toBe(6);
	});

	it("should accept a backslash after the spaces", function() {
		expect(shape(parse("one  \\\ntwo")[0].children)).toEqual(["one","br:ssnl","two"]);
	});

	it("should continue a list item and a heading onto the next line", function() {
		var list = parse("* one  \ntwo\n* three")[0];
		expect(list.children.length).toBe(2);
		expect(shape(list.children[0].children)).toEqual(["one","br:ssnl","two"]);
		expect(shape(parse("! one  \ntwo")[0].children)).toEqual(["one","br:ssnl","two"]);
	});

	it("should not join paragraphs across a blank line", function() {
		expect(parse("one  \n\ntwo").length).toBe(2);
	});

	it("should not break at the end of the text", function() {
		expect(parse("one  \n")[0].children.length).toBe(1);
	});

	it("should not double a break inside a hard line break region", function() {
		// The region rule restamps the rule name of the nodes it returns, so compare tags only
		var tags = parse("\"\"\"\nline  \nnext\n\"\"\"")[0].children.map(function(node) { return node.tag || node.text; });
		expect(tags).toEqual(["line","br","next","br"]);
	});

	it("should be switched off by \\rules except", function() {
		expect(parse("\\rules except ssnl\none  \ntwo")[0].children[0].children.length).toBe(1);
	});

});
