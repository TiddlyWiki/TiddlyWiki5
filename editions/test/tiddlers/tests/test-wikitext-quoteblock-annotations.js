/*\
title: test-wikitext-quoteblock-annotations.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Regression tests: three facts about a <<< quote block exist only in the
source and must be annotated. Red without the quoteblock.js rule change:

* marker records the depth (<<< vs <<<<); without it nested quotes cannot
  be reproduced from the tree in parseable form
* userClasses records the raw class list; the class attribute fuses it
  with the synthesized tc-quote
* isQuoteCite distinguishes the synthesized cite elements from literal
  <cite> markup in the quote body

The nested case also guards a re-entrancy bug: a nested quote re-enters
the same rule instance and overwrites this.match, so the outer quote
recorded the inner quote's marker until the marker was captured before
parsing the body.

Reproduce in the browser F12 console:

	$tw.wiki.parseText("text/vnd.tiddlywiki",
		"<<<.myClass.other\nQuote\n<<< The Cite\n").tree
	// tree[0]: marker "<<<", userClasses ["myClass","other"], and the
	// trailing cite child has isQuoteCite true

\*/

"use strict";

describe("WikiText quoteblock annotation tests", function() {

	var wiki = $tw.test.wiki();

	var parse = function(text) {
		return wiki.parseText("text/vnd.tiddlywiki",text).tree;
	};

	it("should annotate quote blocks with marker, classes and cites", function() {
		var tree = parse("<<<.myClass.other\nQuote\n<<< The Cite\n");
		expect(tree[0].marker).toBe("<<<");
		expect(tree[0].userClasses).toEqual(["myClass","other"]);
		var cite = tree[0].children[1];
		expect(cite.tag).toBe("cite");
		expect(cite.isQuoteCite).toBe(true);
	});

	it("should record each quote's own marker when nesting", function() {
		var tree = parse("<<< Outer Cite\nA\n\n<<<< Deep\nB\n<<<<\n<<<\n");
		expect(tree[0].marker).toBe("<<<");
		expect(tree[0].children[2].marker).toBe("<<<<");
	});

});
