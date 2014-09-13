/*\
title: test-tiddlers.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the tiddler object

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("Tiddler tests", function() {

	function compareTiddlers(fieldsA,fieldsB,excludeFields) {
		var tiddlerA = new $tw.Tiddler(fieldsA),
			tiddlerB = new $tw.Tiddler(fieldsB);
		return tiddlerA.isEqual(tiddlerB,excludeFields);
	}

	// Our tests

	it("should compare identical tiddlers", function() {
		expect(compareTiddlers({
			title: "HelloThere",
			text: "one",
			tags: ["one","two","three"]
		},{
			title: "HelloThere",
			text: "one",
			tags: ["one","two","three"]
		})).toEqual(true);
	});

	it("should compare different tiddlers", function() {
		expect(compareTiddlers({
			title: "HelloThere2",
			text: "one",
			tags: ["one","two","three"]
		},{
			title: "HelloThere",
			text: "one",
			tags: ["one","two","three"]
		})).toEqual(false);
		expect(compareTiddlers({
			title: "HelloThere",
			text: "one",
			tags: ["one","three"]
		},{
			title: "HelloThere",
			text: "one",
			tags: ["one","two","three"]
		})).toEqual(false);
		expect(compareTiddlers({
			title: "HelloThere",
			text: "one",
			tags: ["one","two","three"],
			caption: "Test"
		},{
			title: "HelloThere",
			text: "one",
			tags: ["one","two","three"]
		})).toEqual(false);
		expect(compareTiddlers({
			title: "HelloThere",
			text: "one",
			tags: ["one","two","three"]
		},{
			title: "HelloThere",
			text: "one",
			tags: ["one","two","three"],
			caption: "Test"
		})).toEqual(false);
		expect(compareTiddlers({
			title: "HelloThere",
			text: "one",
			tags: ["one","two","three"]
		},{
			title: "HelloThere",
			text: "one"
		})).toEqual(false);
	});

	it("should compare different tiddlers with exclusions", function() {
		expect(compareTiddlers({
			title: "HelloThere2",
			text: "one",
			tags: ["one","two","three"]
		},{
			title: "HelloThere",
			text: "one",
			tags: ["one","two","three"]
		},["title"])).toEqual(true);
		expect(compareTiddlers({
			title: "HelloThere",
			text: "one",
			tags: ["one","three"]
		},{
			title: "HelloThere",
			text: "one",
			tags: ["one","two","three"]
		},["tags"])).toEqual(true);
		expect(compareTiddlers({
			title: "HelloThere",
			text: "one",
			tags: ["one","two","three"],
			caption: "Test"
		},{
			title: "HelloThere",
			text: "one",
			tags: ["one","two","three"]
		},["caption"])).toEqual(true);
		expect(compareTiddlers({
			title: "HelloThere",
			text: "one",
			tags: ["one","two","three"]
		},{
			title: "HelloThere",
			text: "one",
			tags: ["one","two","three"],
			caption: "Test"
		},["caption"])).toEqual(true);
		expect(compareTiddlers({
			title: "HelloThere",
			text: "one",
			tags: ["one","two","three"]
		},{
			title: "HelloThere",
			text: "one"
		},["tags"])).toEqual(true);
	});

});

})();
