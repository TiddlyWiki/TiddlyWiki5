/*\
title: test-wikitext-list-annotations.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Regression tests: two facts about a list exist only in the source and must
be annotated. Red without the list.js rule change:

* rowMarker records the full marker string of each item (e.g. "*#" in
  mixed nesting); the tag nesting alone cannot always reproduce it
* blankLineBefore marks an item that followed a blank line: the parser
  merges same-type lists across blank lines into ONE node, so the
  separator is otherwise unrecoverable

Reproduce in the browser F12 console:

	$tw.wiki.parseText("text/vnd.tiddlywiki","* one\n*# two\n\n* three\n").tree
	// one ul node: its first li has rowMarker "*", the nested ol li has
	// rowMarker "*#", and the li for "three" has blankLineBefore true

\*/

"use strict";

describe("WikiText list annotation tests", function() {

	var wiki = $tw.test.wiki();

	var parse = function(text) {
		return wiki.parseText("text/vnd.tiddlywiki",text).tree;
	};

	it("should annotate list rows with their marker and blank line merges", function() {
		var tree = parse("* one\n*# two\n\n* three\n");
		var items = tree[0].children;
		expect(items[0].rowMarker).toBe("*");
		expect(items[0].children[1].children[0].rowMarker).toBe("*#");
		// The parser merged the two runs into this single list; only the
		// annotation still knows about the separating blank line
		expect(items[1].rowMarker).toBe("*");
		expect(items[1].blankLineBefore).toBe(true);
		expect(items[0].blankLineBefore).toBeUndefined();
	});

});
