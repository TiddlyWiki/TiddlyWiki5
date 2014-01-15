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
		describe("should render", function() {
			// Test the rendering
			expect(wrapper.innerHTML).toBe("A text node<div class='myClass' title='myTitle'> and the content of a DIV<div> and an inner DIV</div> and back in the outer DIV</div>");
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
		describe("should render", function() {
			// Test the rendering
			expect(wrapper.innerHTML).toBe("A text node<div class='myClass' title='the quick brown fox'> and the content of a DIV<div> and an inner DIV</div> and back in the outer DIVthe quick brown fox</div>the quick brown fox");
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
		refreshWidgetNode(widgetNode,wrapper,["TiddlerOne"]);
		describe("should refresh", function() {
			// Test the refreshing
			expect(wrapper.innerHTML).toBe("A text node<div class='myClass' title='jumps over the lazy dog'> and the content of a DIV<div> and an inner DIV</div> and back in the outer DIVjumps over the lazy dog</div>jumps over the lazy dog");
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
		describe("should detect the recursion", function() {
			// Test the rendering
			expect(wrapper.innerHTML).toBe("Tiddler recursion error in transclude widget\n");
		});

	});

	it("should deal with SVG elements", function() {
		var wiki = new $tw.Wiki();
		// Construct the widget node
		var text = "<svg class='tw-image-new-button' viewBox='83 81 50 50' width='22pt' height='22pt'><path d='M 101.25 112.5 L 101.25 127.5 C 101.25 127.5 101.25 127.5 101.25 127.5 L 101.25 127.5 C 101.25 129.156855 102.593146 130.5 104.25 130.5 L 111.75 130.5 C 113.406854 130.5 114.75 129.156854 114.75 127.5 L 114.75 112.5 L 129.75 112.5 C 131.406854 112.5 132.75 111.156854 132.75 109.5 L 132.75 102 C 132.75 100.343146 131.406854 99 129.75 99 L 114.75 99 L 114.75 84 C 114.75 82.343146 113.406854 81 111.75 81 L 104.25 81 C 104.25 81 104.25 81 104.25 81 C 102.593146 81 101.25 82.343146 101.25 84 L 101.25 99 L 86.25 99 C 86.25 99 86.25 99 86.25 99 C 84.593146 99 83.25 100.343146 83.25 102 L 83.25 109.5 C 83.25 109.5 83.25 109.5 83.25 109.5 L 83.25 109.5 C 83.25 111.156855 84.593146 112.5 86.25 112.5 Z'/></svg>\n";
		var widgetNode = createWidgetNode(parseText(text,wiki,{parseAsInline:true}),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<svg class='tw-image-new-button' height='22pt' viewBox='83 81 50 50' width='22pt'><path d='M 101.25 112.5 L 101.25 127.5 C 101.25 127.5 101.25 127.5 101.25 127.5 L 101.25 127.5 C 101.25 129.156855 102.593146 130.5 104.25 130.5 L 111.75 130.5 C 113.406854 130.5 114.75 129.156854 114.75 127.5 L 114.75 112.5 L 129.75 112.5 C 131.406854 112.5 132.75 111.156854 132.75 109.5 L 132.75 102 C 132.75 100.343146 131.406854 99 129.75 99 L 114.75 99 L 114.75 84 C 114.75 82.343146 113.406854 81 111.75 81 L 104.25 81 C 104.25 81 104.25 81 104.25 81 C 102.593146 81 101.25 82.343146 101.25 84 L 101.25 99 L 86.25 99 C 86.25 99 86.25 99 86.25 99 C 84.593146 99 83.25 100.343146 83.25 102 L 83.25 109.5 C 83.25 109.5 83.25 109.5 83.25 109.5 L 83.25 109.5 C 83.25 111.156855 84.593146 112.5 86.25 112.5 Z'></path></svg>\n");
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
		describe("should refresh", function() {
			// Test the refreshing
			expect(wrapper.innerHTML).toBe("<p>World-wide Jelly</p>");
			// Test the sequence numbers in the DOM
			expect(wrapper.sequenceNumber).toBe(0);
			expect(wrapper.children[0].sequenceNumber).toBe(1);
			expect(wrapper.children[0].children[0].sequenceNumber).toBe(3);
		});
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
		describe("should refresh", function() {
			// Test the refreshing
			expect(wrapper.innerHTML).toBe("<p>My Jolly Old World is Jolly</p>");
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
		var text = "\\define myMacro(one:\"paramOne\",two,three:\"paramTwo\")\nMy something $one$, $two$ or other $three$\n\\end\n<div class=<<myMacro 'something' three:'thing'>>>Content</div>";
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		var wrapper = renderWidgetNode(widgetNode);
		// Test the rendering
		expect(wrapper.innerHTML).toBe("<p><div class='My something something,  or other thing'>Content</div></p>");
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
		expect(wrapper.innerHTML).toBe("<p><a href='data:text/vnd.tiddlywiki,Jolly%20Old%20World'>My linky link</a></p>");
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
		describe("should refresh", function() {
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
		});
		// Remove a tiddler
		wiki.deleteTiddler("TiddlerThree");
		// Refresh
		refreshWidgetNode(widgetNode,wrapper,["TiddlerThree"]);
		describe("should refresh", function() {
			// Test the refreshing
			expect(wrapper.innerHTML).toBe("<p>TiddlerFiveTiddlerFourTiddlerOneTiddlerTwo</p>");
			// Test the sequence numbers in the DOM
			expect(wrapper.sequenceNumber).toBe(0);
			expect(wrapper.children[0].sequenceNumber).toBe(1);
			expect(wrapper.children[0].children[0].sequenceNumber).toBe(6);
			expect(wrapper.children[0].children[1].sequenceNumber).toBe(2);
			expect(wrapper.children[0].children[2].sequenceNumber).toBe(3);
			expect(wrapper.children[0].children[3].sequenceNumber).toBe(5);
		});
		// Add it back a tiddler
		wiki.addTiddler({title: "TiddlerThree", text: "Something"});
		// Refresh
		refreshWidgetNode(widgetNode,wrapper,["TiddlerThree"]);
		describe("should refresh", function() {
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
		describe("should refresh", function() {
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
		});
		// Remove a tiddler
		wiki.deleteTiddler("TiddlerThree");
		// Refresh
		refreshWidgetNode(widgetNode,wrapper,["TiddlerThree"]);
		describe("should refresh", function() {
			// Test the refreshing
			expect(wrapper.innerHTML).toBe("<p>TiddlerFiveTiddlerFourTiddlerOneTiddlerTwoSomething</p>");
			// Test the sequence numbers in the DOM
			expect(wrapper.sequenceNumber).toBe(0);
			expect(wrapper.children[0].sequenceNumber).toBe(1);
			expect(wrapper.children[0].children[0].sequenceNumber).toBe(7);
			expect(wrapper.children[0].children[1].sequenceNumber).toBe(2);
			expect(wrapper.children[0].children[2].sequenceNumber).toBe(3);
			expect(wrapper.children[0].children[3].sequenceNumber).toBe(5);
		});
		// Add it back a tiddler
		wiki.addTiddler({title: "TiddlerThree", text: "Something"});
		// Refresh
		refreshWidgetNode(widgetNode,wrapper,["TiddlerThree"]);
		describe("should refresh", function() {
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
		});
		// Add another a tiddler to the end of the list
		wiki.addTiddler({title: "YetAnotherTiddler", text: "Something"});
		// Refresh
		refreshWidgetNode(widgetNode,wrapper,["YetAnotherTiddler"]);
		describe("should refresh", function() {
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
		describe("should refresh", function() {
			// Test the refreshing
			expect(wrapper.innerHTML).toBe("<p>nothing</p>");
		});
	});

});

})();
