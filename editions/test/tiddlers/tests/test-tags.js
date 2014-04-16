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

	// Create a wiki
	var wiki = new $tw.Wiki();

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

	// Our tests

	it("should handle custom tag ordering", function() {
		expect(wiki.filterTiddlers("[tag[TiddlerSeventh]]").join(",")).toBe("Tiddler10,TiddlerOne,Tiddler Three,Tiddler11,Tiddler9,a fourth tiddler");
	});

});

})();
