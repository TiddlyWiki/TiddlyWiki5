/*\
title: test-tag-indexer.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests that the TagIndexer only rebuilds when a change can actually affect tag
membership or tag-list ordering. Guards the optimisation in
TagIndexer.prototype.update against both under- and over-invalidation.

\*/

"use strict";

describe("TagIndexer invalidation", function() {

	// Build a wiki with the TagIndexer active and wrap the sub-indexer used by
	// getTiddlersWithTag so we can count how often it rebuilds.
	function setup() {
		var wiki = new $tw.Wiki();
		if(!wiki.getIndexer("TagIndexer")) {
			wiki.addIndexersToWiki();
		}
		wiki.addTiddler({title: "A", text: "a", tags: ["myTag"]});
		wiki.addTiddler({title: "B", text: "b", tags: ["myTag"]});
		wiki.addTiddler({title: "C", text: "c", tags: ["other"]});
		// "myTag" is also a real tiddler whose list field orders its members
		wiki.addTiddler({title: "myTag", text: "", list: "B A"});

		var indexer = wiki.getIndexer("TagIndexer");
		expect(indexer).toBeTruthy();
		var sub = indexer.subIndexers[3]; // eachShadowPlusTiddlers, used by getTiddlersWithTag

		// Prime, then start counting rebuilds
		wiki.getTiddlersWithTag("myTag");
		var counter = {count: 0};
		var orig = sub.rebuild;
		sub.rebuild = function() {
			counter.count++;
			return orig.apply(this, arguments);
		};
		return {wiki: wiki, rebuilds: counter};
	}

	it("does NOT rebuild when a tagged tiddler's non-tag field changes", function() {
		var env = setup();
		// Edit only the text of a tagged tiddler (the hot keystroke path)
		env.wiki.addTiddler(new $tw.Tiddler(env.wiki.getTiddler("A"), {text: "a changed"}));
		env.wiki.getTiddlersWithTag("myTag");
		expect(env.rebuilds.count).toBe(0);
		// And the result is still correct
		expect(env.wiki.getTiddlersWithTag("myTag").join(",")).toBe("B,A");
	});

	it("rebuilds and updates membership when a tiddler's tags change", function() {
		var env = setup();
		// C joins myTag
		env.wiki.addTiddler(new $tw.Tiddler(env.wiki.getTiddler("C"), {tags: ["myTag"]}));
		expect(env.wiki.getTiddlersWithTag("myTag").indexOf("C")).not.toBe(-1);
		expect(env.rebuilds.count).toBeGreaterThan(0);
	});

	it("rebuilds and updates ordering when a tag-target's list field changes", function() {
		var env = setup();
		// Reverse the ordering of myTag's members
		env.wiki.addTiddler(new $tw.Tiddler(env.wiki.getTiddler("myTag"), {list: "A B"}));
		expect(env.wiki.getTiddlersWithTag("myTag").join(",")).toBe("A,B");
		expect(env.rebuilds.count).toBeGreaterThan(0);
	});

	it("updates membership when a tagged tiddler is deleted", function() {
		var env = setup();
		env.wiki.deleteTiddler("A");
		expect(env.wiki.getTiddlersWithTag("myTag").join(",")).toBe("B");
		expect(env.rebuilds.count).toBeGreaterThan(0);
	});

});
