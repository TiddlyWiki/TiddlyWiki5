/*\
title: test-wikitext-whitespace-pragma.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Regression test: the \whitespace pragma must leave a trace in the parse
tree. It was the only pragma whose rule returned an empty array, so no
consumer could know the pragma was present or reproduce it; \rules and
pragma comments both return marker nodes. The rule now returns a void
marker node (rendered as a pass-through, no DOM node) carrying the token
list and exact source positions. Red without the whitespace.js rule change.

Reproduce in the browser F12 console:

	$tw.wiki.parseText("text/vnd.tiddlywiki","\\whitespace trim\nContent\n").tree
	// tree[0] must be {type: "void", rule: "whitespace", start: 0, end: 16}
	// with attributes.values.value === "trim"; the rest of the tiddler is
	// chained as its children

\*/

"use strict";

describe("WikiText whitespace pragma tests", function() {

	var wiki = $tw.test.wiki();

	var parse = function(text) {
		return wiki.parseText("text/vnd.tiddlywiki",text).tree;
	};

	it("should return a void marker node for the whitespace pragma", function() {
		var tree = parse("\\whitespace trim\nContent\n");
		expect(tree[0].type).toBe("void");
		expect(tree[0].rule).toBe("whitespace");
		expect(tree[0].attributes.values.value).toBe("trim");
		expect(tree[0].start).toBe(0);
		expect(tree[0].end).toBe(16);
		// Pragmas chain the rest of the tiddler as their children
		expect(tree[0].children[0].tag).toBe("p");
	});

});
