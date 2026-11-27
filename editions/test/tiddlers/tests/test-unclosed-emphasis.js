/*\
title: test-unclosed-emphasis.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests that unclosed emphasis does not consume following blocks.

\*/

"use strict";

describe("Unclosed emphasis", function() {
	var wiki = $tw.test.wiki(),
		markers = ["''", "//", "__", "~~", "^^", ",,"];

	markers.forEach(function(marker) {
		it("keeps an unmatched " + marker + " literal and parses the next block", function() {
			var source = marker + "unfinished\n\n! Following",
				tree = wiki.parseText("text/vnd.tiddlywiki",source).tree;
			expect(tree[0].children[0].type).toBe("text");
			expect(tree[0].children[0].text).toBe(marker);
			expect(tree[1].tag).toBe("h1");
		});
		it("still parses matched " + marker + " emphasis", function() {
			var tree = wiki.parseText("text/vnd.tiddlywiki",marker + "matched" + marker).tree;
			expect(tree[0].children[0].type).toBe("element");
		});
	});
});
