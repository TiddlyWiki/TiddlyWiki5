/*\
title: test-wikitext.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the wikitext rendering pipeline end-to-end. We also need tests that individually test parsers, rendertreenodes etc., but this gets us started.

\*/

"use strict";

describe("WikiText tests", function() {

	// Create a wiki
	var wiki = new $tw.Wiki();
	// Add a couple of tiddlers
	wiki.addTiddler({title: "TiddlerOne", text: "The quick brown fox"});
	wiki.addTiddler({title: "TiddlerTwo", text: "The rain in Spain\nfalls mainly on the plain"});
	wiki.addTiddler({title: "TiddlerThree", text: "The speed of sound\n\nThe light of speed"});
	wiki.addTiddler({title: "TiddlerFour", text: "\\define my-macro(adjective:'groovy')\nThis is my ''amazingly'' $adjective$ macro!\n\\end\n\n<$link to=<<my-macro>>>This is a link</$link>"});
	wiki.addTiddler({title: "TiddlerFive", text: "Paragraph. ^markID"});

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
	it("handles link wikitext notation", function() {
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki","A link to [[TiddlerFive]]")).toBe('<p>A link to <a class="tc-tiddlylink tc-tiddlylink-resolves" href="#TiddlerFive">TiddlerFive</a></p>' );
		var tiddler = wiki.getTiddler("TiddlerFive");
		wiki.deleteTiddler("TiddlerFive");
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki","A link to [[TiddlerFive]]")).toBe('<p>A link to <a class="tc-tiddlylink tc-tiddlylink-missing" href="#TiddlerFive">TiddlerFive</a></p>');
		wiki.addTiddler(tiddler);
	});
	it("handles anchor wikitext notation", function() {
		// Link with anchor generates href with ^^ separator
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki","Link to section [[TiddlerFive^markID]]")).toBe('<p>Link to section <a class="tc-tiddlylink tc-tiddlylink-resolves" href="#TiddlerFive%5E%5EmarkID">TiddlerFive</a></p>' );
		// Anchor is absorbed into parent <p> element with data-tw-anchor and id attributes
		expect(wiki.renderTiddler("text/html","TiddlerFive", { variables: { currentTiddler: "TiddlerFive" }})).toBe('<p data-tw-anchor="markID" id="TiddlerFive^^markID" tabindex="-1">Paragraph.</p>');
		expect(wiki.renderTiddler("text/html","TiddlerFive")).toBe('<p data-tw-anchor="markID" id="markID" tabindex="-1">Paragraph.</p>');
	});
	it("handles anchor in list items (regression: list must not lose its items)", function() {
		// Each anchored list item should produce <li data-tw-anchor="...">
		// and the <ul> must still contain ALL items (bug: anchor-container was
		// mistaken for a marker, causing items to be silently dropped)
		var result = wiki.renderText("text/html","text/vnd-tiddlywiki",
			"* first item ^a\n* second item ^b\n* third item");
		expect(result).toBe(
			'<ul><li data-tw-anchor="a" id="a" tabindex="-1">first item</li><li data-tw-anchor="b" id="b" tabindex="-1">second item</li><li>third item</li></ul>'
		);
	});
	it("handles single block transclusion with anchor", function() {
		// Add a tiddler with multiple anchored blocks
		wiki.addTiddler({title: "AnchoredBlocks", text: "First paragraph. ^first\n\nSecond paragraph. ^second\n\nThird paragraph. ^third"});
		// Transclude a single block by anchor — the tiddler widget sets currentTiddler, so id includes title prefix
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki","{{AnchoredBlocks^second}}")).toBe('<p data-tw-anchor="second" id="AnchoredBlocks^^second" tabindex="-1">Second paragraph.</p>');
		// Transclude first block
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki","{{AnchoredBlocks^first}}")).toBe('<p data-tw-anchor="first" id="AnchoredBlocks^^first" tabindex="-1">First paragraph.</p>');
		// Transclude third block
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki","{{AnchoredBlocks^third}}")).toBe('<p data-tw-anchor="third" id="AnchoredBlocks^^third" tabindex="-1">Third paragraph.</p>');
	});
	it("handles range transclusion with anchor start..end", function() {
		// Add a tiddler with multiple anchored blocks
		wiki.addTiddler({title: "RangeBlocks", text: "Block A. ^blockA\n\nBlock B. ^blockB\n\nBlock C. ^blockC\n\nBlock D. ^blockD"});
		// Transclude range from blockB to blockC
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki","{{RangeBlocks^blockB^blockC}}")).toBe('<p data-tw-anchor="blockB" id="RangeBlocks^^blockB" tabindex="-1">Block B.</p><p data-tw-anchor="blockC" id="RangeBlocks^^blockC" tabindex="-1">Block C.</p>');
		// Transclude range from blockA to blockC (3 blocks)
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki","{{RangeBlocks^blockA^blockC}}")).toBe('<p data-tw-anchor="blockA" id="RangeBlocks^^blockA" tabindex="-1">Block A.</p><p data-tw-anchor="blockB" id="RangeBlocks^^blockB" tabindex="-1">Block B.</p><p data-tw-anchor="blockC" id="RangeBlocks^^blockC" tabindex="-1">Block C.</p>');
		// Transclude full range from blockA to blockD
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki","{{RangeBlocks^blockA^blockD}}")).toBe('<p data-tw-anchor="blockA" id="RangeBlocks^^blockA" tabindex="-1">Block A.</p><p data-tw-anchor="blockB" id="RangeBlocks^^blockB" tabindex="-1">Block B.</p><p data-tw-anchor="blockC" id="RangeBlocks^^blockC" tabindex="-1">Block C.</p><p data-tw-anchor="blockD" id="RangeBlocks^^blockD" tabindex="-1">Block D.</p>');
		// Single anchor in range format (same start and end)
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki","{{RangeBlocks^blockB^blockB}}")).toBe('<p data-tw-anchor="blockB" id="RangeBlocks^^blockB" tabindex="-1">Block B.</p>');
	});
	it("handles range transclusion with mixed block types", function() {
		// Add a tiddler with headings and paragraphs
		wiki.addTiddler({title: "MixedBlocks", text: "!! Heading One ^h1\n\nParagraph under heading. ^p1\n\n!! Heading Two ^h2\n\nAnother paragraph. ^p2"});
		// Transclude range from heading to paragraph
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki","{{MixedBlocks^h1^p1}}")).toBe('<h2 class="" data-tw-anchor="h1" id="MixedBlocks^^h1" tabindex="-1">Heading One</h2><p data-tw-anchor="p1" id="MixedBlocks^^p1" tabindex="-1">Paragraph under heading.</p>');
		// Transclude across heading boundary
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki","{{MixedBlocks^p1^h2}}")).toBe('<p data-tw-anchor="p1" id="MixedBlocks^^p1" tabindex="-1">Paragraph under heading.</p><h2 class="" data-tw-anchor="h2" id="MixedBlocks^^h2" tabindex="-1">Heading Two</h2>');
	});
	it("handles transclusion with non-existent anchor gracefully", function() {
		wiki.addTiddler({title: "SomeBlocks", text: "Paragraph. ^exists"});
		// Non-existent single anchor renders full tiddler (fallback)
		var result = wiki.renderText("text/html","text/vnd-tiddlywiki","{{SomeBlocks^nonexistent}}");
		expect(result).toBe('<p data-tw-anchor="exists" id="SomeBlocks^^exists" tabindex="-1">Paragraph.</p>');
	});
	it("handles code anchor in transclusion (inline syntax)", function() {
		wiki.addTiddler({title: "CodeBlocks", text: "```js ^codeBlock\nconsole.log('hello');\n```\n\nParagraph. ^afterCode"});
		// Transclude just the code block
		expect(wiki.renderText("text/html","text/vnd-tiddlywiki","{{CodeBlocks^codeBlock}}")).toBe("<pre data-tw-anchor=\"codeBlock\" id=\"CodeBlocks^^codeBlock\" tabindex=\"-1\"><code>console.log('hello');</code></pre>");
	});
	it("handles anchor in nested list items", function() {
		var result = wiki.renderText("text/html","text/vnd-tiddlywiki",
			"* outer ^outerA\n** inner ^innerB\n* outer2");
		expect(result).toBe(
			'<ul><li data-tw-anchor="outerA" id="outerA" tabindex="-1">outer<ul><li data-tw-anchor="innerB" id="innerB" tabindex="-1">inner</li></ul></li><li>outer2</li></ul>'
		);
	});
	it("handles quoteblock with anchor (inline syntax)", function() {
		var result = wiki.renderText("text/html","text/vnd-tiddlywiki",
			"<<< ^quoteId\nQuote body.\n<<<");
		expect(result).toContain("data-tw-anchor=\"quoteId\"");
		expect(result).toContain("<blockquote");
	});
	it("handles transclusion of quoteblock with anchor", function() {
		wiki.addTiddler({title: "QuoteAnchorTiddler", text: "<<< ^myQuote\nQuoted text.\n<<<\n\nParagraph. ^afterQuote"});
		var result = wiki.renderText("text/html","text/vnd-tiddlywiki","{{QuoteAnchorTiddler^myQuote}}");
		expect(result).toContain("data-tw-anchor=\"myQuote\"");
		expect(result).toContain("<blockquote");
		expect(result).toContain("Quoted text.");
		// Should NOT contain the paragraph
		expect(result).not.toContain("afterQuote");
	});
	it("handles transclusion of typedblock with anchor", function() {
		wiki.addTiddler({title: "TypedAnchorTiddler", text: "$$$text/plain ^myTyped\nHello typed.\n$$$\n\nParagraph. ^afterTyped"});
		var result = wiki.renderText("text/html","text/vnd-tiddlywiki","{{TypedAnchorTiddler^myTyped}}");
		expect(result).toContain("Hello typed.");
	});
	it("handles range transclusion including code block with anchor", function() {
		wiki.addTiddler({title: "MixedCodeBlocks", text: "Intro. ^intro\n\n```js ^codeBlock\nvar x = 1;\n```\n\nOutro. ^outro"});
		var result = wiki.renderText("text/html","text/vnd-tiddlywiki","{{MixedCodeBlocks^intro^codeBlock}}");
		expect(result).toContain("Intro.");
		expect(result).toContain("<code>var x = 1;</code>");
	});
});

