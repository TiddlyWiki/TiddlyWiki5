/*\
title: test-back-indexer.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Regression tests for #9916: the back-indexer must never record system
tiddlers as backlink or backtransclude sources, neither when the index is
first built nor when it is incrementally updated.

\*/
"use strict";

describe("Back-indexer system source tests (#9916)", function() {
	function setupWiki() {
		// Create a wiki with indexers and one primed backlink pair
		var wiki = new $tw.Wiki();
		wiki.addIndexersToWiki();

		wiki.addTiddler({
			title: "TestIncoming",
			text: ""});

		wiki.addTiddler({
			title: "TestOutgoing",
			text: "A link to [[TestIncoming]]"});
		return wiki;
	}

	it("should never report a system tiddler as a backlink source", function() {
		// Browser console: $tw.wiki.filterTiddlers("[[HelloThere]backlinks[]]") to prime the index,
		// then $tw.wiki.addTiddler(new $tw.Tiddler({title: "$:/temp/demo", text: "[[HelloThere]]"}))
		// and run the filter again; $:/temp/demo must not appear.
		var wiki = setupWiki();
		// The first lookup builds the lazy index; its initial scan skips system tiddlers
		expect(wiki.filterTiddlers("TestIncoming +[backlinks[]]").join(",")).toBe("TestOutgoing");
		// The incremental update() must skip them too
		wiki.addTiddler({
			title: "$:/temp/system-source",
			text: "A link to [[TestIncoming]]"});
		expect(wiki.filterTiddlers("TestIncoming +[backlinks[]]").join(",")).toBe("TestOutgoing");
	});

	it("should keep backlinks stable while a linking system tiddler is modified and deleted", function() {
		// Browser console: $tw.wiki.filterTiddlers("[[HelloThere]backlinks[]]") to prime the index,
		// then $tw.wiki.addTiddler(new $tw.Tiddler({title: "$:/temp/demo", text: "[[HelloThere]]"})),
		// change its text, $tw.wiki.deleteTiddler("$:/temp/demo"); the filter result never changes.
		var wiki = setupWiki();
		expect(wiki.filterTiddlers("TestIncoming +[backlinks[]]").join(",")).toBe("TestOutgoing");
		wiki.addTiddler({
			title: "$:/temp/system-source",
			text: "A link to [[TestIncoming]]"});
		// Modify: both the old and the new side of the index update are system tiddlers
		wiki.addTiddler({
			title: "$:/temp/system-source",
			text: "Links to [[TestIncoming]] and [[TestOutgoing]]"});
		expect(wiki.filterTiddlers("TestIncoming +[backlinks[]]").join(",")).toBe("TestOutgoing");
		wiki.deleteTiddler("$:/temp/system-source");
		expect(wiki.filterTiddlers("TestIncoming +[backlinks[]]").join(",")).toBe("TestOutgoing");
	});

	it("should drop the backlink when its source is renamed to a system title", function() {
		// Browser console: $tw.wiki.addTiddler(new $tw.Tiddler({title: "Demo", text: "[[HelloThere]]"})),
		// confirm Demo is in $tw.wiki.filterTiddlers("[[HelloThere]backlinks[]]"), then
		// $tw.wiki.renameTiddler("Demo","$:/Demo"); neither Demo nor $:/Demo remains a source.
		var wiki = setupWiki();
		expect(wiki.filterTiddlers("TestIncoming +[backlinks[]]").join(",")).toBe("TestOutgoing");
		wiki.renameTiddler("TestOutgoing","$:/TestOutgoing");
		expect(wiki.filterTiddlers("TestIncoming +[backlinks[]]").join(",")).toBe("");
	});

	it("should gain the backlink when a linking system tiddler is renamed to a normal title", function() {
		// Browser console: $tw.wiki.addTiddler(new $tw.Tiddler({title: "$:/temp/demo", text: "[[HelloThere]]"})),
		// then $tw.wiki.renameTiddler("$:/temp/demo","DemoVisible");
		// DemoVisible now appears in $tw.wiki.filterTiddlers("[[HelloThere]backlinks[]]").
		var wiki = setupWiki();
		expect(wiki.filterTiddlers("TestIncoming +[backlinks[]]").join(",")).toBe("TestOutgoing");
		wiki.addTiddler({
			title: "$:/temp/system-source",
			text: "A link to [[TestIncoming]]"});
		wiki.renameTiddler("$:/temp/system-source","VisibleSource");
		expect(wiki.filterTiddlers("TestIncoming +[backlinks[]]").join(",")).toBe("TestOutgoing,VisibleSource");
	});

	it("should still report normal sources for a system tiddler target", function() {
		// Only sources are filtered, targets are not. Browser console:
		// $tw.wiki.addTiddler(new $tw.Tiddler({title: "Demo", text: "[[$:/config/NewJournal/Tags]]"}));
		// $tw.wiki.filterTiddlers("[[$:/config/NewJournal/Tags]backlinks[]]") contains Demo.
		var wiki = setupWiki();
		expect(wiki.filterTiddlers("TestIncoming +[backlinks[]]").join(",")).toBe("TestOutgoing");
		wiki.addTiddler({
			title: "TestSystemLinker",
			text: "A link to [[$:/config/Target]]"});
		expect(wiki.filterTiddlers("[[$:/config/Target]backlinks[]]").join(",")).toBe("TestSystemLinker");
	});

	describe("Adversarial probes", function() {
		it("should never index a shadow tiddler as a source, even when revealed by deleting its override", function() {
			// Goes red when a refactor of BackSubIndexer.update() checks the tiddler instead of
			// the exists flag:
			//	if(updateDescriptor["new"].tiddler) { ... } // broken: goes red here
			//	if(updateDescriptor["new"].exists) { ... } // correct: stays green
			// After deleteTiddler() on an override, boot.js fills new.tiddler via getTiddler(),
			// which falls back to the revealed shadow, while new.exists stays false because
			// only the real store counts. The broken variant indexes the shadow's links and
			// the final expect fails with "TestOutgoing,ShadowSource".
			// The first expect also goes red if _init() ever starts scanning shadows; the
			// middle expect pins that a real override IS indexed, so this probe cannot be
			// satisfied by indexing nothing at all.
			// Browser console: override a plugin shadow with text [[HelloThere]], check it appears in
			// $tw.wiki.filterTiddlers("[[HelloThere]backlinks[]]"), then $tw.wiki.deleteTiddler(title);
			// the title disappears from the filter result even though the shadow still renders.
			var wiki = setupWiki();
			wiki.addTiddler({
				title: "$:/plugins/test/shadow-plugin",
				type: "application/json",
				"plugin-type": "plugin",
				text: JSON.stringify({tiddlers: {
					"ShadowSource": {title: "ShadowSource", text: "A shadow link to [[TestIncoming]]"}
				}})});
			wiki.readPluginInfo();
			wiki.registerPluginTiddlers("plugin");
			wiki.unpackPluginTiddlers();
			// The initial scan sees only real tiddlers, not the shadow
			expect(wiki.filterTiddlers("TestIncoming +[backlinks[]]").join(",")).toBe("TestOutgoing");
			wiki.addTiddler({
				title: "ShadowSource",
				text: "An overriding link to [[TestIncoming]]"});
			expect(wiki.filterTiddlers("TestIncoming +[backlinks[]]").join(",")).toBe("TestOutgoing,ShadowSource");
			// Deleting the override reveals the shadow; it must not enter the index
			wiki.deleteTiddler("ShadowSource");
			expect(wiki.filterTiddlers("TestIncoming +[backlinks[]]").join(",")).toBe("TestOutgoing");
		});

		it("should handle hostile titles like __proto__ as source and target", function() {
			// Goes red when any title-keyed hashmap on the backlinks path is created like this:
			//	this.index = {}; // broken: goes red here
			// instead of:
			//	this.index = Object.create(null); // correct: stays green
			//	this.index = new Map(); // a Map/Set refactor also stays green
			// The same applies to the boot tiddler store and to the per-target source maps
			// (self.index[target] = ...). On a plain {} the assignment index["__proto__"] = x
			// stores no key; it silently replaces the object's prototype. Depending on which
			// map regresses, the __proto__ tiddler never registers as a source (second expect),
			// or its target entry lands in the shared prototype, where it pollutes every other
			// lookup and lookup("__proto__") returns garbage (third expect).
			// Browser console: $tw.wiki.addTiddler(new $tw.Tiddler({title: "__proto__",
			// text: "[[HelloThere]]"})); __proto__ appears in
			// $tw.wiki.filterTiddlers("[[HelloThere]backlinks[]]") and
			// $tw.wiki.filterTiddlers("[[__proto__]backlinks[]]") lists tiddlers linking to it.
			var wiki = setupWiki();
			expect(wiki.filterTiddlers("TestIncoming +[backlinks[]]").join(",")).toBe("TestOutgoing");
			wiki.addTiddler({
				title: "__proto__",
				text: "A link to [[TestIncoming]]"});
			expect(wiki.filterTiddlers("TestIncoming +[backlinks[]]").join(",")).toBe("TestOutgoing,__proto__");
			wiki.addTiddler({
				title: "ProtoLinker",
				text: "A link to [[__proto__]]"});
			expect(wiki.filterTiddlers("[[__proto__]backlinks[]]").join(",")).toBe("ProtoLinker");
		});
	});
});
