/*\
title: test-wikitext.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the wikitext rendering pipeline end-to-end. We also need tests that individually test parsers, rendertreenodes etc., but this gets us started.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("WikiText tests", function() {

	// Create a wiki
	var wiki = new $tw.Wiki();
	// Add a couple of tiddlers
	wiki.addTiddler({title: "TiddlerOne", text: "The quick brown fox"});
	wiki.addTiddler({title: "TiddlerTwo", text: "The rain in Spain\nfalls mainly on the plain"});
	wiki.addTiddler({title: "TiddlerThree", text: "The speed of sound\n\nThe light of speed"});
	wiki.addTiddler({title: "TiddlerFour", text: "\\define my-macro(adjective:'groovy')\nThis is my ''amazingly'' $adjective$ macro!\n\\end\n\n<$link to=<<my-macro>>>This is a link</$link>"});

	it("should render tiddlers with no special markup as-is", function() {
		expect(wiki.renderTiddler("text/plain","TiddlerOne")).toBe("The quick brown fox");
	});
	it("should preserve single new lines", function() {
		expect(wiki.renderTiddler("text/plain","TiddlerTwo")).toBe("The rain in Spain\nfalls mainly on the plain");
	});
	it("should use double new lines to create paragraphs", function() {
		// The paragraphs are lost in the conversion to plain text
		expect(wiki.renderTiddler("text/plain","TiddlerThree")).toBe("The speed of soundThe light of speed");
	});

	it("should render plain text tiddlers as a paragraph", function() {
		expect(wiki.renderTiddler("text/html","TiddlerOne")).toBe("<p>The quick brown fox</p>");
	});
	it("should preserve single new lines", function() {
		expect(wiki.renderTiddler("text/html","TiddlerTwo")).toBe("<p>The rain in Spain\nfalls mainly on the plain</p>");
	});
	it("should use double new lines to create paragraphs", function() {
		expect(wiki.renderTiddler("text/html","TiddlerThree")).toBe("<p>The speed of sound</p><p>The light of speed</p>");
	});
	it("should support attributes specified as macro invocations", function() {
		expect(wiki.renderTiddler("text/html","TiddlerFour")).toBe("<p><a class='tw-tiddlylink tw-tiddlylink-missing' href='#This%20is%20my%20''amazingly''%20groovy%20macro!'>This is a link</a></p>");
	});
	it("should identify wikiwords to automatically link", function() {
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki","No wikilinks here").indexOf("<a") !== -1).toBe(false);
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki","One WikiLink here").indexOf("<a") !== -1).toBe(true);
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki","No Wiki-Link here").indexOf("<a") !== -1).toBe(false);
	});

});

})();
