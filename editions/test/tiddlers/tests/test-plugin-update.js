/*\
title: test-plugin-update.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for wiki.updatePluginTiddlers, which lets the info plugin publish window dimensions on each resize frame.
Browser console: wrap $tw.wiki.unpackPluginTiddlers with a counter and drag the window edge; the count must stay 0 while $:/info/browser/window/system/main/inner/width follows the size.

\*/
"use strict";

describe("wiki.updatePluginTiddlers", function() {
	const PLUGIN = "$:/plugins/test/live";

	function setupWiki() {
		const wiki = new $tw.Wiki();
		wiki.addIndexersToWiki();
		wiki.addTiddler({
			title: PLUGIN,
			type: "application/json",
			"plugin-type": "plugin",
			text: JSON.stringify({tiddlers: {
				"$:/live/a": {title: "$:/live/a", text: "1", color: "red"},
				"$:/live/b": {title: "$:/live/b", text: "2"}
			}})
		});
		wiki.readPluginInfo();
		wiki.registerPluginTiddlers("plugin");
		wiki.unpackPluginTiddlers();
		wiki.rebuilds = 0;
		wiki.addIndexer({
			init() {},
			update() {},
			rebuild() {
				wiki.rebuilds++;
			}
		},"ProbeIndexer");
		// Test scaffolding: changedTiddlers is the queue behind the wiki's change event
		wiki.changedTiddlers = Object.create(null);
		return wiki;
	}

	it("should update only the changed value without rebuilding indexers", function() {
		const wiki = setupWiki();
		wiki.updatePluginTiddlers(PLUGIN,[
			{title: "$:/live/a", text: "10", color: "red"},
			{title: "$:/live/b", text: "2"}
		],[]);
		expect(wiki.getTiddlerText("$:/live/a")).toBe("10");
		expect(wiki.rebuilds).toBe(0);
		expect(Object.keys(wiki.changedTiddlers)).toEqual(["$:/live/a"]);
		expect(wiki.changedTiddlers["$:/live/a"].shadow).toBe(true);
		// A later reload from the plugin tiddler must not bring back old values
		expect(wiki.getPluginInfo(PLUGIN).tiddlers["$:/live/a"].text).toBe("10");
		expect(wiki.getTiddlerData(PLUGIN).tiddlers["$:/live/a"].text).toBe("10");
	});

	it("should do nothing when no value changes", function() {
		const wiki = setupWiki();
		const pluginTiddler = wiki.getTiddler(PLUGIN);
		wiki.updatePluginTiddlers(PLUGIN,[{title: "$:/live/b", text: "2"}],[]);
		expect(Object.keys(wiki.changedTiddlers)).toEqual([]);
		expect(wiki.getTiddler(PLUGIN)).toBe(pluginTiddler);
	});

	it("should keep the plugin tiddler change silent so the plugin is not reloaded", function() {
		const wiki = setupWiki();
		wiki.updatePluginTiddlers(PLUGIN,[{title: "$:/live/b", text: "20"}],[]);
		expect(Object.keys(wiki.changedTiddlers)).not.toContain(PLUGIN);
	});

	it("should add and remove titles", function() {
		const wiki = setupWiki();
		expect(wiki.allShadowTitles()).not.toContain("$:/live/new");
		wiki.updatePluginTiddlers(PLUGIN,[{title: "$:/live/new", text: "3"}],["$:/live/b"]);
		expect(wiki.getTiddlerText("$:/live/new")).toBe("3");
		expect(wiki.allShadowTitles()).toContain("$:/live/new");
		expect(wiki.isShadowTiddler("$:/live/b")).toBe(false);
		expect(wiki.allShadowTitles()).not.toContain("$:/live/b");
		expect(wiki.changedTiddlers["$:/live/b"].deleted).toBe(true);
		expect(wiki.getPluginInfo(PLUGIN).tiddlers["$:/live/b"]).toBeUndefined();
	});

	it("should keep indexes current", function() {
		const wiki = setupWiki();
		// The first lookup builds the index, which must then follow the update
		expect(wiki.filterTiddlers("[all[shadows]field:color[red]]")).toEqual(["$:/live/a"]);
		wiki.updatePluginTiddlers(PLUGIN,[{title: "$:/live/a", text: "1", color: "blue"}],[]);
		expect(wiki.filterTiddlers("[all[shadows]field:color[red]]")).toEqual([]);
		expect(wiki.filterTiddlers("[all[shadows]field:color[blue]]")).toEqual(["$:/live/a"]);
	});
});
