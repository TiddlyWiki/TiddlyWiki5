/*\
title: test-tags.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the tagging mechanism.

\*/

"use strict";

describe("Tag tests", function() {

	describe("With no indexers", function() {
		var wikiOptions = {enableIndexers: []},
			wiki = setupWiki(wikiOptions);
		runTests(wiki,wikiOptions);
	});

	describe("With all indexers", function() {
		var wikiOptions = {},
			wiki = setupWiki();
		runTests(wiki,wikiOptions);
	});

	function setupWiki(wikiOptions) {
	// Create a wiki
		var wiki = new $tw.Wiki(wikiOptions);

		// Add a few  tiddlers
		wiki.addTiddler({
			title: "TiddlerOne",
			text: "The quick brown fox in $:/TiddlerTwo",
			tags: ["one","TiddlerSeventh"],
			modifier: "JoeBloggs",
			modified: "201304152222"});
		wiki.addTiddler({
			title: "$:/TiddlerTwo",
			text: "The rain in Spain\nfalls mainly on the plain and [[a fourth tiddler]]",
			tags: ["two"],
			modifier: "JohnDoe",
			modified: "201304152211"});
		wiki.addTiddler({
			title: "Tiddler Three",
			text: "The speed of sound in light\n\nThere is no TiddlerZero but TiddlerSix",
			tags: ["one","two","TiddlerSeventh"],
			modifier: "JohnDoe",
			modified: "201304162202"});
		wiki.addTiddler({
			title: "a fourth tiddler",
			text: "The quality of mercy is not drained by [[Tiddler Three]]",
			tags: ["TiddlerSeventh"],
			modifier: "JohnDoe"});
		wiki.addTiddler({
			title: "one",
			text: "This is the text of tiddler [[one]]",
			list: "[[Tiddler Three]] [[TiddlerOne]]",
			modifier: "JohnDoe"});
		wiki.addTiddler({
			title: "$:/TiddlerFive",
			text: "Everything in federation",
			tags: ["two"]});
		wiki.addTiddler({
			title: "TiddlerSix",
			text: "Missing inaction from TiddlerOne",
			tags: []});
		wiki.addTiddler({
			title: "TiddlerSeventh",
			text: "",
			list: "TiddlerOne [[Tiddler Three]] [[a fourth tiddler]] MissingTiddler",
			tags: []});
		wiki.addTiddler({
			title: "Tiddler8",
			text: "Tidd",
			tags: [],
			"test-field": "JoeBloggs"});
		wiki.addTiddler({
			title: "Tiddler9",
			text: "Another tiddler",
			tags: ["TiddlerSeventh"],
			"list-before": "a fourth tiddler"});
		wiki.addTiddler({
			title: "Tiddler10",
			text: "Another tiddler",
			tags: ["TiddlerSeventh"],
			"list-before": ""});
		wiki.addTiddler({
			title: "Tiddler11",
			text: "Another tiddler",
			tags: ["TiddlerSeventh"],
			"list-after": "Tiddler Three"});
		return wiki;
	}

	// Our tests
	function runTests(wiki,wikiOptions) {

		it("should handle custom tag ordering", function() {
			expect(wiki.filterTiddlers("[tag[TiddlerSeventh]]").join(",")).toBe("Tiddler10,TiddlerOne,Tiddler Three,Tiddler11,Tiddler9,a fourth tiddler");
		});

		it("should apply identical tag ordering irrespective of tag creation order", function () {
			var wiki;
			wiki = new $tw.Wiki(wikiOptions);
			wiki.addTiddler({ title: "A", text: "", tags: "sortTag"});
			wiki.addTiddler({ title: "B", text: "", tags: "sortTag"});
			wiki.addTiddler({ title: "C", text: "", tags: "sortTag"});
			expect(wiki.filterTiddlers("[tag[sortTag]]").join(",")).toBe("A,B,C");
			wiki = new $tw.Wiki(wikiOptions);
			wiki.addTiddler({ title: "A", text: "", tags: "sortTag"});
			wiki.addTiddler({ title: "C", text: "", tags: "sortTag"});
			wiki.addTiddler({ title: "B", text: "", tags: "sortTag"});
			expect(wiki.filterTiddlers("[tag[sortTag]]").join(",")).toBe("A,B,C");
			wiki = new $tw.Wiki(wikiOptions);
			wiki.addTiddler({ title: "C", text: "", tags: "sortTag"});
			wiki.addTiddler({ title: "B", text: "", tags: "sortTag"});
			wiki.addTiddler({ title: "A", text: "", tags: "sortTag"});
			expect(wiki.filterTiddlers("[tag[sortTag]]").join(",")).toBe("A,B,C");
		});

		// Tests for issue (#3296)
		it("should apply tag ordering in order of dependency", function () {
			var wiki = new $tw.Wiki(wikiOptions);

			wiki.addTiddler({ title: "A", text: "", tags: "sortTag", "list-after": "B"});
			wiki.addTiddler({ title: "B", text: "", tags: "sortTag", "list-after": "C"});
			wiki.addTiddler({ title: "C", text: "", tags: "sortTag"});

			expect(wiki.filterTiddlers("[tag[sortTag]]").join(",")).toBe("C,B,A");
		});

		it("should handle self-referencing dependency without looping infinitely", function() {
			var wiki = new $tw.Wiki(wikiOptions);

			wiki.addTiddler({ title: "A", text: "", tags: "sortTag"});
			wiki.addTiddler({ title: "B", text: "", tags: "sortTag", "list-after": "B"});
			wiki.addTiddler({ title: "C", text: "", tags: "sortTag"});

			expect(wiki.filterTiddlers("[tag[sortTag]]").join(",")).toBe("A,B,C");
		});

		it("should handle empty list-after ordering", function() {
			var wiki = new $tw.Wiki(wikiOptions);

			wiki.addTiddler({ title: "A", text: "", tags: "sortTag", "list-after": ""});
			wiki.addTiddler({ title: "B", text: "", tags: "sortTag"});
			wiki.addTiddler({ title: "C", text: "", tags: "sortTag"});

			expect(wiki.filterTiddlers("[tag[sortTag]]").join(",")).toBe("B,C,A");
		});

		// If a tiddler in the tag references a tiddler OUTSIDE of the tag
		// with list-after/before, we need to make sure we don't accidentally
		// handle that external tiddler, or that reference.
		it("should gracefully handle dependencies that aren't in the tag list", function() {
			var wiki = new $tw.Wiki(wikiOptions);

			wiki.addTiddler({ title: "A", text: "", tags: "sortTag"});
			wiki.addTiddler({ title: "B", text: "", tags: "sortTag", "list-after": "Z"});
			wiki.addTiddler({ title: "C", text: "", tags: "sortTag"});
			wiki.addTiddler({ title: "Z", text: "", tags: "EXCLUDED", "list-before": ""});

			expect(wiki.filterTiddlers("[tag[sortTag]]").join(",")).toBe("A,B,C");
		});

		it("should handle javascript-specific titles", function() {
			var wiki = new $tw.Wiki(wikiOptions);

			wiki.addTiddler({ title: "A", text: "", tags: "sortTag"});
			wiki.addTiddler({ title: "__proto__", text: "", tags: "sortTag", "list-before": ""});

			expect(wiki.filterTiddlers("[tag[sortTag]]").join(",")).toBe("__proto__,A");
		});

		it("should correctly filter with !tag[] (negation) on a non-indexed source", function() {
			// !tag[] must use O(1) hashset lookup, not indexOf on array
			// Tiddlers tagged "one": TiddlerOne, Tiddler Three — all others appear in negation
			expect(wiki.filterTiddlers("[!tag[one]sort[title]]").join(",")).toBe(
				"$:/TiddlerFive,$:/TiddlerTwo,a fourth tiddler,one,Tiddler10,Tiddler11,Tiddler8,Tiddler9,TiddlerSeventh,TiddlerSix"
			);
			// Every tiddler in the positive result should NOT be in the negative result
			var positiveResult = wiki.filterTiddlers("[tag[one]]");
			var negativeResult = wiki.filterTiddlers("[!tag[one]]");
			positiveResult.forEach(function(title) {
				expect(negativeResult.indexOf(title)).toBe(-1);
			});
			// Non-tagged tiddlers should be in the negative result
			expect(negativeResult.indexOf("TiddlerSix")).not.toBe(-1);
		});

		it("should correctly filter tag[] when chained (non-indexed source)", function() {
			// When tag[] follows another operator, source.byTag is unavailable;
			// the fix ensures O(1) hashset lookup instead of Array.indexOf
			expect(wiki.filterTiddlers("[prefix[Tiddler]tag[one]sort[title]]").join(",")).toBe("Tiddler Three,TiddlerOne");
			// prefix[Tiddler] matches: Tiddler Three(one), TiddlerOne(one), Tiddler10, Tiddler11, Tiddler8, Tiddler9, TiddlerSeventh, TiddlerSix
			expect(wiki.filterTiddlers("[prefix[Tiddler]!tag[one]sort[title]]").join(",")).toBe("Tiddler10,Tiddler11,Tiddler8,Tiddler9,TiddlerSeventh,TiddlerSix");
		});

		it("should produce consistent results between tag[] and !tag[] for large sets", function() {
			// Create a wiki with many tiddlers to stress-test the O(1) lookup path
			var bigWiki = new $tw.Wiki(wikiOptions);
			var taggedTitles = [], untaggedTitles = [];
			for(var i = 0; i < 50; i++) {
				var title = "Tagged" + i;
				taggedTitles.push(title);
				bigWiki.addTiddler({title: title, tags: ["myTag"]});
			}
			for(var j = 0; j < 50; j++) {
				var title2 = "Untagged" + j;
				untaggedTitles.push(title2);
				bigWiki.addTiddler({title: title2, tags: []});
			}
			var positiveResults = bigWiki.filterTiddlers("[tag[myTag]]");
			var negativeResults = bigWiki.filterTiddlers("[!tag[myTag]]");
			// All tagged tiddlers should appear in positive result
			taggedTitles.forEach(function(title) {
				expect(positiveResults.indexOf(title)).not.toBe(-1);
				expect(negativeResults.indexOf(title)).toBe(-1);
			});
			// All untagged tiddlers should appear in negative result
			untaggedTitles.forEach(function(title) {
				expect(negativeResults.indexOf(title)).not.toBe(-1);
				expect(positiveResults.indexOf(title)).toBe(-1);
			});
			// Chained: prefix filter + tag[], ensures non-indexed source path
			var chainedPositive = bigWiki.filterTiddlers("[prefix[Tagged]tag[myTag]]");
			var chainedNegative = bigWiki.filterTiddlers("[prefix[Tagged]!tag[myTag]]");
			expect(chainedPositive.length).toBe(50);
			expect(chainedNegative.length).toBe(0);
		});

	}

});

