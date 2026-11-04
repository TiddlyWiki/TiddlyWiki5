/*\
title: test-wikitext-conditional-annotations.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Regression tests: the <%if%> shortcut compiles to $list widgets that are
indistinguishable from hand-written ones, so the parse tree must annotate
what only exists in the source. Red without the conditional.js rule change:

* isConditional marks the widgets synthesized from the shortcut syntax
* the synthesized elseif clause carries a span from its marker to the end
  of the construct
* blockContent on a clause body container records the blank line after the
  marker that switched the body to block mode (without it, tree-only
  serialization collapses block conditionals to inline form)

Reproduce in the browser F12 console:

	$tw.wiki.parseText("text/vnd.tiddlywiki",
		"<%if [[x]]%>\n\nfoo\n<%elseif [[y]]%>\n\nbar\n<%endif%>\n").tree
	// tree[0] is the $list widget: isConditional true, children[0] (the
	// $list-template) has blockContent true; the elseif clause sits in
	// children[1].children[0] with start 18 (its marker) and end 49 (after
	// the endif marker)

\*/

"use strict";

describe("WikiText conditional annotation tests", function() {

	var wiki = $tw.test.wiki();

	var parse = function(text) {
		return wiki.parseText("text/vnd.tiddlywiki",text).tree;
	};

	it("should annotate conditional shortcut clauses", function() {
		var tree = parse("<%if [[x]]%>\n\nfoo\n<%elseif [[y]]%>\n\nbar\n<%endif%>\n");
		var ifWidget = tree[0];
		expect(ifWidget.isConditional).toBe(true);
		expect(ifWidget.children[0].blockContent).toBe(true);
		var elseifClause = ifWidget.children[1].children[0];
		expect(elseifClause.isConditional).toBe(true);
		// Synthesized clauses carry no rule name; that distinguishes them
		// from a real nested conditional in an else body
		expect(elseifClause.rule).toBeUndefined();
		expect(elseifClause.start).toBe(18);
		expect(elseifClause.end).toBe(49);
		expect(elseifClause.children[0].blockContent).toBe(true);
	});

});
