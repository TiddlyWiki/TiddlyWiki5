/*\
title: test-parsetextreference.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for source attribute in parser returned from wiki.parseTextReference

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("Wiki.parseTextReference tests", function() {

	// Create a wiki
	var wiki = new $tw.Wiki();
	wiki.addTiddler({
		title: "TiddlerOne",
		text: "The quick brown fox in $:/TiddlerTwo",
		tags: ["one"],
		authors: "Joe Bloggs",
		modifier: "JoeBloggs",
		modified: "201304152222"});
	wiki.addTiddler({
		title: "$:/TiddlerTwo",
		tags: ["two"],
		authors: "[[John Doe]]",
		modifier: "John",
		modified: "201304152211"});
	wiki.addTiddler({
		title: "Tiddler Three",
		text: '{"oct":31,"nov":30,"dec":31,"jan":""}',
		tags: ["one","two"],
		type: "application/json",
		modifier: "John",
		modified: "201304162202"});
	wiki.addTiddler({
		title: "TiddlerFour",
		text: "The quick brown fox in $:/TiddlerTwo",
		tags: ["one"],
		type: "text/vnd.tiddlywiki",
		authors: "",
		modifier: "JoeBloggs",
		modified: "201304152222"});
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
				text: "Missing inaction from TiddlerOne",
				filter: "[[one]] [[a a]] [subfilter{hasList!!list}]",
				tags: []
			},
			"TiddlerSeventh": {
				title: "TiddlerSeventh",
				text: "",
				list: "TiddlerOne [[Tiddler Three]] [[a fourth tiddler]] MissingTiddler",
				tags: ["one"]
			},
			"Tiddler8": {
				title: "Tiddler8",
				text: "Tidd",
				tags: ["one"],
				"test-field": "JoeBloggs",
				"myfield":""
			}
		}
	};
	wiki.addTiddler({
		title: "$:/ShadowPlugin",
		text: JSON.stringify(shadowTiddlers),
		"plugin-type": "plugin",
		type: "application/json"});
	wiki.addTiddler({
		title: "TiddlerNine",
		text: "this is plain text",
		type: "text/plain"
	});

	// Define a parsing shortcut for souce attribute of parser returned by wiki.parseTextReference
	var parseAndGetSource = function(title,field,index,subTiddler) {
		var parser = wiki.parseTextReference(title,field,index,{subTiddler: subTiddler});
		return parser ? parser.source : null;
	};

	it("should parse text references and return correct source attribute", function(){
		// Existing tiddler with a text field, no field argument specified
		expect(parseAndGetSource("TiddlerOne")).toEqual("The quick brown fox in $:/TiddlerTwo");
		// Existing tiddler with a text field, field argument specified as text
		expect(parseAndGetSource("TiddlerOne","text")).toEqual("The quick brown fox in $:/TiddlerTwo");
		// Existing tiddler with no text field
		expect(parseAndGetSource("$:/TiddlerTwo")).toEqual("");
		// Existing tiddler, field argument specified as authors
		expect(parseAndGetSource("TiddlerOne","authors")).toEqual("Joe Bloggs");
		// Non-existent tiddler, no field argument
		expect(parseAndGetSource("MissingTiddler")).toEqual(null);
		// Non-existent tiddler, field argument
		expect(parseAndGetSource("MissingTiddler","missing-field")).toEqual(null);
		// Non-existent tiddler, index specified
		expect(parseAndGetSource("MissingTiddler",null,"missing-index")).toEqual(null);
		// Existing tiddler with non existent field
		expect(parseAndGetSource("TiddlerOne","missing-field")).toEqual(null);
		// Existing tiddler with blank field
		expect(parseAndGetSource("TiddlerFour","authors")).toEqual("");
		// Data tiddler with index specified
		expect(parseAndGetSource("Tiddler Three",null,"oct")).toEqual("31");
		// Data tiddler with blank index
		expect(parseAndGetSource("Tiddler Three",null,"jan")).toEqual("");
		// Data tiddler with non-existent index
		expect(parseAndGetSource("Tiddler Three",null,"feb")).toEqual(null);
		// Existing tiddler with a text field, type set to vnd.tiddlywiki
		expect(parseAndGetSource("TiddlerFour")).toEqual("The quick brown fox in $:/TiddlerTwo");
		// Existing subtiddler of a plugin
		expect(parseAndGetSource("$:/ShadowPlugin","text",null,"Tiddler8")).toEqual("Tidd");
		// Existing blank field of a subtiddler of a plugin
		expect(parseAndGetSource("$:/ShadowPlugin","myfield",null,"Tiddler8")).toEqual("");
		// Non-existent subtiddler of a plugin
		expect(parseAndGetSource("$:/ShadowPlugin","text",null,"MyMissingTiddler")).toEqual(null);
		// Plain text tiddler
		expect(parseAndGetSource("TiddlerNine")).toEqual(undefined);
	});

});

})();
