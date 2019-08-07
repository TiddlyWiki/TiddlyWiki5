/*\
title: test-filters.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the filtering mechanism.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("Filter tests", function() {

	// Test filter parsing
	it("should parse new-style rich operator suffixes", function() {
		expect($tw.wiki.parseFilter("[search:: four, , five,, six [operand]]")).toEqual(
			[ { prefix : '', operators : [ { operator : 'search', suffix : ': four, , five,, six ', suffixes : [ [  ], [ 'four', 'five', 'six' ] ], operand : 'operand' } ] } ]
		);
		expect($tw.wiki.parseFilter("[search: one, two ,three :[operand]]")).toEqual(
			[ { prefix : '', operators : [ { operator : 'search', suffix : ' one, two ,three :', suffixes : [ [ 'one', 'two', 'three' ], [  ] ], operand : 'operand' } ] } ]
		);
		expect($tw.wiki.parseFilter("[search: one, two ,three :[operand]]")).toEqual(
			[ { prefix : '', operators : [ { operator : 'search', suffix : ' one, two ,three :', suffixes : [ [ 'one', 'two', 'three' ], [  ] ], operand : 'operand' } ] } ]
		);
		expect($tw.wiki.parseFilter("[search: one, two ,three : four, , five,, six [operand]]")).toEqual(
			[ { prefix : '', operators : [ { operator : 'search', suffix : ' one, two ,three : four, , five,, six ', suffixes : [ [ 'one', 'two', 'three' ], [ 'four', 'five', 'six' ] ], operand : 'operand' } ] } ]
		);
		expect($tw.wiki.parseFilter("[search: , : [operand]]")).toEqual(
			 [ { prefix : '', operators : [ { operator : 'search', suffix : ' , : ', suffixes : [ [  ], [  ] ], operand : 'operand' } ] } ]
		);
	});

	describe("With no indexers", function() {
		var wiki = setupWiki({enableIndexers: []});
		it("should not create indexes when requested not to",function() {
			expect(wiki.getIndexer("FieldIndexer")).toBe(null);			
		});
		runTests(wiki);
	});

	describe("With all indexers", function() {
		var wiki = setupWiki();
		if(wiki.getIndexer("FieldIndexer")) {
			wiki.getIndexer("FieldIndexer").setMaxIndexedValueLength(8); // Note that JoeBloggs is 9, and JohnDoe is 7			
		}
		runTests(wiki);
	});

function setupWiki(wikiOptions) {
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
				text: "Missing inaction from TiddlerOne",
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
				"test-field": "JoeBloggs"
			}			
		}
	};
	wiki.addTiddler({
		title: "$:/ShadowPlugin",
		text: JSON.stringify(shadowTiddlers),
		"plugin-type": "plugin",
		type: "application/json"});
	// Add a few  tiddlers
	wiki.addTiddler({
		title: "TiddlerOne",
		text: "The quick brown fox in $:/TiddlerTwo",
		tags: ["one"],
		authors: "Joe Bloggs",
		modifier: "JoeBloggs",
		modified: "201304152222"});
	wiki.addTiddler({
		title: "$:/TiddlerTwo",
		text: "The rain in Spain\nfalls mainly on the plain and [[a fourth tiddler]]",
		tags: ["two"],
		authors: "[[John Doe]]",
		modifier: "JohnDoe",
		modified: "201304152211"});
	wiki.addTiddler({
		title: "Tiddler Three",
		text: "The speed of sound in light\n\nThere is no TiddlerZero but TiddlerSix",
		tags: ["one","two"],
		modifier: "JohnDoe",
		modified: "201304162202"});
	wiki.addTiddler({
		title: "a fourth tiddler",
		text: "The quality of mercy is not drained by [[Tiddler Three]]",
		tags: [],
		empty: "not",
		modifier: "JohnDoe"});
	wiki.addTiddler({
		title: "one",
		text: "This is the text of tiddler [[one]]",
		list: "[[Tiddler Three]] [[TiddlerOne]]",
		empty: "",
		modifier: "JohnDoe"});
	// Unpack plugin tiddlers
	wiki.readPluginInfo();
	wiki.registerPluginTiddlers("plugin");
	wiki.unpackPluginTiddlers();
	wiki.addIndexersToWiki();
	return wiki;
}

// Our tests
function runTests(wiki) {

	it("should handle the then and else operators", function() {
		expect(wiki.filterTiddlers("[modifier[JoeBloggs]then[JaneBloggs]]").join(",")).toBe("JaneBloggs");
		expect(wiki.filterTiddlers("[!modifier[JoeBloggs]then[JaneBloggs]]").join(",")).toBe("JaneBloggs,JaneBloggs,JaneBloggs,JaneBloggs,JaneBloggs");
		expect(wiki.filterTiddlers("[modifier[DaveBloggs]then[JaneBloggs]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[modifier[JoeBloggs]else[JaneBloggs]]").join(",")).toBe("TiddlerOne");
		expect(wiki.filterTiddlers("[!modifier[JoeBloggs]else[JaneBloggs]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,Tiddler Three,a fourth tiddler,one");
		expect(wiki.filterTiddlers("[modifier[DaveBloggs]else[JaneBloggs]]").join(",")).toBe("JaneBloggs");
	});

	it("should handle the ~ prefix", function() {
		expect(wiki.filterTiddlers("[modifier[JoeBloggs]] ~[[No such tiddler]]").join(",")).toBe("TiddlerOne");
		expect(wiki.filterTiddlers("[modifier[JaneBloggs]] ~[[No such tiddler]]").join(",")).toBe("No such tiddler");
		expect(wiki.filterTiddlers("~[[No such tiddler]]").join(",")).toBe("No such tiddler");
		expect(wiki.filterTiddlers("[my-field[present]] ~[[No such tiddler]]").join(",")).toBe("No such tiddler");
	});

	it("should handle the lookup operator", function() {
		expect(wiki.filterTiddlers("Six Seventh 8 +[lookup[Tiddler]]").join(",")).toBe("Missing inaction from TiddlerOne,,Tidd");
		expect(wiki.filterTiddlers("Six Seventh 8 +[lookup:8[Tiddler]]").join(",")).toBe("Missing inaction from TiddlerOne,Tidd,Tidd");
	});

	it("should retrieve shadow tiddlers", function() {
		expect(wiki.getTiddlerText("Tiddler8")).toBe("Tidd");
	});

	it("should handle the title operator", function() {
		expect(wiki.filterTiddlers("TiddlerOne [title[$:/TiddlerTwo]] [[Tiddler Three]]").join(",")).toBe("TiddlerOne,$:/TiddlerTwo,Tiddler Three");
		expect(wiki.filterTiddlers("[!title[Tiddler Three]]").join(",")).toBe("$:/ShadowPlugin,TiddlerOne,$:/TiddlerTwo,a fourth tiddler,one");
		expect(wiki.filterTiddlers("TiddlerOne [title[$:/TiddlerTwo]] [[Tiddler Three]] [[A Missing Tiddler]]").join(",")).toBe("TiddlerOne,$:/TiddlerTwo,Tiddler Three,A Missing Tiddler");
	});

	it("should handle the field operator", function() {
		expect(wiki.filterTiddlers("[modifier[JoeBloggs]]").join(",")).toBe("TiddlerOne");
		expect(wiki.filterTiddlers("[!modifier[JoeBloggs]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,Tiddler Three,a fourth tiddler,one");
		expect(wiki.filterTiddlers("[!is[system]!modifier[JoeBloggs]]").join(",")).toBe("Tiddler Three,a fourth tiddler,one");
		expect(wiki.filterTiddlers("[field:modifier[JoeBloggs]]").join(",")).toBe("TiddlerOne");
		expect(wiki.filterTiddlers("[!field:modifier[JoeBloggs]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,Tiddler Three,a fourth tiddler,one");
		expect(wiki.filterTiddlers("[!is[system]!field:modifier[JoeBloggs]]").join(",")).toBe("Tiddler Three,a fourth tiddler,one");
		expect(wiki.filterTiddlers("[modifier[JohnDoe]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three,a fourth tiddler,one");
		expect(wiki.filterTiddlers("[!modifier[JohnDoe]]").join(",")).toBe("$:/ShadowPlugin,TiddlerOne");
		expect(wiki.filterTiddlers("[!is[system]!modifier[JohnDoe]]").join(",")).toBe("TiddlerOne");
		expect(wiki.filterTiddlers("[field:modifier[JohnDoe]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three,a fourth tiddler,one");
		expect(wiki.filterTiddlers("[!field:modifier[JohnDoe]]").join(",")).toBe("$:/ShadowPlugin,TiddlerOne");
		expect(wiki.filterTiddlers("[!is[system]!field:modifier[JohnDoe]]").join(",")).toBe("TiddlerOne");
	});

	it("should handle the regexp operator", function() {
		expect(wiki.filterTiddlers("[regexp[id]]").join(",")).toBe("TiddlerOne,$:/TiddlerTwo,Tiddler Three,a fourth tiddler");
		expect(wiki.filterTiddlers("[!regexp[id]]").join(",")).toBe("$:/ShadowPlugin,one");
		expect(wiki.filterTiddlers("[regexp[Tid]]").join(",")).toBe("TiddlerOne,$:/TiddlerTwo,Tiddler Three");
		expect(wiki.filterTiddlers("[regexp[(?i)Tid]]").join(",")).toBe("TiddlerOne,$:/TiddlerTwo,Tiddler Three,a fourth tiddler");
		expect(wiki.filterTiddlers("[!regexp[Tid(?i)]]").join(",")).toBe("$:/ShadowPlugin,one");
	});

	it("should handle the field operator with a regular expression operand", function() {
		expect(wiki.filterTiddlers("[modifier/JoeBloggs/]").join(",")).toBe("TiddlerOne");
		expect(wiki.filterTiddlers("[modifier/Jo/]").join(",")).toBe("TiddlerOne,$:/TiddlerTwo,Tiddler Three,a fourth tiddler,one");
	});

	it("should handle the prefix operator", function() {
		expect(wiki.filterTiddlers("[prefix[Tiddler]]").join(",")).toBe("TiddlerOne,Tiddler Three");
		expect(wiki.filterTiddlers("[prefix[nothing]]").join(",")).toBe("");
	});

	it("should handle the sort and sortcs operators", function() {
		expect(wiki.filterTiddlers("[sort[title]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[!sort[title]]").join(",")).toBe("TiddlerOne,Tiddler Three,one,a fourth tiddler,$:/TiddlerTwo,$:/ShadowPlugin");
		// Temporarily commenting out the following two lines because of platform differences for localeCompare between the browser and Node.js
		// expect(wiki.filterTiddlers("[sortcs[title]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three,TiddlerOne,a fourth tiddler,one");
		// expect(wiki.filterTiddlers("[!sortcs[title]]").join(",")).toBe("one,a fourth tiddler,TiddlerOne,Tiddler Three,$:/TiddlerTwo");
	});

	it("should handle the reverse, first, last, butfirst, butlast, rest and nth operators", function() {
		expect(wiki.filterTiddlers("[sort[title]first[]]").join(",")).toBe("$:/ShadowPlugin");
		expect(wiki.filterTiddlers("[sort[title]first[2]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo");
		expect(wiki.filterTiddlers("[sort[title]first[8]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[sort[title]first[x]]").join(",")).toBe("$:/ShadowPlugin");
		expect(wiki.filterTiddlers("[sort[title]last[]]").join(",")).toBe("TiddlerOne");
		expect(wiki.filterTiddlers("[sort[title]last[2]]").join(",")).toBe("Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[sort[title]last[8]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[sort[title]last[x]]").join(",")).toBe("TiddlerOne");
		expect(wiki.filterTiddlers("[sort[title]reverse[]]").join(",")).toBe("TiddlerOne,Tiddler Three,one,a fourth tiddler,$:/TiddlerTwo,$:/ShadowPlugin");
		expect(wiki.filterTiddlers("[sort[title]reverse[x]]").join(",")).toBe("TiddlerOne,Tiddler Three,one,a fourth tiddler,$:/TiddlerTwo,$:/ShadowPlugin");
		expect(wiki.filterTiddlers("[sort[title]butlast[]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three");
		expect(wiki.filterTiddlers("[sort[title]butlast[2]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,one");
		expect(wiki.filterTiddlers("[sort[title]butlast[8]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[sort[title]butlast[x]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three");
		expect(wiki.filterTiddlers("[sort[title]rest[]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[sort[title]rest[2]]").join(",")).toBe("a fourth tiddler,one,Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[sort[title]rest[8]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[sort[title]rest[x]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[sort[title]nth[]]").join(",")).toBe("$:/ShadowPlugin");
		expect(wiki.filterTiddlers("[sort[title]nth[2]]").join(",")).toBe("$:/TiddlerTwo");
		expect(wiki.filterTiddlers("[sort[title]nth[8]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[sort[title]nth[x]]").join(",")).toBe("$:/ShadowPlugin");
	});

	it("should handle the tag operator", function() {
		expect(wiki.filterTiddlers("[tag[one]sort[title]]").join(",")).toBe("Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[!tag[one]sort[title]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,one");
		expect(wiki.filterTiddlers("[prefix[Tidd]tag[one]sort[title]]").join(",")).toBe("Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[!is[shadow]tag[two]sort[title]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three");
		expect(wiki.filterTiddlers("[all[shadows]tag[two]sort[title]]").join(",")).toBe("$:/TiddlerFive");
	});

	it("should handle the all operator with field, has and tag operators", function() {
		expect(wiki.filterTiddlers("[all[shadows]tag[two]]").join(",")).toBe("$:/TiddlerFive");
		expect(wiki.filterTiddlers("[all[shadows+tiddlers]tag[two]]").join(",")).toBe("$:/TiddlerFive,$:/TiddlerTwo,Tiddler Three");
		expect(wiki.filterTiddlers("[all[tiddlers+shadows]tag[two]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three,$:/TiddlerFive");
		expect(wiki.filterTiddlers("[all[shadows+tiddlers]]").join(",")).toBe("$:/TiddlerFive,TiddlerSix,TiddlerSeventh,Tiddler8,$:/ShadowPlugin,TiddlerOne,$:/TiddlerTwo,Tiddler Three,a fourth tiddler,one");
		expect(wiki.filterTiddlers("[all[tiddlers+shadows]]").join(",")).toBe("$:/ShadowPlugin,TiddlerOne,$:/TiddlerTwo,Tiddler Three,a fourth tiddler,one,$:/TiddlerFive,TiddlerSix,TiddlerSeventh,Tiddler8");
		expect(wiki.filterTiddlers("[all[tiddlers]tag[two]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three");
	});

	it("should handle the tags operator", function() {
		expect(wiki.filterTiddlers("[tags[]sort[title]]").join(",")).toBe("one,two");
		expect(wiki.filterTiddlers("[[TiddlerOne]tags[]sort[title]]").join(",")).toBe("one");
	});

	it("should handle the match operator", function() {
		expect(wiki.filterTiddlers("[match[TiddlerOne]]").join(",")).toBe("TiddlerOne");
		expect(wiki.filterTiddlers("TiddlerOne TiddlerOne =[match[TiddlerOne]]").join(",")).toBe("TiddlerOne,TiddlerOne");
		expect(wiki.filterTiddlers("[!match[TiddlerOne]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,Tiddler Three,a fourth tiddler,one");
		expect(wiki.filterTiddlers("[match:casesensitive[tiddlerone]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[!match:casesensitive[tiddlerone]]").join(",")).toBe("$:/ShadowPlugin,TiddlerOne,$:/TiddlerTwo,Tiddler Three,a fourth tiddler,one");
		expect(wiki.filterTiddlers("[match:caseinsensitive[tiddlerone]]").join(",")).toBe("TiddlerOne");
		expect(wiki.filterTiddlers("[!match:caseinsensitive[tiddlerone]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,Tiddler Three,a fourth tiddler,one");
	});

	it("should handle the tagging operator", function() {
		expect(wiki.filterTiddlers("[[one]tagging[]sort[title]]").join(",")).toBe("Tiddler Three,Tiddler8,TiddlerOne,TiddlerSeventh");
		expect(wiki.filterTiddlers("[[one]tagging[]]").join(",")).toBe("Tiddler Three,TiddlerOne,TiddlerSeventh,Tiddler8");
		expect(wiki.filterTiddlers("[[two]tagging[]sort[title]]").join(",")).toBe("$:/TiddlerFive,$:/TiddlerTwo,Tiddler Three");
		var fakeWidget = {getVariable: function() {return "one";}};
		expect(wiki.filterTiddlers("[all[current]tagging[]]",fakeWidget).join(",")).toBe("Tiddler Three,TiddlerOne,TiddlerSeventh,Tiddler8");
	});

	it("should handle the untagged operator", function() {
		expect(wiki.filterTiddlers("[untagged[]sort[title]]").join(",")).toBe("$:/ShadowPlugin,a fourth tiddler,one");
		expect(wiki.filterTiddlers("[!untagged[]sort[title]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three,TiddlerOne");
	});

	it("should handle the links operator", function() {
		expect(wiki.filterTiddlers("[!is[shadow]links[]sort[title]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three,TiddlerSix,TiddlerZero");
		expect(wiki.filterTiddlers("[all[shadows]links[]sort[title]]").join(",")).toBe("TiddlerOne");
	});

	it("should handle the backlinks operator", function() {
		expect(wiki.filterTiddlers("[!is[shadow]backlinks[]sort[title]]").join(",")).toBe("a fourth tiddler,one,TiddlerOne");
		expect(wiki.filterTiddlers("[all[shadows]backlinks[]sort[title]]").join(",")).toBe("Tiddler Three");
	});

	it("should handle the has operator", function() {
		expect(wiki.filterTiddlers("[has[modified]sort[title]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[!has[modified]sort[title]]").join(",")).toBe("$:/ShadowPlugin,a fourth tiddler,one");
	});

	it("should handle the has:field operator", function() {
		expect(wiki.filterTiddlers("[has:field[empty]sort[title]]").join(",")).toBe("a fourth tiddler,one");
		expect(wiki.filterTiddlers("[!has:field[empty]sort[title]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,Tiddler Three,TiddlerOne");
	});


	it("should handle the limit operator", function() {
		expect(wiki.filterTiddlers("[!is[system]sort[title]limit[2]]").join(",")).toBe("a fourth tiddler,one");
		expect(wiki.filterTiddlers("[prefix[Tid]sort[title]limit[1]]").join(",")).toBe("Tiddler Three");
		expect(wiki.filterTiddlers("[prefix[Tid]sort[title]!limit[1]]").join(",")).toBe("TiddlerOne");
	});

	it("should handle the list operator", function() {
		expect(wiki.filterTiddlers("[list[TiddlerSeventh]sort[title]]").join(",")).toBe("a fourth tiddler,MissingTiddler,Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[tag[one]list[TiddlerSeventh]sort[title]]").join(",")).toBe("a fourth tiddler,MissingTiddler,Tiddler Three,TiddlerOne");
	});

  	it("should handle the next operator", function() {
	    	expect(wiki.filterTiddlers("[[Tiddler Three]next[TiddlerSeventh]]").join(",")).toBe("a fourth tiddler");
	    	expect(wiki.filterTiddlers("[[MissingTiddler]next[TiddlerSeventh]]").join(",")).toBe("");
  	});

  	it("should handle the previous operator", function() {
    		expect(wiki.filterTiddlers("[[Tiddler Three]previous[TiddlerSeventh]]").join(",")).toBe("TiddlerOne");
    		expect(wiki.filterTiddlers("[[TiddlerOne]previous[TiddlerSeventh]]").join(",")).toBe("");
  	});

	it("should handle the search operator", function() {
		expect(wiki.filterTiddlers("[search[the]sort[title]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[search{Tiddler8}sort[title]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[search:modifier[og]sort[title]]").join(",")).toBe("TiddlerOne");
		expect(wiki.filterTiddlers("[search:modifier,authors:casesensitive[Do]sort[title]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three");
		expect(wiki.filterTiddlers("[search:modifier,authors:casesensitive[do]sort[title]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[search:authors:casesensitive,whitespace[John    Doe]sort[title]]").join(",")).toBe("$:/TiddlerTwo");
		expect(wiki.filterTiddlers("[search:modifier:regexp[(d|bl)o(ggs|e)]sort[title]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[search:-modifier,authors:[g]sort[title]]").join(",")).toBe("$:/ShadowPlugin,Tiddler Three");
		expect(wiki.filterTiddlers("[search:*:[g]sort[title]]").join(",")).toBe("$:/ShadowPlugin,Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[search:text:anchored[the]]").join(",")).toBe("TiddlerOne,$:/TiddlerTwo,Tiddler Three,a fourth tiddler");
	});

	it("should yield search results that have search tokens spread across different fields", function() {
		expect(wiki.filterTiddlers("[search[fox one]sort[title]]").join(",")).toBe("TiddlerOne");
	});

	it("should handle the each operator", function() {
		expect(wiki.filterTiddlers("[each[modifier]sort[title]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,TiddlerOne");
		expect(wiki.filterTiddlers("[each:list-item[tags]sort[title]]").join(",")).toBe("one,two");
		expect(wiki.filterTiddlers("[each:list-item[authors]sort[title]]").join(",")).toBe("Bloggs,Joe,John Doe");
	});

	it("should handle the eachday operator", function() {
		expect(wiki.filterTiddlers("[eachday[modified]sort[title]]").join(",")).toBe("Tiddler Three,TiddlerOne");
	});

	it("should handle the sameday operator", function() {
		expect(wiki.filterTiddlers("[sameday[201304152200]sort[title]]").join(",")).toBe("$:/TiddlerTwo,TiddlerOne");
	});

	describe("testing the is operator",function() {

		it("should handle the '[is[current]]' operator", function() {
		var fakeWidget = {getVariable: function() {return "Tiddler Three";}};
			expect(wiki.filterTiddlers("[is[current]]",fakeWidget).join(",")).toBe("Tiddler Three");
			expect(wiki.filterTiddlers("[[Tiddler Three]is[current]]",fakeWidget).join(",")).toBe("Tiddler Three");
			expect(wiki.filterTiddlers("[[$:/TiddlerTwo]is[current]]",fakeWidget).join(",")).toBe("");
			expect(wiki.filterTiddlers("[!is[current]sort[title]]",fakeWidget).join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,one,TiddlerOne");
		});

		it("should handle the '[is[system]]' operator", function() {
			expect(wiki.filterTiddlers("[is[system]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo");
			expect(wiki.filterTiddlers("[!is[system]sort[title]]").join(",")).toBe("a fourth tiddler,one,Tiddler Three,TiddlerOne");
		});

		it("should handle the '[is[shadow]]' operator", function() {
			expect(wiki.filterTiddlers("[all[shadows]sort[title]]").join(",")).toBe("$:/TiddlerFive,Tiddler8,TiddlerSeventh,TiddlerSix");
			expect(wiki.filterTiddlers("[!is[shadow]sort[title]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three,TiddlerOne");
		});

		it("should handle the '[is[missing]]' operator", function() {
			expect(wiki.filterTiddlers("[all[]]").join(",")).toBe("$:/ShadowPlugin,TiddlerOne,$:/TiddlerTwo,Tiddler Three,a fourth tiddler,one");
			expect(wiki.filterTiddlers("[all[missing]]").join(",")).toBe("TiddlerZero");
			expect(wiki.filterTiddlers("[!is[missing]sort[title]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[[TiddlerOne]is[missing]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[[TiddlerZero]is[missing]]").join(",")).toBe("TiddlerZero");
			expect(wiki.filterTiddlers("[!title[Tiddler Three]is[missing]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[!title[Tiddler Three]!is[missing]sort[title]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,one,TiddlerOne");
		});

		it("should handle the '[is[orphan]]' operator", function() {
			expect(wiki.filterTiddlers("[is[orphan]sort[title]]").join(",")).toBe("a fourth tiddler,TiddlerOne");
			expect(wiki.filterTiddlers("[!is[orphan]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,Tiddler Three,one");
			expect(wiki.filterTiddlers("[[TiddlerOne]is[orphan]]").join(",")).toBe("TiddlerOne");
			expect(wiki.filterTiddlers("[[TiddlerOne]!is[orphan]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[!title[Tiddler Three]is[orphan]sort[title]]").join(",")).toBe("a fourth tiddler,TiddlerOne");
			expect(wiki.filterTiddlers("[!title[Tiddler Three]!is[orphan]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,one");
		});

	});

	it("should handle the operand prefixes", function() {
		expect(wiki.filterTiddlers("[prefix[Tiddler]] +[sort[title]]").join(",")).toBe("Tiddler Three,TiddlerOne");
	});

	it("should handle indirect operands", function() {
		expect(wiki.filterTiddlers("[prefix{Tiddler8}] +[sort[title]]").join(",")).toBe("Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[modifier{Tiddler8!!test-field}] +[sort[title]]").join(",")).toBe("TiddlerOne");
		var fakeWidget = {getVariable: function() {return "Tiddler Three";}};
		expect(wiki.filterTiddlers("[modifier{!!modifier}] +[sort[title]]",fakeWidget).join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three");
	});

	it("should handle variable operands", function() {

		var widget = require("$:/core/modules/widgets/widget.js");
	// Create a root widget for attaching event handlers. By using it as the parentWidget for another widget tree, one can reuse the event handlers
		var rootWidget = new widget.widget({
			type: "widget",
			children: [{type: "widget", children: []}]
		},{
			wiki: wiki,
			document: $tw.document
		});
		rootWidget.makeChildWidgets();
		var anchorWidget = rootWidget.children[0];
		rootWidget.setVariable("myVar","Tidd");
		rootWidget.setVariable("myVar2","JoeBloggs");
		expect(wiki.filterTiddlers("[prefix<myVar>] +[sort[title]]",anchorWidget).join(",")).toBe("Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[modifier<myVar2>] +[sort[title]]",anchorWidget).join(",")).toBe("TiddlerOne");
	});

	it("should handle the before and after operators", function() {
		expect(wiki.filterTiddlers("[list[TiddlerSeventh]after[TiddlerOne]]").join(",")).toBe("Tiddler Three");
		expect(wiki.filterTiddlers("[list[TiddlerSeventh]after[a fourth tiddler]]").join(",")).toBe("MissingTiddler");
		expect(wiki.filterTiddlers("[list[TiddlerSeventh]after[MissingTiddler]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[list[TiddlerSeventh]before[TiddlerOne]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[list[TiddlerSeventh]before[a fourth tiddler]]").join(",")).toBe("Tiddler Three");
		expect(wiki.filterTiddlers("[list[TiddlerSeventh]before[MissingTiddler]]").join(",")).toBe("a fourth tiddler");
	});

	it("should handle the string operators", function() {
		expect(wiki.filterTiddlers("John Paul George Ringo +[length[]]").join(",")).toBe("4,4,6,5");
		expect(wiki.filterTiddlers("John Paul George Ringo +[uppercase[]]").join(",")).toBe("JOHN,PAUL,GEORGE,RINGO");
		expect(wiki.filterTiddlers("John Paul George Ringo +[lowercase[]]").join(",")).toBe("john,paul,george,ringo");
		expect(wiki.filterTiddlers("John Paul George Ringo +[split[]]").join(",")).toBe("J,o,h,n,P,a,u,l,G,e,o,r,g,e,R,i,n,g,o");
		expect(wiki.filterTiddlers("[[John. Paul. George. Ringo.]] +[split[.]trim[]]").join(",")).toBe("John,Paul,George,Ringo,");
		expect(wiki.filterTiddlers("John Paul George Ringo +[split[e]]").join(",")).toBe("John,Paul,G,org,,Ringo");
		expect(wiki.filterTiddlers("John Paul George Ringo +[join[ ]split[e]join[ee]split[ ]]").join(",")).toBe("John,Paul,Geeorgee,Ringo");
		expect(wiki.filterTiddlers("[[ John ]] [[Paul ]] [[ George]] Ringo +[trim[]join[-]]").join(",")).toBe("John-Paul-George-Ringo");
	});

	it("should handle the mathematics operators", function() {
		expect(wiki.filterTiddlers("[[2]add[2]]").join(",")).toBe("4");
		expect(wiki.filterTiddlers("[[4]subtract[2]]").join(",")).toBe("2");
		expect(wiki.filterTiddlers("[[24]divide[8]]").join(",")).toBe("3");
		expect(wiki.filterTiddlers("[[355]divide[113]sign[]multiply[4]]").join(",")).toBe("4");
		expect(wiki.filterTiddlers("[[355]divide[113]add[0.5]round[]multiply[4]]").join(",")).toBe("16");
		expect(wiki.filterTiddlers("1 2 3 4 +[sum[]]").join(",")).toBe("10");
		expect(wiki.filterTiddlers("1 2 3 4 +[product[]]").join(",")).toBe("24");
		expect(wiki.filterTiddlers("1 2 3 4 +[maxall[]]").join(",")).toBe("4");
		expect(wiki.filterTiddlers("1 2 3 4 +[minall[]]").join(",")).toBe("1");
		expect(wiki.filterTiddlers("1 2 3 4 +[max[2]]").join(",")).toBe("2,2,3,4");
		expect(wiki.filterTiddlers("1 2 3 4 +[min[2]]").join(",")).toBe("1,2,2,2");
	});

	it("should handle the allafter operator", function() {
		expect(wiki.filterTiddlers("1 2 3 4 +[allafter[]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("1 2 3 4 +[allafter:include[]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("1 2 3 4 +[allafter[1]]").join(",")).toBe("2,3,4");
		expect(wiki.filterTiddlers("1 2 3 4 +[allafter:include[1]]").join(",")).toBe("1,2,3,4");
		expect(wiki.filterTiddlers("1 2 3 4 +[allafter[2]]").join(",")).toBe("3,4");
		expect(wiki.filterTiddlers("1 2 3 4 +[allafter:include[2]]").join(",")).toBe("2,3,4");
		expect(wiki.filterTiddlers("1 2 3 4 +[allafter[3]]").join(",")).toBe("4");
		expect(wiki.filterTiddlers("1 2 3 4 +[allafter:include[3]]").join(",")).toBe("3,4");
		expect(wiki.filterTiddlers("1 2 3 4 +[allafter[4]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("1 2 3 4 +[allafter:include[4]]").join(",")).toBe("4");
		expect(wiki.filterTiddlers("1 2 3 4 +[allafter[5]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("1 2 3 4 +[allafter:include[5]]").join(",")).toBe("");
	});

	it("should handle the allbefore operator", function() {
		expect(wiki.filterTiddlers("1 2 3 4 +[allbefore[]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("1 2 3 4 +[allbefore:include[]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("1 2 3 4 +[allbefore[1]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("1 2 3 4 +[allbefore:include[1]]").join(",")).toBe("1");
		expect(wiki.filterTiddlers("1 2 3 4 +[allbefore[2]]").join(",")).toBe("1");
		expect(wiki.filterTiddlers("1 2 3 4 +[allbefore:include[2]]").join(",")).toBe("1,2");
		expect(wiki.filterTiddlers("1 2 3 4 +[allbefore[3]]").join(",")).toBe("1,2");
		expect(wiki.filterTiddlers("1 2 3 4 +[allbefore:include[3]]").join(",")).toBe("1,2,3");
		expect(wiki.filterTiddlers("1 2 3 4 +[allbefore[4]]").join(",")).toBe("1,2,3");
		expect(wiki.filterTiddlers("1 2 3 4 +[allbefore:include[4]]").join(",")).toBe("1,2,3,4");
		expect(wiki.filterTiddlers("1 2 3 4 +[allbefore[5]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("1 2 3 4 +[allbefore:include[5]]").join(",")).toBe("");
	});

}

});

})();
