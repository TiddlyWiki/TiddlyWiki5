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
		expect(wiki.renderTiddler("text/html","TiddlerFour")).toBe("<p><a class=\"tc-tiddlylink tc-tiddlylink-missing\" href=\"#This%20is%20my%20%27%27amazingly%27%27%20groovy%20macro%21\">This is a link</a></p>");
	});
	it("handles style wikitext notation", function() {
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki","@@.myclass\n!header\n@@")).toBe("<h1 class=\"myclass\">header</h1>");
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki","@@.myclass\n<div>\n\nContent</div>\n@@")).toBe("<div class=\"myclass\"><p>Content</p></div>");
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki","@@.myclass\n---\n@@")).toBe("<hr class=\"myclass\">");
		// Test styles can be added too
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki","@@color:red;\n<div>\n\nContent</div>\n@@")).toBe("<div style=\"color:red;\"><p>Content</p></div>");
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki","@@color:red;\n---\n@@")).toBe("<hr style=\"color:red;\">");
	});
	it("handles inline style wikitext notation", function() {
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki",
			"some @@highlighted@@ text")).toBe('<p>some <span class="tc-inline-style">highlighted</span> text</p>');
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki",
			"some @@color:green;.tc-inline-style 1 style and 1 class@@ text")).toBe('<p>some <span class=" tc-inline-style " style="color:green;">1 style and 1 class</span> text</p>');
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki",
			"some @@background-color:red;red@@ text")).toBe('<p>some <span style="background-color:red;">red</span> text</p>');
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki",
			"some @@.myClass class@@ text")).toBe('<p>some <span class=" myClass ">class</span> text</p>');
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki",
			"some @@.myClass.secondClass 2 classes@@ text")).toBe('<p>some <span class=" myClass secondClass ">2 classes</span> text</p>');
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki",
			"some @@background:red;.myClass style and class@@ text")).toBe('<p>some <span class=" myClass " style="background:red;">style and class</span> text</p>');
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki",
			"some @@background:red;color:white;.myClass 2 style and 1 class@@ text")).toBe('<p>some <span class=" myClass " style="background:red;color:white;">2 style and 1 class</span> text</p>');
	});
});

})();
