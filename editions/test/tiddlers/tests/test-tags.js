/*\
title: test-tags.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the tagging mechanism.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
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
		expect(wiki.filterTiddlers("[tag[sortTag]]").join(',')).toBe("A,B,C");
		wiki = new $tw.Wiki(wikiOptions);
		wiki.addTiddler({ title: "A", text: "", tags: "sortTag"});
		wiki.addTiddler({ title: "C", text: "", tags: "sortTag"});
		wiki.addTiddler({ title: "B", text: "", tags: "sortTag"});
		expect(wiki.filterTiddlers("[tag[sortTag]]").join(',')).toBe("A,B,C");
		wiki = new $tw.Wiki(wikiOptions);
		wiki.addTiddler({ title: "C", text: "", tags: "sortTag"});
		wiki.addTiddler({ title: "B", text: "", tags: "sortTag"});
		wiki.addTiddler({ title: "A", text: "", tags: "sortTag"});
		expect(wiki.filterTiddlers("[tag[sortTag]]").join(',')).toBe("A,B,C");
	});

	// Tests for issue (#3296)
	it("should apply tag ordering in order of dependency", function () {
		var wiki = new $tw.Wiki(wikiOptions);

		wiki.addTiddler({ title: "A", text: "", tags: "sortTag", "list-after": "B"});
		wiki.addTiddler({ title: "B", text: "", tags: "sortTag", "list-after": "C"});
		wiki.addTiddler({ title: "C", text: "", tags: "sortTag"});

		expect(wiki.filterTiddlers("[tag[sortTag]]").join(',')).toBe("C,B,A");
	});

	it("should handle self-referencing dependency without looping infinitely", function() {
		var wiki = new $tw.Wiki(wikiOptions);

		wiki.addTiddler({ title: "A", text: "", tags: "sortTag"});
		wiki.addTiddler({ title: "B", text: "", tags: "sortTag", "list-after": "B"});
		wiki.addTiddler({ title: "C", text: "", tags: "sortTag"});

		expect(wiki.filterTiddlers("[tag[sortTag]]").join(',')).toBe("A,B,C");
	});

	it("should handle empty list-after ordering", function() {
		var wiki = new $tw.Wiki(wikiOptions);

		wiki.addTiddler({ title: "A", text: "", tags: "sortTag", "list-after": ""});
		wiki.addTiddler({ title: "B", text: "", tags: "sortTag"});
		wiki.addTiddler({ title: "C", text: "", tags: "sortTag"});

		expect(wiki.filterTiddlers("[tag[sortTag]]").join(',')).toBe("B,C,A");
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

		expect(wiki.filterTiddlers("[tag[sortTag]]").join(',')).toBe("A,B,C");
	});

	it("should handle javascript-specific titles", function() {
		var wiki = new $tw.Wiki(wikiOptions);

		wiki.addTiddler({ title: "A", text: "", tags: "sortTag"});
		wiki.addTiddler({ title: "__proto__", text: "", tags: "sortTag", "list-before": ""});

		expect(wiki.filterTiddlers("[tag[sortTag]]").join(',')).toBe("__proto__,A");
	});

}

});

})();
