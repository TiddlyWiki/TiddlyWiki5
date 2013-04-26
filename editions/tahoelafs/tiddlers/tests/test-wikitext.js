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

	it("should render tiddlers with no special markup render as-is", function() {
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
		expect(wiki.renderTiddler("text/html","TiddlerOne")).toBe("<p>\nThe quick brown fox</p>");
	});
	it("should preserve single new lines", function() {
		expect(wiki.renderTiddler("text/html","TiddlerTwo")).toBe("<p>\nThe rain in Spain\nfalls mainly on the plain</p>");
	});
	it("should use double new lines to create paragraphs", function() {
		expect(wiki.renderTiddler("text/html","TiddlerThree")).toBe("<p>\nThe speed of sound</p><p>\nThe light of speed</p>");
	});

});

})();
