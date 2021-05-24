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

	function createWidgetNode(parseTreeNode,wiki) {
		return new widget.widget(parseTreeNode,{
				wiki: wiki,
				document: $tw.fakeDocument
			});
	}

	function parseText(text,wiki,options) {
		var parser = wiki.parseText("text/vnd.tiddlywiki",text,options);
		return parser ? {type: "widget", children: parser.tree} : undefined;
	}

	function renderWidgetNode(widgetNode) {
		$tw.fakeDocument.setSequenceNumber(0);
		var wrapper = $tw.fakeDocument.createElement("div");
		widgetNode.render(wrapper,null);
// console.log(require("util").inspect(wrapper,{depth: 8}));
		return wrapper;
	}

	function refreshWidgetNode(widgetNode,wrapper,changes) {
		var changedTiddlers = {};
		if(changes) {
			$tw.utils.each(changes,function(title) {
				changedTiddlers[title] = true;
			});
		}
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
		// Test the rendering
		expect(wrapper.innerHTML).toBe("A text node<div class=\"myClass\" title=\"myTitle\"> and the content of a DIV<div> and an inner DIV</div> and back in the outer DIV</div>");
		// Test the sequence numbers in the DOM
		expect(wrapper.sequenceNumber).toBe(0);
		expect(wrapper.children[0].sequenceNumber).toBe(1);
		expect(wrapper.children[1].sequenceNumber).toBe(2);
		expect(wrapper.children[1].children[0].sequenceNumber).toBe(3);
		expect(wrapper.children[1].children[1].sequenceNumber).toBe(4);
		expect(wrapper.children[1].children[1].children[0].sequenceNumber).toBe(5);
		expect(wrapper.children[1].children[2].sequenceNumber).toBe(6);
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
										"tiddler": {type: "string", value: "TiddlerOne"}
									}}
								]},
								{type: "transclude", attributes: {
										"tiddler": {type: "string", value: "TiddlerOne"}
									}}
							]};
		// Construct the widget node
		var widgetNode = createWidgetNode(parseTreeNode,wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("A text node<div class=\"myClass\" title=\"the quick brown fox\"> and the content of a DIV<div> and an inner DIV</div> and back in the outer DIVthe quick brown fox</div>the quick brown fox");
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
		// Change the transcluded tiddler
		wiki.addTiddler({title: "TiddlerOne", text: "jumps over the lazy dog"});
		// Refresh
		refreshWidgetNode(widgetNode,wrapper,["TiddlerOne"]);
		// Test the refreshing
		expect(wrapper.innerHTML).toBe("A text node<div class=\"myClass\" title=\"jumps over the lazy dog\"> and the content of a DIV<div> and an inner DIV</div> and back in the outer DIVjumps over the lazy dog</div>jumps over the lazy dog");
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

	it("should detect recursion of the transclude macro", function() {
		var wiki = new $tw.Wiki();
		// Add a tiddler
		wiki.addTiddlers([
			{title: "TiddlerOne", text: "<$transclude tiddler='TiddlerOne'/>\n"}
		]);
		// Test parse tree
		var parseTreeNode = {type: "widget", children: [
								{type: "transclude", attributes: {
										"tiddler": {type: "string", value: "TiddlerOne"}
									}}
							]};
		// Construct the widget node
		var widgetNode = createWidgetNode(parseTreeNode,wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<span class=\"tc-error\">Recursive transclusion error in transclude widget</span>\n");
	});

	it("should deal with SVG elements", function() {
		var wiki = new $tw.Wiki();
		// Construct the widget node
		var text = "<svg class=\"tv-image-new-button\" viewBox=\"83 81 50 50\" width=\"22pt\" height=\"22pt\"><path d=\"M 101.25 112.5 L 101.25 127.5 C 101.25 127.5 101.25 127.5 101.25 127.5 L 101.25 127.5 C 101.25 129.156855 102.593146 130.5 104.25 130.5 L 111.75 130.5 C 113.406854 130.5 114.75 129.156854 114.75 127.5 L 114.75 112.5 L 129.75 112.5 C 131.406854 112.5 132.75 111.156854 132.75 109.5 L 132.75 102 C 132.75 100.343146 131.406854 99 129.75 99 L 114.75 99 L 114.75 84 C 114.75 82.343146 113.406854 81 111.75 81 L 104.25 81 C 104.25 81 104.25 81 104.25 81 C 102.593146 81 101.25 82.343146 101.25 84 L 101.25 99 L 86.25 99 C 86.25 99 86.25 99 86.25 99 C 84.593146 99 83.25 100.343146 83.25 102 L 83.25 109.5 C 83.25 109.5 83.25 109.5 83.25 109.5 L 83.25 109.5 C 83.25 111.156855 84.593146 112.5 86.25 112.5 Z\"/></svg>\n";
		var widgetNode = createWidgetNode(parseText(text,wiki,{parseAsInline:true}),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<svg class=\"tv-image-new-button\" height=\"22pt\" viewBox=\"83 81 50 50\" width=\"22pt\"><path d=\"M 101.25 112.5 L 101.25 127.5 C 101.25 127.5 101.25 127.5 101.25 127.5 L 101.25 127.5 C 101.25 129.156855 102.593146 130.5 104.25 130.5 L 111.75 130.5 C 113.406854 130.5 114.75 129.156854 114.75 127.5 L 114.75 112.5 L 129.75 112.5 C 131.406854 112.5 132.75 111.156854 132.75 109.5 L 132.75 102 C 132.75 100.343146 131.406854 99 129.75 99 L 114.75 99 L 114.75 84 C 114.75 82.343146 113.406854 81 111.75 81 L 104.25 81 C 104.25 81 104.25 81 104.25 81 C 102.593146 81 101.25 82.343146 101.25 84 L 101.25 99 L 86.25 99 C 86.25 99 86.25 99 86.25 99 C 84.593146 99 83.25 100.343146 83.25 102 L 83.25 109.5 C 83.25 109.5 83.25 109.5 83.25 109.5 L 83.25 109.5 C 83.25 111.156855 84.593146 112.5 86.25 112.5 Z\"></path></svg>\n");
		expect(wrapper.firstChild.namespaceURI).toBe("http://www.w3.org/2000/svg");
	});

	it("should parse and render transclusions", function() {
		var wiki = new $tw.Wiki();
		// Add a tiddler
		wiki.addTiddlers([
			{title: "TiddlerOne", text: "Jolly Old World"},
			{title: "TiddlerTwo", text: "<$transclude tiddler={{TiddlerThree}}/>"},
			{title: "TiddlerThree", text: "TiddlerOne"}
		]);
		// Construct the widget node
		var text = "My <$transclude tiddler='TiddlerTwo'/> is Jolly"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>My Jolly Old World is Jolly</p>");
	});

	it("should render the view widget", function() {
		var wiki = new $tw.Wiki();
		// Add a tiddler
		wiki.addTiddlers([
			{title: "TiddlerOne", text: "Jolly Old World"}
		]);
		// Construct the widget node
		var text = "<$view tiddler='TiddlerOne'/>";
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>Jolly Old World</p>");
		// Test the sequence numbers in the DOM
		expect(wrapper.sequenceNumber).toBe(0);
		expect(wrapper.children[0].sequenceNumber).toBe(1);
		expect(wrapper.children[0].children[0].sequenceNumber).toBe(2);
		// Change the transcluded tiddler
		wiki.addTiddler({title: "TiddlerOne", text: "World-wide Jelly"});
		// Refresh
		refreshWidgetNode(widgetNode,wrapper,["TiddlerOne"]);
		// Test the refreshing
		expect(wrapper.innerHTML).toBe("<p>World-wide Jelly</p>");
		// Test the sequence numbers in the DOM
		expect(wrapper.sequenceNumber).toBe(0);
		expect(wrapper.children[0].sequenceNumber).toBe(1);
		expect(wrapper.children[0].children[0].sequenceNumber).toBe(3);
	});

	it("should deal with the set widget", function() {
		var wiki = new $tw.Wiki();
		// Add some tiddlers
		wiki.addTiddlers([
			{title: "TiddlerOne", text: "Jolly Old World"},
			{title: "TiddlerTwo", text: "<$transclude tiddler={{TiddlerThree}}/>"},
			{title: "TiddlerThree", text: "TiddlerOne"},
			{title: "TiddlerFour", text: "TiddlerTwo"}
		]);
		// Construct the widget node
		var text = "My <$set name='currentTiddler' value={{TiddlerFour}}><$transclude tiddler={{!!title}}/></$set> is Jolly"
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>My Jolly Old World is Jolly</p>");
		// Change the transcluded tiddler
		wiki.addTiddler({title: "TiddlerFour", text: "TiddlerOne"});
		// Refresh
		refreshWidgetNode(widgetNode,wrapper,["TiddlerFour"]);
		// Test the refreshing
		expect(wrapper.innerHTML).toBe("<p>My Jolly Old World is Jolly</p>");
		// Test the sequence numbers in the DOM
		expect(wrapper.sequenceNumber).toBe(0);
		expect(wrapper.children[0].sequenceNumber).toBe(1);
		expect(wrapper.children[0].children[0].sequenceNumber).toBe(2);
		expect(wrapper.children[0].children[1].sequenceNumber).toBe(5);
		expect(wrapper.children[0].children[2].sequenceNumber).toBe(4);
	});

	it("should deal with attributes specified as macro invocations", function() {
		var wiki = new $tw.Wiki();
		// Construct the widget node
		var text = "\\define myMacro(one:\"paramOne\",two,three:\"paramTwo\")\nMy something $one$, $two$ or other $three$\n\\end\n<div class=<<myMacro 'something' three:'thing'>>>Content</div>";
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p><div class=\"My something something,  or other thing\">Content</div></p>");
	});

	it("should deal with built-in macros", function() {
		var wiki = new $tw.Wiki();
		// Add some tiddlers
		wiki.addTiddlers([
			{title: "TiddlerOne", text: "Jolly Old World", type: "text/vnd.tiddlywiki"}
		]);
		// Construct the widget node
		var text = "\\define makelink(text,type)\n<a href=<<makedatauri text:\"$text$\" type:\"$type$\">>>My linky link</a>\n\\end\n\n<$macrocall $name=\"makelink\" text={{TiddlerOne}} type={{TiddlerOne!!type}}/>";
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p><a href=\"data:text/vnd.tiddlywiki,Jolly%20Old%20World\">My linky link</a></p>");
	});

	/* This test reproduces issue #4693. */
	it("should render the entity widget", function() {
		var wiki = new $tw.Wiki();
		// Construct the widget node
		var text = "\n\n<$entity entity='&nbsp;' />\n\n<$entity entity='&#x2713;' />\n";
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe(" ✓");
		// Test the sequence numbers in the DOM
		expect(wrapper.sequenceNumber).toBe(0);
		expect(wrapper.children[0].sequenceNumber).toBe(1);
		expect(wrapper.children[0].nodeType).toBe(wrapper.children[0].TEXT_NODE);
		expect(wrapper.children[1].sequenceNumber).toBe(2);
		expect(wrapper.children[1].nodeType).toBe(wrapper.children[1].TEXT_NODE);
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
		var text = "<$list><$view field='title'/></$list>";
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>TiddlerFourTiddlerOneTiddlerThreeTiddlerTwo</p>");
		// Add another tiddler
		wiki.addTiddler({title: "TiddlerFive", text: "Jalapeno Peppers"});
		// Refresh
		refreshWidgetNode(widgetNode,wrapper,["TiddlerFive"]);
		// Test the refreshing
		expect(wrapper.innerHTML).toBe("<p>TiddlerFiveTiddlerFourTiddlerOneTiddlerThreeTiddlerTwo</p>");
		// Test the sequence numbers in the DOM
		expect(wrapper.sequenceNumber).toBe(0);
		expect(wrapper.children[0].sequenceNumber).toBe(1);
		expect(wrapper.children[0].children[0].sequenceNumber).toBe(6);
		expect(wrapper.children[0].children[1].sequenceNumber).toBe(2);
		expect(wrapper.children[0].children[2].sequenceNumber).toBe(3);
		expect(wrapper.children[0].children[3].sequenceNumber).toBe(4);
		expect(wrapper.children[0].children[4].sequenceNumber).toBe(5);
		// Remove a tiddler
		wiki.deleteTiddler("TiddlerThree");
		// Refresh
		refreshWidgetNode(widgetNode,wrapper,["TiddlerThree"]);
		// Test the refreshing
		expect(wrapper.innerHTML).toBe("<p>TiddlerFiveTiddlerFourTiddlerOneTiddlerTwo</p>");
		// Test the sequence numbers in the DOM
		expect(wrapper.sequenceNumber).toBe(0);
		expect(wrapper.children[0].sequenceNumber).toBe(1);
		expect(wrapper.children[0].children[0].sequenceNumber).toBe(6);
		expect(wrapper.children[0].children[1].sequenceNumber).toBe(2);
		expect(wrapper.children[0].children[2].sequenceNumber).toBe(3);
		expect(wrapper.children[0].children[3].sequenceNumber).toBe(5);
		// Add it back a tiddler
		wiki.addTiddler({title: "TiddlerThree", text: "Something"});
		// Refresh
		refreshWidgetNode(widgetNode,wrapper,["TiddlerThree"]);
		// Test the refreshing
		expect(wrapper.innerHTML).toBe("<p>TiddlerFiveTiddlerFourTiddlerOneTiddlerThreeTiddlerTwo</p>");
		// Test the sequence numbers in the DOM
		expect(wrapper.sequenceNumber).toBe(0);
		expect(wrapper.children[0].sequenceNumber).toBe(1);
		expect(wrapper.children[0].children[0].sequenceNumber).toBe(6);
		expect(wrapper.children[0].children[1].sequenceNumber).toBe(2);
		expect(wrapper.children[0].children[2].sequenceNumber).toBe(3);
		expect(wrapper.children[0].children[3].sequenceNumber).toBe(7);
		expect(wrapper.children[0].children[4].sequenceNumber).toBe(5);
	});


	it("should deal with the list widget using a counter variable", function() {
		var wiki = new $tw.Wiki();
		// Add some tiddlers
		wiki.addTiddlers([
			{title: "TiddlerOne", text: "Jolly Old World"},
			{title: "TiddlerTwo", text: "Worldly Old Jelly"},
			{title: "TiddlerThree", text: "Golly Gosh"},
			{title: "TiddlerFour", text: "Lemon Squash"}
		]);
		// Construct the widget node
		var text = "<$list counter='index'><$view field='text'/><$text text=<<index>>/><$text text=<<index-first>>/><$text text=<<index-last>>/></$list>";
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>Lemon Squash1yesnoJolly Old World2nonoGolly Gosh3nonoWorldly Old Jelly4noyes</p>");
		// Test the sequence numbers in the DOM
		expect(wrapper.sequenceNumber).toBe(0);
		expect(wrapper.children[0].sequenceNumber).toBe(1);
		expect(wrapper.children[0].children[0].sequenceNumber).toBe(2);
		expect(wrapper.children[0].children[1].sequenceNumber).toBe(3);
		expect(wrapper.children[0].children[2].sequenceNumber).toBe(4);
		expect(wrapper.children[0].children[3].sequenceNumber).toBe(5);
		expect(wrapper.children[0].children[4].sequenceNumber).toBe(6);
		expect(wrapper.children[0].children[5].sequenceNumber).toBe(7);
		expect(wrapper.children[0].children[6].sequenceNumber).toBe(8);
		expect(wrapper.children[0].children[7].sequenceNumber).toBe(9);
		expect(wrapper.children[0].children[8].sequenceNumber).toBe(10);
		expect(wrapper.children[0].children[9].sequenceNumber).toBe(11);
		expect(wrapper.children[0].children[10].sequenceNumber).toBe(12);
		expect(wrapper.children[0].children[11].sequenceNumber).toBe(13);
		expect(wrapper.children[0].children[12].sequenceNumber).toBe(14);
		expect(wrapper.children[0].children[13].sequenceNumber).toBe(15);
		expect(wrapper.children[0].children[14].sequenceNumber).toBe(16);
		expect(wrapper.children[0].children[15].sequenceNumber).toBe(17);
		// Add another tiddler
		wiki.addTiddler({title: "TiddlerFive", text: "Jalapeno Peppers"});
		// Refresh
		refreshWidgetNode(widgetNode,wrapper,["TiddlerFive"]);
		// Test the refreshing
		expect(wrapper.innerHTML).toBe("<p>Jalapeno Peppers1yesnoLemon Squash2nonoJolly Old World3nonoGolly Gosh4nonoWorldly Old Jelly5noyes</p>");
		// Test the sequence numbers in the DOM
		expect(wrapper.sequenceNumber).toBe(0);
		expect(wrapper.children[0].sequenceNumber).toBe(1);
		expect(wrapper.children[0].children[0].sequenceNumber).toBe(18);
		expect(wrapper.children[0].children[1].sequenceNumber).toBe(19);
		expect(wrapper.children[0].children[2].sequenceNumber).toBe(20);
		expect(wrapper.children[0].children[3].sequenceNumber).toBe(21);
		expect(wrapper.children[0].children[4].sequenceNumber).toBe(22);
		expect(wrapper.children[0].children[5].sequenceNumber).toBe(23);
		expect(wrapper.children[0].children[6].sequenceNumber).toBe(24);
		expect(wrapper.children[0].children[7].sequenceNumber).toBe(25);
		expect(wrapper.children[0].children[8].sequenceNumber).toBe(26);
		expect(wrapper.children[0].children[9].sequenceNumber).toBe(27);
		expect(wrapper.children[0].children[10].sequenceNumber).toBe(28);
		expect(wrapper.children[0].children[11].sequenceNumber).toBe(29);
		expect(wrapper.children[0].children[12].sequenceNumber).toBe(30);
		expect(wrapper.children[0].children[13].sequenceNumber).toBe(31);
		expect(wrapper.children[0].children[14].sequenceNumber).toBe(32);
		expect(wrapper.children[0].children[15].sequenceNumber).toBe(33);
		expect(wrapper.children[0].children[16].sequenceNumber).toBe(34);
		expect(wrapper.children[0].children[17].sequenceNumber).toBe(35);
		expect(wrapper.children[0].children[18].sequenceNumber).toBe(36);
		expect(wrapper.children[0].children[19].sequenceNumber).toBe(37);
		// Remove a tiddler
		wiki.deleteTiddler("TiddlerThree");
		// Refresh
		refreshWidgetNode(widgetNode,wrapper,["TiddlerThree"]);
		// Test the refreshing
		expect(wrapper.innerHTML).toBe("<p>Jalapeno Peppers1yesnoLemon Squash2nonoJolly Old World3nonoWorldly Old Jelly4noyes</p>");
		// Test the sequence numbers in the DOM
		expect(wrapper.sequenceNumber).toBe(0);
		expect(wrapper.children[0].sequenceNumber).toBe(1);
		expect(wrapper.children[0].children[0].sequenceNumber).toBe(18);
		expect(wrapper.children[0].children[1].sequenceNumber).toBe(19);
		expect(wrapper.children[0].children[2].sequenceNumber).toBe(20);
		expect(wrapper.children[0].children[3].sequenceNumber).toBe(21);
		expect(wrapper.children[0].children[4].sequenceNumber).toBe(22);
		expect(wrapper.children[0].children[5].sequenceNumber).toBe(23);
		expect(wrapper.children[0].children[6].sequenceNumber).toBe(24);
		expect(wrapper.children[0].children[7].sequenceNumber).toBe(25);
		expect(wrapper.children[0].children[8].sequenceNumber).toBe(26);
		expect(wrapper.children[0].children[9].sequenceNumber).toBe(27);
		expect(wrapper.children[0].children[10].sequenceNumber).toBe(28);
		expect(wrapper.children[0].children[11].sequenceNumber).toBe(29);
		expect(wrapper.children[0].children[12].sequenceNumber).toBe(38);
		expect(wrapper.children[0].children[13].sequenceNumber).toBe(39);
		expect(wrapper.children[0].children[14].sequenceNumber).toBe(40);
		expect(wrapper.children[0].children[15].sequenceNumber).toBe(41);
		// Add it back a tiddler
		wiki.addTiddler({title: "TiddlerThree", text: "Something"});
		// Refresh
		refreshWidgetNode(widgetNode,wrapper,["TiddlerThree"]);
		// Test the refreshing
		expect(wrapper.innerHTML).toBe("<p>Jalapeno Peppers1yesnoLemon Squash2nonoJolly Old World3nonoSomething4nonoWorldly Old Jelly5noyes</p>");
		// Test the sequence numbers in the DOM
		expect(wrapper.sequenceNumber).toBe(0);
		expect(wrapper.children[0].sequenceNumber).toBe(1);
		expect(wrapper.children[0].children[0].sequenceNumber).toBe(18);
		expect(wrapper.children[0].children[1].sequenceNumber).toBe(19);
		expect(wrapper.children[0].children[2].sequenceNumber).toBe(20);
		expect(wrapper.children[0].children[3].sequenceNumber).toBe(21);
		expect(wrapper.children[0].children[4].sequenceNumber).toBe(22);
		expect(wrapper.children[0].children[5].sequenceNumber).toBe(23);
		expect(wrapper.children[0].children[6].sequenceNumber).toBe(24);
		expect(wrapper.children[0].children[7].sequenceNumber).toBe(25);
		expect(wrapper.children[0].children[8].sequenceNumber).toBe(26);
		expect(wrapper.children[0].children[9].sequenceNumber).toBe(27);
		expect(wrapper.children[0].children[10].sequenceNumber).toBe(28);
		expect(wrapper.children[0].children[11].sequenceNumber).toBe(29);
		expect(wrapper.children[0].children[12].sequenceNumber).toBe(42);
		expect(wrapper.children[0].children[13].sequenceNumber).toBe(43);
		expect(wrapper.children[0].children[14].sequenceNumber).toBe(44);
		expect(wrapper.children[0].children[15].sequenceNumber).toBe(45);
	});

	it("should deal with the list widget followed by other widgets", function() {
		var wiki = new $tw.Wiki();
		// Add some tiddlers
		wiki.addTiddlers([
			{title: "TiddlerOne", text: "Jolly Old World"},
			{title: "TiddlerTwo", text: "Worldly Old Jelly"},
			{title: "TiddlerThree", text: "Golly Gosh"},
			{title: "TiddlerFour", text: "Lemon Squash"}
		]);
		// Construct the widget node
		var text = "<$list><$view field='title'/></$list>Something";
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>TiddlerFourTiddlerOneTiddlerThreeTiddlerTwoSomething</p>");
		// Check the next siblings of each of the list elements
		var listWidget = widgetNode.children[0].children[0];
		// Add another tiddler
		wiki.addTiddler({title: "TiddlerFive", text: "Jalapeno Peppers"});
		// Refresh
		refreshWidgetNode(widgetNode,wrapper,["TiddlerFive"]);
		// Test the refreshing
		expect(wrapper.innerHTML).toBe("<p>TiddlerFiveTiddlerFourTiddlerOneTiddlerThreeTiddlerTwoSomething</p>");
		// Test the sequence numbers in the DOM
		expect(wrapper.sequenceNumber).toBe(0);
		expect(wrapper.children[0].sequenceNumber).toBe(1);
		expect(wrapper.children[0].children[0].sequenceNumber).toBe(7);
		expect(wrapper.children[0].children[1].sequenceNumber).toBe(2);
		expect(wrapper.children[0].children[2].sequenceNumber).toBe(3);
		expect(wrapper.children[0].children[3].sequenceNumber).toBe(4);
		expect(wrapper.children[0].children[4].sequenceNumber).toBe(5);
		// Remove a tiddler
		wiki.deleteTiddler("TiddlerThree");
		// Refresh
		refreshWidgetNode(widgetNode,wrapper,["TiddlerThree"]);
		// Test the refreshing
		expect(wrapper.innerHTML).toBe("<p>TiddlerFiveTiddlerFourTiddlerOneTiddlerTwoSomething</p>");
		// Test the sequence numbers in the DOM
		expect(wrapper.sequenceNumber).toBe(0);
		expect(wrapper.children[0].sequenceNumber).toBe(1);
		expect(wrapper.children[0].children[0].sequenceNumber).toBe(7);
		expect(wrapper.children[0].children[1].sequenceNumber).toBe(2);
		expect(wrapper.children[0].children[2].sequenceNumber).toBe(3);
		expect(wrapper.children[0].children[3].sequenceNumber).toBe(5);
		// Add it back a tiddler
		wiki.addTiddler({title: "TiddlerThree", text: "Something"});
		// Refresh
		refreshWidgetNode(widgetNode,wrapper,["TiddlerThree"]);
		// Test the refreshing
		expect(wrapper.innerHTML).toBe("<p>TiddlerFiveTiddlerFourTiddlerOneTiddlerThreeTiddlerTwoSomething</p>");
		// Test the sequence numbers in the DOM
		expect(wrapper.sequenceNumber).toBe(0);
		expect(wrapper.children[0].sequenceNumber).toBe(1);
		expect(wrapper.children[0].children[0].sequenceNumber).toBe(7);
		expect(wrapper.children[0].children[1].sequenceNumber).toBe(2);
		expect(wrapper.children[0].children[2].sequenceNumber).toBe(3);
		expect(wrapper.children[0].children[3].sequenceNumber).toBe(8);
		expect(wrapper.children[0].children[4].sequenceNumber).toBe(5);
		// Add another a tiddler to the end of the list
		wiki.addTiddler({title: "YetAnotherTiddler", text: "Something"});
		// Refresh
		refreshWidgetNode(widgetNode,wrapper,["YetAnotherTiddler"]);
		// Test the refreshing
		expect(wrapper.innerHTML).toBe("<p>TiddlerFiveTiddlerFourTiddlerOneTiddlerThreeTiddlerTwoYetAnotherTiddlerSomething</p>");
		// Test the sequence numbers in the DOM
		expect(wrapper.sequenceNumber).toBe(0);
		expect(wrapper.children[0].sequenceNumber).toBe(1);
		expect(wrapper.children[0].children[0].sequenceNumber).toBe(7);
		expect(wrapper.children[0].children[1].sequenceNumber).toBe(2);
		expect(wrapper.children[0].children[2].sequenceNumber).toBe(3);
		expect(wrapper.children[0].children[3].sequenceNumber).toBe(8);
		expect(wrapper.children[0].children[4].sequenceNumber).toBe(5);
	});

	it("should deal with the list widget and external templates", function() {
		var wiki = new $tw.Wiki();
		// Add some tiddlers
		wiki.addTiddlers([
			{title: "$:/myTemplate", text: "(<$view field='title'/>)"},
			{title: "TiddlerOne", text: "Jolly Old World"},
			{title: "TiddlerTwo", text: "Worldly Old Jelly"},
			{title: "TiddlerThree", text: "Golly Gosh"},
			{title: "TiddlerFour", text: "Lemon Squash"}
		]);
		// Construct the widget node
		var text = "<$list template='$:/myTemplate'></$list>";
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
//console.log(require("util").inspect(widgetNode,{depth:8,colors:true}));
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>(TiddlerFour)(TiddlerOne)(TiddlerThree)(TiddlerTwo)</p>");
	});

	it("should deal with the list widget and empty lists", function() {
		var wiki = new $tw.Wiki();
		// Construct the widget node
		var text = "<$list emptyMessage='nothing'><$view field='title'/></$list>";
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>nothing</p>");
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
		var text = "<$list emptyMessage='nothing'><$view field='title'/></$list>";
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>TiddlerFourTiddlerOneTiddlerThreeTiddlerTwo</p>");
		// Get rid of the tiddlers
		wiki.deleteTiddler("TiddlerOne");
		wiki.deleteTiddler("TiddlerTwo");
		wiki.deleteTiddler("TiddlerThree");
		wiki.deleteTiddler("TiddlerFour");
		// Refresh
		refreshWidgetNode(widgetNode,wrapper,["TiddlerOne","TiddlerTwo","TiddlerThree","TiddlerFour"]);
		// Test the refreshing
		expect(wrapper.innerHTML).toBe("<p>nothing</p>");
	});

	/**This test confirms that imported set variables properly refresh
	 * if they use transclusion for their value. This relates to PR #4108.
	 */
	it("should refresh imported <$set> widgets", function() {
		var wiki = new $tw.Wiki();
		// Add some tiddlers
		wiki.addTiddlers([
			{title: "Raw", text: "Initial value"},
			{title: "Macro", text: "<$set name='test' value={{Raw}}>\n\ndummy text</$set>"},
			{title: "Caller", text: text}
		]);
		var text = "\\import Macro\n<<test>>";
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>Initial value</p>");
		wiki.addTiddler({title: "Raw", text: "New value"});
		// Refresh
		refreshWidgetNode(widgetNode,wrapper,["Raw"]);
		expect(wrapper.innerHTML).toBe("<p>New value</p>");
	});

	it("should can mix setWidgets and macros when importing", function() {
		var wiki = new $tw.Wiki();
		// Add some tiddlers
		wiki.addTiddlers([
			{title: "A", text: "\\define A() Aval"},
			{title: "B", text: "<$set name='B' value='Bval'>\n\ndummy text</$set>"},
			{title: "C", text: "\\define C() Cval"}
		]);
		var text = "\\import A B C\n<<A>> <<B>> <<C>>";
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>Aval Bval Cval</p>");
	});

	it("can have more than one macroDef variable imported", function() {
		var wiki = new $tw.Wiki();
		wiki.addTiddlers([
			{title: "ABC", text: "<$set name=A value=A>\n\n<$set name=B value=B>\n\n<$set name=C value=C>\n\ndummy text</$set></$set></$set>"},
			{title: "D", text: "\\define D() D"}]);
		// A and B shouldn't chew up C just cause it's a macroDef
		var text = "\\import ABC D\n<<A>> <<B>> <<C>> <<D>>";
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>A B C D</p>");
	});

	it("import doesn't hold onto dead variables", function() {
		var wiki = new  $tw.Wiki();
		wiki.addTiddlers([
			{title: "ABC", text: "\\define A() A\n\\define B() B\n<$set name=C value=C>\n\n</$set>"},
			{title: "DE", text: "\\define D() D\n\\define E() E"}]);
		var text = "\\import ABC DE\ncontent";
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		renderWidgetNode(widgetNode);
		var childNode = widgetNode;
		while (childNode.children.length > 0) {
			childNode = childNode.children[0];
		}
		// First make sure A and B imported
		expect(childNode.getVariable("A")).toBe("A");
		expect(childNode.getVariable("B")).toBe("B");
		expect(childNode.getVariable("C")).toBe("C");
		expect(childNode.getVariable("D")).toBe("D");
		expect(childNode.getVariable("E")).toBe("E");
		// Then change A and remove B
		wiki.addTiddler({title: "ABC", text: "\\define A() A2\n<$set name=C value=C2>\n\n</$set>"});
		wiki.addTiddler({title: "DE", text: "\\define D() D2"});
		widgetNode.refresh({"ABC": {modified: true}, "DE": {modified: true}});
		var childNode = widgetNode;
		while (childNode.children.length > 0) {
			childNode = childNode.children[0];
		}
		// Make sure \import recognized changes and deletions
		expect(childNode.getVariable("A")).toBe("A2");
		expect(childNode.getVariable("B")).toBe(undefined);
		expect(childNode.getVariable("C")).toBe("C2");
		expect(childNode.getVariable("D")).toBe("D2");
		expect(childNode.getVariable("E")).toBe(undefined);
	});

	/** Special case. <$importvariables> has different handling if
	 *  it doesn't end up importing any variables. Make sure it
	 *  doesn't forget its childrenNodes.
	 */
	it("should work when import widget imports nothing", function() {
		var wiki = new $tw.Wiki();
		var text = "\\import [prefix[XXX]]\nDon't forget me.";
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p>Don't forget me.</p>");
	});

	/** Special case. \import should parse correctly, even if it's
	 *  the only line in the tiddler. Technically doesn't cause a
	 *  visual difference, but may affect plugins if it doesn't.
	 */
	it("should work when import pragma is standalone", function() {
		var wiki = new $tw.Wiki();
		var text = "\\import [prefix[XXX]]";
		var parseTreeNode = parseText(text,wiki);
		// Test the resulting parse tree node, since there is no
		// rendering which may expose a problem.
		expect(parseTreeNode.children[0].attributes.filter.value).toBe('[prefix[XXX]]');
	});

	/** This test reproduces issue #4504.
	 *
	 * The importvariable widget was creating redundant copies into
	 * itself of variables in widgets higher up in the tree. Normally,
	 * this caused no errors, but it would mess up qualify-macros.
	 * They would find multiple instances of the same transclusion
	 * variable if a transclusion occured higher up in the widget tree
	 * than an importvariables AND that importvariables was importing
	 * at least ONE variable.
	 */
	it("adding imported variables doesn't change qualifyers", function() {
		var wiki = new $tw.Wiki();
		function wikiparse(text) {
			var tree = parseText(text,wiki);
			var widgetNode = createWidgetNode(tree,wiki);
			var wrapper = renderWidgetNode(widgetNode);
			return wrapper.innerHTML;
		};
		wiki.addTiddlers([
			{title: "body", text: "\\import A\n<<qualify this>>"},
			{title: "A", text: "\\define unused() ignored"}
		]);
		// This transclude wraps "body", which has an
		// importvariable widget in it.
		var withA = wikiparse("{{body}}");
		wiki.addTiddler({title: "A", text: ""});
		var withoutA = wikiparse("{{body}}");
		// Importing two different version of "A" shouldn't cause
		// the <<qualify>> widget to spit out something different.
		expect(withA).toBe(withoutA);
	});
});

})();
