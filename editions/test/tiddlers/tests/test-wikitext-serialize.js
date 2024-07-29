/*\
title: test-wikitext-serialize.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the wikitext inverse-rendering from Wiki AST.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("WikiAST serialization tests", function() {

	// Create a wiki
	var wiki = new $tw.Wiki();
	// Add a couple of tiddlers
	wiki.addTiddler({title: "TiddlerOne", text: "The quick brown fox"});
	wiki.addTiddler({title: "TiddlerTwo", text: "The rain in Spain\nfalls mainly on the plain"});
	wiki.addTiddler({title: "TiddlerThree", text: "The speed of sound\n\nThe light of speed"});
	wiki.addTiddler({title: "TiddlerFour", text: "Simple `JS` and complex\n\n---\n\n```js\nvar match = reEnd.exec(this.parser.source)\n```\nend"});

	it("should render tiddlers with no special markup as-is", function() {
		expect($tw.utils.serializeParseTree(wiki.parseTiddler('TiddlerOne').tree)).toBe(wiki.getTiddlerText('TiddlerOne'));
	});
	it("should preserve single new lines", function() {
		expect($tw.utils.serializeParseTree(wiki.parseTiddler('TiddlerTwo').tree)).toBe(wiki.getTiddlerText('TiddlerTwo'));
	});
	it("should preserve double new lines to create paragraphs", function() {
		expect($tw.utils.serializeParseTree(wiki.parseTiddler('TiddlerThree').tree)).toBe(wiki.getTiddlerText('TiddlerThree'));
	});
	
	it("should render inline code and block code", function() {
		expect($tw.utils.serializeParseTree(wiki.parseTiddler('TiddlerFour').tree)).toBe(wiki.getTiddlerText('TiddlerFour'));
	});
});

})();
