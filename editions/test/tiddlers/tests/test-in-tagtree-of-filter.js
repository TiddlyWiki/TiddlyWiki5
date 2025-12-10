/*\
title: test-in-tagtree-of-filter.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the in-tagtree-of filter operator.

\*/

"use strict";

describe("in-tagtree-of filter operator tests", function() {

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
		// Create a wiki
		var wiki = new $tw.Wiki(wikiOptions);
		// Add a plugin containing some shadow tiddlers
		var shadowTiddlers = {
			tiddlers: {
				"$:/TiddlerFive": {
					title: "$:/TiddlerFive",
					text: "Everything in federation",
					tags: ["two"]
				},
				"TiddlerSix": {
					title: "TiddlerSix",
					text: "Missing inaction from [[TiddlerOne]]",
					filter: "[[one]] [[a a]] [subfilter{hasList!!list}]",
					tags: []
				},
				"TiddlerSeventh": {
					title: "TiddlerSeventh",
					text: "",
					list: "[[TiddlerOne]] [[Tiddler Three]] [[a fourth tiddler]] [[MissingTiddler]]",
					tags: ["one"]
				},
				"Tiddler8": {
					title: "Tiddler8",
					text: "Tidd",
					tags: ["one"],
					"test-field": "JoeBloggs"
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
			text: "The quick brown fox in $:/TiddlerTwo",
			tags: ["one"],
			cost: "123",
			value: "120",
			slug: "tiddler-one",
			authors: "Joe Bloggs",
			modifier: "JoeBloggs",
			modified: "201304152222"
		},{
			title: "$:/TiddlerTwo",
			text: "The rain in Spain\nfalls mainly on the plain and [[a fourth tiddler]]",
			tags: ["two"],
			cost: "42",
			value: "190",
			slug: "tiddler-two",
			authors: "[[John Doe]]",
			modifier: "John",
			modified: "201304152211"
		},{
			title: "Tiddler Three",
			text: "The speed of sound in light\n\nThere is no [[TiddlerZero]] but [[TiddlerSix]]",
			tags: ["one","two"],
			cost: "56",
			value: "80",
			modifier: "John",
			modified: "201304162202"
		},{
			title: "a fourth tiddler",
			text: "The quality of mercy is not drained by [[Tiddler Three]]",
			tags: [],
			cost: "82",
			value: "72",
			empty: "not",
			modifier: "John"
		},{
			title: "one",
			text: "This is the text of tiddler [[one]]",
			list: "[[Tiddler Three]] [[TiddlerOne]]",
			empty: "",
			modifier: "John"
		},{
			title: "hasList",
			text: "This is the text of tiddler [[hasList]]",
			list: "[[Tiddler Three]] [[TiddlerOne]]",
			modifier: "PMario"
		},{
			title: "has filter",
			text: "This is the text of tiddler [[has filter]]",
			filter: "[[Tiddler Three]] [[TiddlerOne]] [subfilter{hasList!!list}]",
			modifier: "PMario"
		},{
			title: "filter regexp test",
			text: "Those strings have been used to create the `regexp = /[+|\-|~]?([[](?:[^\]])*\]+)|([+|-|~|\S]\S*)/;`",
			filter: "+aaa -bbb ~ccc aaaaaabbbbbbbbaa \"bb'b\" 'cc\"c' [[abc]] [[tiddler with spaces]] [is[test]] [is[te st]] a s df [enlist<hugo>] +[enlist:raw{test with spaces}] [enlist:raw{test with spaces}] [[a a]] [[ ] [ ]] [[ [hugo]] [subfilter{Story/Tower of Hanoi/A-C Sequence}]",
			modifier: "PMario"
		}];
		// Load the tiddlers in the required order
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
		// Unpack plugin tiddlers
		wiki.readPluginInfo();
		wiki.registerPluginTiddlers("plugin");
		wiki.unpackPluginTiddlers();
		wiki.addIndexersToWiki();
		return wiki;
	}

	function runTests(wiki) {
		it("should handle basic in-tagtree-of checks", function() {
			// "one" is a tag with children: "Tiddler Three", "TiddlerOne", "Tiddler8", "TiddlerSeventh"
			expect(wiki.filterTiddlers("[[TiddlerOne]in-tagtree-of[one]]").join(",")).toBe("TiddlerOne");
			expect(wiki.filterTiddlers("[[Tiddler Three]in-tagtree-of[one]]").join(",")).toBe("Tiddler Three");
			expect(wiki.filterTiddlers("[[Tiddler8]in-tagtree-of[one]]").join(",")).toBe("Tiddler8");
			expect(wiki.filterTiddlers("[[TiddlerSeventh]in-tagtree-of[one]]").join(",")).toBe("TiddlerSeventh");
		});

		it("should return empty for tiddlers not in the tag tree", function() {
			expect(wiki.filterTiddlers("[[$:/TiddlerTwo]in-tagtree-of[one]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[[a fourth tiddler]in-tagtree-of[one]]").join(",")).toBe("");
		});

		it("should handle multiple tiddlers at once", function() {
			expect(wiki.filterTiddlers("[[TiddlerOne]] [[Tiddler8]] [[$:/TiddlerTwo]] +[in-tagtree-of[one]sort[title]]").join(",")).toBe("Tiddler8,TiddlerOne");
		});

		it("should work with different root tags", function() {
			// "two" has children: "$:/TiddlerFive", "$:/TiddlerTwo", "Tiddler Three"
			expect(wiki.filterTiddlers("[[$:/TiddlerTwo]in-tagtree-of[two]]").join(",")).toBe("$:/TiddlerTwo");
			expect(wiki.filterTiddlers("[[Tiddler Three]in-tagtree-of[two]]").join(",")).toBe("Tiddler Three");
		});

		it("should handle negation with ! prefix", function() {
			expect(wiki.filterTiddlers("[[TiddlerOne]!in-tagtree-of[one]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[[$:/TiddlerTwo]!in-tagtree-of[one]]").join(",")).toBe("$:/TiddlerTwo");
			expect(wiki.filterTiddlers("[[TiddlerOne]] [[$:/TiddlerTwo]] [[a fourth tiddler]] +[!in-tagtree-of[one]sort[title]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler");
		});

		it("should handle inclusive suffix", function() {
			// Without inclusive, root tag itself is not included
			expect(wiki.filterTiddlers("[[one]in-tagtree-of[one]]").join(",")).toBe("");
			// With inclusive, root tag itself is included
			expect(wiki.filterTiddlers("[[one]in-tagtree-of:inclusive[one]]").join(",")).toBe("one");
			expect(wiki.filterTiddlers("[[one]] [[TiddlerOne]] [[Tiddler8]] +[in-tagtree-of:inclusive[one]sort[title]]").join(",")).toBe("one,Tiddler8,TiddlerOne");
		});

		it("should work correctly with non-shadow tiddlers only", function() {
			// "Tiddler8" and "TiddlerSeventh" are shadow tiddlers
			expect(wiki.filterTiddlers("[!is[shadow]in-tagtree-of[one]sort[title]]").join(",")).toBe("Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[!is[shadow]!in-tagtree-of[one]sort[title]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one");
		});

		it("should return empty for non-existent root tags", function() {
			expect(wiki.filterTiddlers("[[TiddlerOne]in-tagtree-of[NonExistentTag]]").join(",")).toBe("");
		});

		it("should optimize single tiddler input", function() {
			// This tests the optimization for single-tiddler inputs used in cascades
			expect(wiki.filterTiddlers("[[TiddlerOne]in-tagtree-of[one]]").join(",")).toBe("TiddlerOne");
		});
	}

});
