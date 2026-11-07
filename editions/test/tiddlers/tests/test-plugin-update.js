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
		wiki.updates = [];
		wiki.addIndexer({
			init() {},
			update(updateDescriptor) {
				wiki.updates.push(updateDescriptor);
			},
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

	it("should add a title", function() {
		const wiki = setupWiki();
		expect(wiki.allShadowTitles()).not.toContain("$:/live/new");
		wiki.updatePluginTiddlers(PLUGIN,[{title: "$:/live/new", text: "3"}],[]);
		expect(wiki.getTiddlerText("$:/live/new")).toBe("3");
		expect(wiki.allShadowTitles()).toContain("$:/live/new");
		expect(wiki.getShadowSource("$:/live/new")).toBe(PLUGIN);
	});

	it("should remove a title", function() {
		const wiki = setupWiki();
		expect(wiki.allShadowTitles()).toContain("$:/live/b");
		wiki.updatePluginTiddlers(PLUGIN,[],["$:/live/b"]);
		expect(wiki.isShadowTiddler("$:/live/b")).toBe(false);
		expect(wiki.allShadowTitles()).not.toContain("$:/live/b");
		expect(wiki.changedTiddlers["$:/live/b"].deleted).toBe(true);
		expect(wiki.getPluginInfo(PLUGIN).tiddlers["$:/live/b"]).toBeUndefined();
	});

	it("should ignore the removal of a title the plugin does not have", function() {
		const wiki = setupWiki();
		wiki.updatePluginTiddlers(PLUGIN,[],["$:/live/missing"]);
		expect(Object.keys(wiki.changedTiddlers)).toEqual([]);
	});

	it("should add a title listed in both additions and removals", function() {
		const wiki = setupWiki();
		wiki.updatePluginTiddlers(PLUGIN,[{title: "$:/live/b", text: "20"}],["$:/live/b"]);
		expect(wiki.getTiddlerText("$:/live/b")).toBe("20");
	});

	it("should ignore additions that are null or have no title", function() {
		const wiki = setupWiki();
		wiki.updatePluginTiddlers(PLUGIN,[null,{text: "no title"}],[]);
		expect(Object.keys(wiki.changedTiddlers)).toEqual([]);
	});

	it("should not recreate a plugin tiddler that was deleted", function() {
		const wiki = setupWiki();
		wiki.deleteTiddler(PLUGIN);
		wiki.updatePluginTiddlers(PLUGIN,[{title: "$:/live/b", text: "20"}],[]);
		expect(wiki.tiddlerExists(PLUGIN)).toBe(false);
	});

	it("should clear the caches of the changed title, the plugin and global lookups", function() {
		const wiki = setupWiki(),
			readCaches = function() {
				return [
					wiki.getCacheForTiddler("$:/live/a","probe",() => wiki.getTiddlerText("$:/live/a")),
					wiki.getGlobalCache("probe",() => wiki.getTiddlerText("$:/live/a")),
					wiki.getTiddlerDataCached(PLUGIN).tiddlers["$:/live/a"].text
				];
			};
		expect(readCaches()).toEqual(["1","1","1"]);
		wiki.updatePluginTiddlers(PLUGIN,[{title: "$:/live/a", text: "10", color: "red"}],[]);
		expect(readCaches()).toEqual(["10","10","10"]);
	});

	it("should report the shadow and exists state to indexers", function() {
		const wiki = setupWiki();
		wiki.updatePluginTiddlers(PLUGIN,[{title: "$:/live/new", text: "3"}],[]);
		const {old: before, new: after} = wiki.updates[0];
		expect([before.shadow,before.exists]).toEqual([false,false]);
		expect([after.shadow,after.exists]).toEqual([true,false]);
	});

	it("should keep indexes current", function() {
		const wiki = setupWiki();
		// The first lookup builds the index, which must then follow the update
		expect(wiki.filterTiddlers("[all[shadows]field:color[red]]")).toEqual(["$:/live/a"]);
		wiki.updatePluginTiddlers(PLUGIN,[{title: "$:/live/a", text: "1", color: "blue"}],[]);
		expect(wiki.filterTiddlers("[all[shadows]field:color[red]]")).toEqual([]);
		expect(wiki.filterTiddlers("[all[shadows]field:color[blue]]")).toEqual(["$:/live/a"]);
	});

	// Guards https://github.com/TiddlyWiki/TiddlyWiki5/issues/10066: writing the plugin tiddler makes startup/plugins.js reload it
	it("should not write the info plugin tiddler when an info module publishes a new value", function() {
		const mainWiki = $tw.wiki,
			wiki = new $tw.Wiki();
		let publish;
		// Test scaffolding: dimensions.js only tracks windows in a browser, so a fake info module stands in for it
		spyOn($tw.modules,"forEachModuleOfType").and.callFake(function(type,callback) {
			callback("fake",{
				getInfoTiddlerFields(update) {
					publish = update;
					return [{title: "$:/info/test", text: "1"}];
				}
			});
		});
		$tw.wiki = wiki;
		try {
			require("$:/core/modules/startup/info.js").startup();
			wiki.changedTiddlers = Object.create(null);
			publish([{title: "$:/info/test", text: "2"}]);
		} finally{
			$tw.wiki = mainWiki;
		}
		expect(wiki.getTiddlerText("$:/info/test")).toBe("2");
		expect(Object.keys(wiki.changedTiddlers)).toEqual(["$:/info/test"]);
	});
});
