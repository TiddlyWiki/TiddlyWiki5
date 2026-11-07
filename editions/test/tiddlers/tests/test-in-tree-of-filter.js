/*\
title: test-in-tree-of-filter.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the in-tree-of filter operator.

\*/

"use strict";

describe("in-tree-of filter operator tests", function() {

	describe("With tiddlers in the store unsorted",function() {
		testWithAndWithoutIndexers();
	});
	describe("With tiddlers in the store sorted ascending",function() {
		testWithAndWithoutIndexers({sort: "ascending"});
	});
	describe("With tiddlers in the store sorted descending",function() {
		testWithAndWithoutIndexers({sort: "descending"});
	});

	function testWithAndWithoutIndexers(options) {
		describe("With no indexers", function() {
			var wiki = setupWiki(Object.assign({},options,{enableIndexers: []}));
			runTests(wiki);
		});

		describe("With all indexers", function() {
			var wiki = setupWiki(options);
			runTests(wiki);
		});
	}

	function setupWiki(wikiOptions) {
		wikiOptions = wikiOptions || {};
		var wiki = new $tw.Wiki(wikiOptions);
		var shadowTiddlers = {
			tiddlers: {
				"$:/TiddlerFive": {
					title: "$:/TiddlerFive",
					tags: ["two"]
				},
				"TiddlerSeventh": {
					title: "TiddlerSeventh",
					tags: ["one"]
				},
				"Tiddler8": {
					title: "Tiddler8",
					tags: ["one"]
				}
			}
		};
		var tiddlers = [{
			title: "$:/ShadowPlugin",
			text: JSON.stringify(shadowTiddlers),
			"plugin-type": "plugin",
			type: "application/json"
		},{
			title: "TiddlerOne",
			tags: ["one"]
		},{
			title: "ChildOfTiddlerOne",
			tags: ["TiddlerOne"]
		},{
			title: "$:/TiddlerTwo",
			tags: ["two"]
		},{
			title: "Tiddler Three",
			tags: ["one","two"]
		},{
			title: "a fourth tiddler",
			tags: []
		},{
			title: "one"
		}];
		var fnCompare;
		switch(wikiOptions.sort) {
			case "ascending":
				fnCompare = function(a,b) {
					if(a.title < b.title) {
						return -1;
					} else if(a.title > b.title) {
						return +1;
					} else {
						return 0;
					}
				};
				break;
			case "descending":
				fnCompare = function(a,b) {
					if(a.title < b.title) {
						return +1;
					} else if(a.title > b.title) {
						return -1;
					} else {
						return 0;
					}
				};
				break;
		}
		if(fnCompare) {
			tiddlers.sort(fnCompare);
		}
		wiki.addTiddlers(tiddlers);
		wiki.readPluginInfo();
		wiki.registerPluginTiddlers("plugin");
		wiki.unpackPluginTiddlers();
		wiki.addIndexersToWiki();
		return wiki;
	}

	function runTests(wiki) {
		it("should handle basic tag-tree checks", function() {
			expect(wiki.filterTiddlers("[[TiddlerOne]in-tree-of[one]]").join(",")).toBe("TiddlerOne");
			expect(wiki.filterTiddlers("[[Tiddler Three]in-tree-of[one]]").join(",")).toBe("Tiddler Three");
			expect(wiki.filterTiddlers("[[Tiddler8]in-tree-of[one]]").join(",")).toBe("Tiddler8");
			expect(wiki.filterTiddlers("[[TiddlerSeventh]in-tree-of[one]]").join(",")).toBe("TiddlerSeventh");
		});

		it("should return empty for tiddlers not in the tree", function() {
			expect(wiki.filterTiddlers("[[$:/TiddlerTwo]in-tree-of[one]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[[a fourth tiddler]in-tree-of[one]]").join(",")).toBe("");
		});

		it("should handle multiple tiddlers at once", function() {
			expect(wiki.filterTiddlers("[[TiddlerOne]] [[Tiddler8]] [[$:/TiddlerTwo]] +[in-tree-of[one]sort[title]]").join(",")).toBe("Tiddler8,TiddlerOne");
		});

		it("should work with different root tags", function() {
			expect(wiki.filterTiddlers("[[$:/TiddlerTwo]in-tree-of[two]]").join(",")).toBe("$:/TiddlerTwo");
			expect(wiki.filterTiddlers("[[Tiddler Three]in-tree-of[two]]").join(",")).toBe("Tiddler Three");
		});

		it("should handle negation with ! prefix", function() {
			expect(wiki.filterTiddlers("[[TiddlerOne]!in-tree-of[one]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[[$:/TiddlerTwo]!in-tree-of[one]]").join(",")).toBe("$:/TiddlerTwo");
			expect(wiki.filterTiddlers("[[TiddlerOne]] [[$:/TiddlerTwo]] [[a fourth tiddler]] +[!in-tree-of[one]sort[title]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler");
		});

		it("should handle inclusive suffix", function() {
			expect(wiki.filterTiddlers("[[one]in-tree-of[one]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[[one]in-tree-of:inclusive[one]]").join(",")).toBe("one");
			expect(wiki.filterTiddlers("[[one]] [[TiddlerOne]] [[Tiddler8]] +[in-tree-of:inclusive[one]sort[title]]").join(",")).toBe("one,Tiddler8,TiddlerOne");
		});

		it("should work correctly with non-shadow tiddlers only", function() {
			expect(wiki.filterTiddlers("[!is[shadow]in-tree-of[one]sort[title]]").join(",")).toBe("ChildOfTiddlerOne,Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[!is[shadow]!in-tree-of[one]sort[title]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,one");
		});

		it("should return empty for non-existent root tags", function() {
			expect(wiki.filterTiddlers("[[TiddlerOne]in-tree-of[NonExistentTag]]").join(",")).toBe("");
		});

		it("should handle multi-level descendants", function() {
			expect(wiki.filterTiddlers("[[ChildOfTiddlerOne]in-tree-of[one]]").join(",")).toBe("ChildOfTiddlerOne");
			expect(wiki.filterTiddlers("[[TiddlerOne]] [[ChildOfTiddlerOne]] [[$:/TiddlerTwo]] +[in-tree-of[one]sort[title]]").join(",")).toBe("ChildOfTiddlerOne,TiddlerOne");
			expect(wiki.filterTiddlers("[in-tree-of[one]sort[title]]").join(",")).toBe("ChildOfTiddlerOne,Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[all[shadows+tiddlers]in-tree-of[one]sort[title]]").join(",")).toBe("ChildOfTiddlerOne,Tiddler Three,Tiddler8,TiddlerOne,TiddlerSeventh");
		});

		it("should handle a non-existent single input tiddler", function() {
			expect(wiki.filterTiddlers("[[NonExistentTiddler]in-tree-of[one]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[[NonExistentTiddler]!in-tree-of[one]]").join(",")).toBe("NonExistentTiddler");
		});

		it("should handle circular tag references without infinite loops", function() {
			var circularWiki = new $tw.Wiki();
			circularWiki.addTiddlers([
				{title: "TagA", tags: ["TagB"]},
				{title: "TagB", tags: ["TagA"]}
			]);
			expect(circularWiki.filterTiddlers("[in-tree-of[TagA]sort[title]]").join(",")).toBe("TagA,TagB");
			expect(circularWiki.filterTiddlers("[in-tree-of[TagB]sort[title]]").join(",")).toBe("TagA,TagB");
		});

		it("should traverse list-field trees", function() {
			var listWiki = new $tw.Wiki();
			listWiki.addTiddlers([
				{title: "root", list: "childA childB"},
				{title: "childA", list: "grandchild"},
				{title: "grandchild", list: ""},
				{title: "childB"},
				{title: "outsider"}
			]);
			expect(listWiki.filterTiddlers("[[childA]in-tree-of[root],[list]]").join(",")).toBe("childA");
			expect(listWiki.filterTiddlers("[[childB]in-tree-of[root],[list]]").join(",")).toBe("childB");
			expect(listWiki.filterTiddlers("[[grandchild]in-tree-of[root],[list]]").join(",")).toBe("grandchild");
			expect(listWiki.filterTiddlers("[[outsider]in-tree-of[root],[list]]").join(",")).toBe("");
			expect(listWiki.filterTiddlers("[[root]in-tree-of[root],[list]]").join(",")).toBe("");
			expect(listWiki.filterTiddlers("[[root]in-tree-of:inclusive[root],[list]]").join(",")).toBe("root");
			expect(listWiki.filterTiddlers("[[childA]!in-tree-of[root],[list]]").join(",")).toBe("");
			expect(listWiki.filterTiddlers("[[outsider]!in-tree-of[root],[list]]").join(",")).toBe("outsider");
			expect(listWiki.filterTiddlers("[in-tree-of[root],[list]sort[title]]").join(",")).toBe("childA,childB,grandchild");
		});

		it("should handle circular list-field references", function() {
			var circularListWiki = new $tw.Wiki();
			circularListWiki.addTiddlers([
				{title: "A", list: "B"},
				{title: "B", list: "A"}
			]);
			expect(circularListWiki.filterTiddlers("[in-tree-of[A],[list]sort[title]]").join(",")).toBe("A,B");
			expect(circularListWiki.filterTiddlers("[in-tree-of[B],[list]sort[title]]").join(",")).toBe("A,B");
		});

		it("should accept field name via indirect reference", function() {
			var indirectWiki = new $tw.Wiki();
			indirectWiki.addTiddlers([
				{title: "Config", treeField: "children"},
				{title: "root", children: "childA childB"},
				{title: "childA"},
				{title: "childB"},
				{title: "outsider"}
			]);
			expect(indirectWiki.filterTiddlers("[[childA]in-tree-of[root],{Config!!treeField}]").join(",")).toBe("childA");
			expect(indirectWiki.filterTiddlers("[[outsider]in-tree-of[root],{Config!!treeField}]").join(",")).toBe("");
		});
	}

});
