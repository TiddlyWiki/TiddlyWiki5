/*\
title: test-widget.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the wikitext rendering pipeline end-to-end. We also need tests that individually test parsers, rendertreenodes etc., but this gets us started.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("Widget module", function() {

	var widget = require("$:/core/modules/widgets/widget.js");

	function createWidgetNode(parseTreeNode,wiki,variables) {
		return new widget.widget(parseTreeNode,{
				wiki: wiki,
				variables: variables || {},
				document: $tw.document
			});
	}

	function parseText(text,wiki) {
		var parser = wiki.new_parseText("text/vnd.tiddlywiki",text);
		return parser ? {type: "widget", children: parser.tree} : undefined;
	}

	function renderWidgetNode(widgetNode) {
		$tw.document.setSequenceNumber(0);
		var wrapper = $tw.document.createElement("div");
		widgetNode.render(wrapper,null);
// console.log(require("util").inspect(wrapper,{depth: 8}));
		return wrapper;
	}

	function refreshWidgetNode(widgetNode,wrapper) {
		var changedTiddlers = {TiddlerOne:true};
		widgetNode.refresh(changedTiddlers,wrapper,null);
// console.log(require("util").inspect(wrapper,{depth: 8}));
	}

	it("should deal with text nodes and HTML elements", function() {
		var wiki = new $tw.Wiki();
		// Test parse tree
		var parseTreeNode = {type: "widget", children: [
								{type: "text", text: "A text node"},
								{type: "element", tag: "div", attributes: {
										"class": {type: "string", value: "myClass"},
										"title": {type: "string", value: "myTitle"}
									}, children: [
										{type: "text", text: " and the content of a DIV"},
										{type: "element", tag: "div", children: [
											{type: "text", text: " and an inner DIV"},
									]},
										{type: "text", text: " and back in the outer DIV"}
								]}
							]};
		// Construct the widget node
		var widgetNode = createWidgetNode(parseTreeNode,wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		describe("should render", function() {
			// Test the rendering
			expect(wrapper.innerHTML).toBe("A text node<div class='myClass' title='myTitle'>\n and the content of a DIV<div>\n and an inner DIV</div> and back in the outer DIV</div>");
			// Test the sequence numbers in the DOM
			expect(wrapper.sequenceNumber).toBe(0);
			expect(wrapper.children[0].sequenceNumber).toBe(1);
			expect(wrapper.children[1].sequenceNumber).toBe(2);
			expect(wrapper.children[1].children[0].sequenceNumber).toBe(3);
			expect(wrapper.children[1].children[1].sequenceNumber).toBe(4);
			expect(wrapper.children[1].children[1].children[0].sequenceNumber).toBe(5);
			expect(wrapper.children[1].children[2].sequenceNumber).toBe(6);
		});
	});

	it("should deal with transclude widgets and indirect attributes", function() {
		var wiki = new $tw.Wiki();
		// Add a tiddler
		wiki.addTiddlers([
			{title: "TiddlerOne", text: "the quick brown fox"}
		]);
		// Test parse tree
		var parseTreeNode = {type: "widget", children: [
								{type: "text", text: "A text node"},
								{type: "element", tag: "div", attributes: {
										"class": {type: "string", value: "myClass"},
										"title": {type: "indirect", textReference: "TiddlerOne"}
									}, children: [
										{type: "text", text: " and the content of a DIV"},
										{type: "element", tag: "div", children: [
											{type: "text", text: " and an inner DIV"},
									]},
										{type: "text", text: " and back in the outer DIV"},
										{type: "transclude", attributes: {
										"title": {type: "string", value: "TiddlerOne"}
									}}
								]},
								{type: "transclude", attributes: {
										"title": {type: "string", value: "TiddlerOne"}
									}}
							]};
		// Construct the widget node
		var widgetNode = createWidgetNode(parseTreeNode,wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		describe("should render", function() {
			// Test the rendering
			expect(wrapper.innerHTML).toBe("A text node<div class='myClass' title='the quick brown fox'>\n and the content of a DIV<div>\n and an inner DIV</div> and back in the outer DIVthe quick brown fox</div>the quick brown fox");
			// Test the sequence numbers in the DOM
			expect(wrapper.sequenceNumber).toBe(0);
			expect(wrapper.children[0].sequenceNumber).toBe(1);
			expect(wrapper.children[1].sequenceNumber).toBe(2);
			expect(wrapper.children[1].children[0].sequenceNumber).toBe(3);
			expect(wrapper.children[1].children[1].sequenceNumber).toBe(4);
			expect(wrapper.children[1].children[1].children[0].sequenceNumber).toBe(5);
			expect(wrapper.children[1].children[2].sequenceNumber).toBe(6);
			expect(wrapper.children[1].children[3].sequenceNumber).toBe(7);
			expect(wrapper.children[2].sequenceNumber).toBe(8);
		});
		// Change the transcluded tiddler
		wiki.addTiddler({title: "TiddlerOne", text: "jumps over the lazy dog"});
		// Refresh
		refreshWidgetNode(widgetNode,wrapper);
		describe("should refresh", function() {
			// Test the refreshing
			expect(wrapper.innerHTML).toBe("A text node<div class='myClass' title='jumps over the lazy dog'>\n and the content of a DIV<div>\n and an inner DIV</div> and back in the outer DIVjumps over the lazy dog</div>jumps over the lazy dog");
			// Test the sequence numbers in the DOM
			expect(wrapper.sequenceNumber).toBe(0);
			expect(wrapper.children[0].sequenceNumber).toBe(1);
			expect(wrapper.children[1].sequenceNumber).toBe(2);
			expect(wrapper.children[1].children[0].sequenceNumber).toBe(3);
			expect(wrapper.children[1].children[1].sequenceNumber).toBe(4);
			expect(wrapper.children[1].children[1].children[0].sequenceNumber).toBe(5);
			expect(wrapper.children[1].children[2].sequenceNumber).toBe(6);
			expect(wrapper.children[1].children[3].sequenceNumber).toBe(9);
			expect(wrapper.children[2].sequenceNumber).toBe(10);
		});
	});

	it("should detect recursion of the transclude macro", function() {
		var wiki = new $tw.Wiki();
		// Add a tiddler
		wiki.addTiddlers([
			{title: "TiddlerOne", text: "<$transclude title='TiddlerOne'/>\n"}
		]);
		// Test parse tree
		var parseTreeNode = {type: "widget", children: [
								{type: "transclude", attributes: {
										"title": {type: "string", value: "TiddlerOne"}
									}}
							]};
		// Construct the widget node
		var widgetNode = createWidgetNode(parseTreeNode,wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		describe("should detect the recursion", function() {
			// Test the rendering
			expect(wrapper.innerHTML).toBe("Tiddler recursion error in transclude widget\n");
		});

	});

	it("should parse and render transclusions", function() {
		var wiki = new $tw.Wiki();
		// Add a tiddler
		wiki.addTiddlers([
			{title: "TiddlerOne", text: "Jolly Old World"},
			{title: "TiddlerTwo", text: "<$transclude title={{TiddlerThree}}/>"},
			{title: "TiddlerThree", text: "TiddlerOne"}
		]);
		// Construct the widget node
		var text = "My <$transclude title='TiddlerTwo'/> is Jolly"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>\nMy Jolly Old World is Jolly</p>");
	});

	it("should deal with the setvariable widget", function() {
		var wiki = new $tw.Wiki();
		// Add some tiddlers
		wiki.addTiddlers([
			{title: "TiddlerOne", text: "Jolly Old World"},
			{title: "TiddlerTwo", text: "<$transclude title={{TiddlerThree}}/>"},
			{title: "TiddlerThree", text: "TiddlerOne"},
			{title: "TiddlerFour", text: "TiddlerTwo"}
		]);
		// Construct the widget node
		var text = "My <$setvariable name='tiddlerTitle' value={{TiddlerFour}}><$transclude title={{!!title}}/></$setvariable> is Jolly"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>\nMy Jolly Old World is Jolly</p>");
		// Change the transcluded tiddler
		wiki.addTiddler({title: "TiddlerFour", text: "TiddlerOne"});
		// Refresh
		refreshWidgetNode(widgetNode,wrapper);
		describe("should refresh", function() {
			// Test the refreshing
			expect(wrapper.innerHTML).toBe("<p>\nMy Jolly Old World is Jolly</p>");
			// Test the sequence numbers in the DOM
			expect(wrapper.sequenceNumber).toBe(0);
			expect(wrapper.children[0].sequenceNumber).toBe(1);
			expect(wrapper.children[0].children[0].sequenceNumber).toBe(2);
			expect(wrapper.children[0].children[1].sequenceNumber).toBe(5);
			expect(wrapper.children[0].children[2].sequenceNumber).toBe(4);
		});
	});

	it("should deal with attributes specified as macro invocations", function() {
		var wiki = new $tw.Wiki();
		// Construct the widget node
		var text = "<div class=<<myMacro 'something' three:'thing'>>>Content</div>";
		var variables = {
			myMacro: {
				value: "My something $one$, $two$ or other $three$",
				params: [
					{name: "one", "default": "paramOne"},
					{name: "two"},
					{name: "three", "default": "paramTwo"}
				]
			}
		};
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki,variables);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>\n<div class='My something something,  or other thing'>\nContent</div></p>");
	});

	it("should deal with the list widget", function() {
		var wiki = new $tw.Wiki();
		// Add some tiddlers
		wiki.addTiddlers([
			{title: "TiddlerOne", text: "Jolly Old World"},
			{title: "TiddlerTwo", text: "Worldly Old Jelly"},
			{title: "TiddlerThree", text: "Golly Gosh"},
			{title: "TiddlerFour", text: "Lemon Squash"}
		]);
		// Construct the widget node
		var text = "<$list><$setvariable name='tiddlerTitle' value=<<listItem>>><$view field='title'/></$setvariable></$list>";
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>\nTiddlerFourTiddlerOneTiddlerThreeTiddlerTwo</p>");
		// Add another tiddler
		wiki.addTiddler({title: "TiddlerFive", text: "Jalapeno Peppers"});
		// Refresh
		refreshWidgetNode(widgetNode,wrapper);
		describe("should refresh", function() {
			// Test the refreshing
			expect(wrapper.innerHTML).toBe("<p>\nTiddlerFiveTiddlerFourTiddlerOneTiddlerThreeTiddlerTwo</p>");
			// Test the sequence numbers in the DOM
			expect(wrapper.sequenceNumber).toBe(0);
			expect(wrapper.children[0].sequenceNumber).toBe(1);
			expect(wrapper.children[0].children[0].sequenceNumber).toBe(6);
			expect(wrapper.children[0].children[1].sequenceNumber).toBe(2);
			expect(wrapper.children[0].children[2].sequenceNumber).toBe(3);
			expect(wrapper.children[0].children[3].sequenceNumber).toBe(4);
			expect(wrapper.children[0].children[4].sequenceNumber).toBe(5);
		});
		// Remove a tiddler
		wiki.deleteTiddler("TiddlerThree");
		// Refresh
		refreshWidgetNode(widgetNode,wrapper);
		describe("should refresh", function() {
			// Test the refreshing
			expect(wrapper.innerHTML).toBe("<p>\nTiddlerFiveTiddlerFourTiddlerOneTiddlerTwo</p>");
			// Test the sequence numbers in the DOM
			expect(wrapper.sequenceNumber).toBe(0);
			expect(wrapper.children[0].sequenceNumber).toBe(1);
			expect(wrapper.children[0].children[0].sequenceNumber).toBe(6);
			expect(wrapper.children[0].children[1].sequenceNumber).toBe(2);
			expect(wrapper.children[0].children[2].sequenceNumber).toBe(3);
			expect(wrapper.children[0].children[3].sequenceNumber).toBe(5);
		});
	});

	it("should deal with the list widget and empty lists", function() {
		var wiki = new $tw.Wiki();
		// Construct the widget node
		var text = "<$list emptyMessage='nothing'><$setvariable name='tiddlerTitle' value=<<listItem>>><$view field='title'/></$setvariable></$list>";
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>\nnothing</p>");
	});

	it("should refresh lists that become empty", function() {
		var wiki = new $tw.Wiki();
		// Add some tiddlers
		wiki.addTiddlers([
			{title: "TiddlerOne", text: "Jolly Old World"},
			{title: "TiddlerTwo", text: "Worldly Old Jelly"},
			{title: "TiddlerThree", text: "Golly Gosh"},
			{title: "TiddlerFour", text: "Lemon Squash"}
		]);
		// Construct the widget node
		var text = "<$list emptyMessage='nothing'><$setvariable name='tiddlerTitle' value=<<listItem>>><$view field='title'/></$setvariable></$list>";
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>\nTiddlerFourTiddlerOneTiddlerThreeTiddlerTwo</p>");
		// Get rid of the tiddlers
		wiki.deleteTiddler("TiddlerOne");
		wiki.deleteTiddler("TiddlerTwo");
		wiki.deleteTiddler("TiddlerThree");
		wiki.deleteTiddler("TiddlerFour");
		// Refresh
		refreshWidgetNode(widgetNode,wrapper);
		describe("should refresh", function() {
			// Test the refreshing
			expect(wrapper.innerHTML).toBe("<p>\nnothing</p>");
		});
	});

});

})();
