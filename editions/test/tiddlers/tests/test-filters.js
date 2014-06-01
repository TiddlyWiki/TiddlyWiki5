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

	// Create a wiki
	var wiki = new $tw.Wiki({
		shadowTiddlers: {
			"$:/TiddlerFive": {
				tiddler: new $tw.Tiddler({title: "$:/TiddlerFive",
					text: "Everything in federation",
					tags: ["two"]
				}),
			},
			"TiddlerSix": {
				tiddler: new $tw.Tiddler({title: "TiddlerSix",
					text: "Missing inaction from TiddlerOne",
					tags: []
				}),
			},
			"TiddlerSeventh": {
				tiddler: new $tw.Tiddler({title: "TiddlerSeventh",
					text: "",
					list: "TiddlerOne [[Tiddler Three]] [[a fourth tiddler]] MissingTiddler",
					tags: []
				}),
			},
			"Tiddler8": {
				tiddler: new $tw.Tiddler({title: "Tiddler8",
					text: "Tidd",
					tags: [],
					"test-field": "JoeBloggs"
				})
			}
		}
	});

	// Add a few  tiddlers
	wiki.addTiddler({
		title: "TiddlerOne",
		text: "The quick brown fox in $:/TiddlerTwo",
		tags: ["one"],
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
		tags: ["one","two"],
		modifier: "JohnDoe",
		modified: "201304162202"});
	wiki.addTiddler({
		title: "a fourth tiddler",
		text: "The quality of mercy is not drained by [[Tiddler Three]]",
		tags: [],
		modifier: "JohnDoe"});
	wiki.addTiddler({
		title: "one",
		text: "This is the text of tiddler [[one]]",
		list: "[[Tiddler Three]] [[TiddlerOne]]",
		modifier: "JohnDoe"});

	// Our tests

	it("should retrieve shadow tiddlers", function() {
		expect(wiki.getTiddlerText("Tiddler8")).toBe("Tidd");
	});

	it("should handle the title operator", function() {
		expect(wiki.filterTiddlers("TiddlerOne [title[$:/TiddlerTwo]] [[Tiddler Three]]").join(",")).toBe("TiddlerOne,$:/TiddlerTwo,Tiddler Three");
		expect(wiki.filterTiddlers("[!title[Tiddler Three]]").join(",")).toBe("TiddlerOne,$:/TiddlerTwo,a fourth tiddler,one");
		expect(wiki.filterTiddlers("TiddlerOne [title[$:/TiddlerTwo]] [[Tiddler Three]] [[A Missing Tiddler]]").join(",")).toBe("TiddlerOne,$:/TiddlerTwo,Tiddler Three,A Missing Tiddler");
	});

	it("should handle the field operator", function() {
		expect(wiki.filterTiddlers("[modifier[JoeBloggs]]").join(",")).toBe("TiddlerOne");
		expect(wiki.filterTiddlers("[!modifier[JoeBloggs]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three,a fourth tiddler,one");
		expect(wiki.filterTiddlers("[!is[system]!modifier[JoeBloggs]]").join(",")).toBe("Tiddler Three,a fourth tiddler,one");
		expect(wiki.filterTiddlers("[field:modifier[JoeBloggs]]").join(",")).toBe("TiddlerOne");
		expect(wiki.filterTiddlers("[!field:modifier[JoeBloggs]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three,a fourth tiddler,one");
		expect(wiki.filterTiddlers("[!is[system]!field:modifier[JoeBloggs]]").join(",")).toBe("Tiddler Three,a fourth tiddler,one");
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
		expect(wiki.filterTiddlers("[sort[title]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[!sort[title]]").join(",")).toBe("TiddlerOne,Tiddler Three,one,a fourth tiddler,$:/TiddlerTwo");
		// Temporarily commenting out the following two lines because of platform differences for localeCompare between the browser and Node.js
		// expect(wiki.filterTiddlers("[sortcs[title]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three,TiddlerOne,a fourth tiddler,one");
		// expect(wiki.filterTiddlers("[!sortcs[title]]").join(",")).toBe("one,a fourth tiddler,TiddlerOne,Tiddler Three,$:/TiddlerTwo");
	});

	it("should handle the reverse, first, last, butfirst, butlast, rest and nth operators", function() {
		expect(wiki.filterTiddlers("[sort[title]first[]]").join(",")).toBe("$:/TiddlerTwo");
		expect(wiki.filterTiddlers("[sort[title]first[2]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler");
		expect(wiki.filterTiddlers("[sort[title]first[8]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[sort[title]first[x]]").join(",")).toBe("$:/TiddlerTwo");
		expect(wiki.filterTiddlers("[sort[title]last[]]").join(",")).toBe("TiddlerOne");
		expect(wiki.filterTiddlers("[sort[title]last[2]]").join(",")).toBe("Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[sort[title]last[8]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[sort[title]last[x]]").join(",")).toBe("TiddlerOne");
		expect(wiki.filterTiddlers("[sort[title]reverse[]]").join(",")).toBe("TiddlerOne,Tiddler Three,one,a fourth tiddler,$:/TiddlerTwo");
		expect(wiki.filterTiddlers("[sort[title]reverse[x]]").join(",")).toBe("TiddlerOne,Tiddler Three,one,a fourth tiddler,$:/TiddlerTwo");
		expect(wiki.filterTiddlers("[sort[title]butlast[]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three");
		expect(wiki.filterTiddlers("[sort[title]butlast[2]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,one");
		expect(wiki.filterTiddlers("[sort[title]butlast[8]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[sort[title]butlast[x]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three");
		expect(wiki.filterTiddlers("[sort[title]rest[]]").join(",")).toBe("a fourth tiddler,one,Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[sort[title]rest[2]]").join(",")).toBe("one,Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[sort[title]rest[8]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[sort[title]rest[x]]").join(",")).toBe("a fourth tiddler,one,Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[sort[title]nth[]]").join(",")).toBe("$:/TiddlerTwo");
		expect(wiki.filterTiddlers("[sort[title]nth[2]]").join(",")).toBe("a fourth tiddler");
		expect(wiki.filterTiddlers("[sort[title]nth[8]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[sort[title]nth[x]]").join(",")).toBe("$:/TiddlerTwo");
	});

	it("should handle the tag operator", function() {
		expect(wiki.filterTiddlers("[tag[one]sort[title]]").join(",")).toBe("Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[!tag[one]sort[title]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,one");
		expect(wiki.filterTiddlers("[prefix[Tidd]tag[one]sort[title]]").join(",")).toBe("Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[!is[shadow]tag[two]sort[title]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three");
		expect(wiki.filterTiddlers("[all[shadows]tag[two]sort[title]]").join(",")).toBe("$:/TiddlerFive");
	});

	it("should handle the tags operator", function() {
		expect(wiki.filterTiddlers("[tags[]sort[title]]").join(",")).toBe("one,two");
		expect(wiki.filterTiddlers("[[TiddlerOne]tags[]sort[title]]").join(",")).toBe("one");
	});

	it("should handle the tagging operator", function() {
		expect(wiki.filterTiddlers("[[one]tagging[]sort[title]]").join(",")).toBe("Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[[one]tagging[]]").join(",")).toBe("Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[[two]tagging[]sort[title]]").join(",")).toBe("$:/TiddlerFive,$:/TiddlerTwo,Tiddler Three");
		var fakeWidget = {getVariable: function() {return "one";}};
		expect(wiki.filterTiddlers("[all[current]tagging[]sort[title]]",fakeWidget).join(",")).toBe("Tiddler Three,TiddlerOne");
	});

	it("should handle the untagged operator", function() {
		expect(wiki.filterTiddlers("[untagged[]sort[title]]").join(",")).toBe("a fourth tiddler,one");
		expect(wiki.filterTiddlers("[!untagged[]sort[title]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three,TiddlerOne");
	});

	it("should handle the links operator", function() {
		expect(wiki.filterTiddlers("[!is[shadow]links[]sort[title]]").join(",")).toBe("a fourth tiddler,one,Tiddler Three,TiddlerSix,TiddlerTwo,TiddlerZero");
		expect(wiki.filterTiddlers("[all[shadows]links[]sort[title]]").join(",")).toBe("TiddlerOne");
	});

	it("should handle the backlinks operator", function() {
		expect(wiki.filterTiddlers("[!is[shadow]backlinks[]sort[title]]").join(",")).toBe("a fourth tiddler,one");
		expect(wiki.filterTiddlers("[all[shadows]backlinks[]sort[title]]").join(",")).toBe("Tiddler Three");
	});

	it("should handle the has operator", function() {
		expect(wiki.filterTiddlers("[has[modified]sort[title]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three,TiddlerOne");
		expect(wiki.filterTiddlers("[!has[modified]sort[title]]").join(",")).toBe("a fourth tiddler,one");
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
		expect(wiki.filterTiddlers("[search{Tiddler8}sort[title]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three,TiddlerOne");
	});

	it("should handle the each operator", function() {
		expect(wiki.filterTiddlers("[each[modifier]sort[title]]").join(",")).toBe("$:/TiddlerTwo,TiddlerOne");
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
			expect(wiki.filterTiddlers("[!is[current]sort[title]]",fakeWidget).join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,one,TiddlerOne");
		});

		it("should handle the '[is[system]]' operator", function() {
			expect(wiki.filterTiddlers("[is[system]]").join(",")).toBe("$:/TiddlerTwo");
			expect(wiki.filterTiddlers("[!is[system]sort[title]]").join(",")).toBe("a fourth tiddler,one,Tiddler Three,TiddlerOne");
		});

		it("should handle the '[is[shadow]]' operator", function() {
			expect(wiki.filterTiddlers("[all[shadows]sort[title]]").join(",")).toBe("$:/TiddlerFive,Tiddler8,TiddlerSeventh,TiddlerSix");
			expect(wiki.filterTiddlers("[!is[shadow]sort[title]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three,TiddlerOne");
		});

		it("should handle the '[is[missing]]' operator", function() {
			expect(wiki.filterTiddlers("[all[missing]]").join(",")).toBe("TiddlerZero,TiddlerTwo");
			expect(wiki.filterTiddlers("[!is[missing]sort[title]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[[TiddlerOne]is[missing]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[[TiddlerZero]is[missing]]").join(",")).toBe("TiddlerZero");
			expect(wiki.filterTiddlers("[!title[Tiddler Three]is[missing]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[!title[Tiddler Three]!is[missing]sort[title]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,one,TiddlerOne");
		});

		it("should handle the '[is[orphan]]' operator", function() {
			expect(wiki.filterTiddlers("[is[orphan]sort[title]]").join(",")).toBe("a fourth tiddler,TiddlerOne");
			expect(wiki.filterTiddlers("[!is[orphan]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three,one");
			expect(wiki.filterTiddlers("[[TiddlerOne]is[orphan]]").join(",")).toBe("TiddlerOne");
			expect(wiki.filterTiddlers("[[TiddlerOne]!is[orphan]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[!title[Tiddler Three]is[orphan]sort[title]]").join(",")).toBe("a fourth tiddler,TiddlerOne");
			expect(wiki.filterTiddlers("[!title[Tiddler Three]!is[orphan]]").join(",")).toBe("$:/TiddlerTwo,one");
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

	it("should handle the before and after operators", function() {
		expect(wiki.filterTiddlers("[list[TiddlerSeventh]after[TiddlerOne]]").join(",")).toBe("Tiddler Three");
		expect(wiki.filterTiddlers("[list[TiddlerSeventh]after[a fourth tiddler]]").join(",")).toBe("MissingTiddler");
		expect(wiki.filterTiddlers("[list[TiddlerSeventh]after[MissingTiddler]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[list[TiddlerSeventh]before[TiddlerOne]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[list[TiddlerSeventh]before[a fourth tiddler]]").join(",")).toBe("Tiddler Three");
		expect(wiki.filterTiddlers("[list[TiddlerSeventh]before[MissingTiddler]]").join(",")).toBe("a fourth tiddler");
	});

});

})();
