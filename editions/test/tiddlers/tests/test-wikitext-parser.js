/*\
title: test-wikitext-parser.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for wikitext parser

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("WikiText parser tests", function() {

	// Create a wiki
	var wiki = new $tw.Wiki();

	// Define a parsing shortcut
	var parse = function(text) {
		var tree = wiki.parseText("text/vnd.tiddlywiki",text).tree;
		return tree;
	};

	it("should parse tags", function() {
		expect(parse("<br>")).toEqual(

			[ { type : 'element', tag : 'p', start : 0, end : 4, children : [ { type : 'element', tag : 'br', start : 0, end : 4, isBlock : false, attributes : {  }, orderedAttributes: [ ] } ] } ]

		);
		expect(parse("</br>")).toEqual(

			[ { type : 'element', tag : 'p', start : 0, end : 5, children : [ { type : 'text', text : '</br>', start : 0, end : 5 } ] } ]

		);
		expect(parse("<div>")).toEqual(

			[ { type : 'element', tag : 'p', start : 0, end : 5, children : [ { type : 'element', tag : 'div', start : 0, end : 5, isBlock : false, attributes : {  }, orderedAttributes: [ ], children : [  ] } ] } ]

		);
		expect(parse("<div/>")).toEqual(

			[ { type : 'element', tag : 'p', start : 0, end : 6, children : [ { type : 'element', tag : 'div', isSelfClosing : true, isBlock : false, attributes : {  }, orderedAttributes: [ ], start : 0, end : 6 } ] } ]

		);
		expect(parse("<div></div>")).toEqual(

			[ { type : 'element', tag : 'p', start : 0, end : 11, children : [ { type : 'element', tag : 'div', isBlock : false, attributes : {  }, orderedAttributes: [ ], children : [ ], start : 0, end : 5 } ] } ]

		);
		expect(parse("<div>some text</div>")).toEqual(

			[ { type : 'element', tag : 'p', start : 0, end : 20, children : [ { type : 'element', tag : 'div', start : 0, end : 20, isBlock : false, attributes : {  }, orderedAttributes: [ ], children : [ { type : 'text', text : 'some text', start : 5, end : 14 } ], start : 0, end : 5 } ] } ]

		);
		expect(parse("<div attribute>some text</div>")).toEqual(

			[ { type : 'element', tag : 'p', start : 0, end : 30, children : [ { type : 'element', tag : 'div', isBlock : false, attributes : { attribute : { type : 'string', value : 'true', start : 4, end : 14, name: 'attribute' } }, orderedAttributes: [ { type : 'string', value : 'true', start : 4, end : 14, name: 'attribute' } ], children : [ { type : 'text', text : 'some text', start : 15, end : 24 } ], start : 0, end : 15 } ] } ]

		);
		expect(parse("<div attribute='value'>some text</div>")).toEqual(

			[ { type : 'element', tag : 'p', start : 0, end : 38, children : [ { type : 'element', tag : 'div', start: 0, end: 38, isBlock : false, attributes : { attribute : { type : 'string', name: 'attribute', value : 'value', start: 4, end: 22 } }, orderedAttributes: [ { type: 'string', name: 'attribute', value : 'value', start: 4, end: 22 } ], children : [ { type : 'text', text : 'some text', start : 23, end : 32 } ], start : 0, end : 23 } ] } ]

		);
		expect(parse("<div attribute={{TiddlerTitle}}>some text</div>")).toEqual(

			[ { type : 'element', tag : 'p', start: 0, end: 47, children : [ { type : 'element', tag : 'div', isBlock : false, attributes : { attribute : { type : 'indirect', name: 'attribute', textReference : 'TiddlerTitle', start : 4, end : 31 } }, orderedAttributes: [ { type : 'indirect', name: 'attribute', textReference : 'TiddlerTitle', start : 4, end : 31 } ], children : [ { type : 'text', text : 'some text', start : 32, end : 41 } ], start : 0, end : 32 } ] } ]

		);
		expect(parse("<$reveal state='$:/temp/search' type='nomatch' text=''>")).toEqual(

			[ { type : 'element', tag : 'p', start: 0, end: 55, children : [ { type : 'reveal', tag: '$reveal', start : 0, attributes : { state : { start : 8, name : 'state', type : 'string', value : '$:/temp/search', end : 31 }, type : { start : 31, name : 'type', type : 'string', value : 'nomatch', end : 46 }, text : { start : 46, name : 'text', type : 'string', value : '', end : 54 } }, orderedAttributes: [ { start : 8, name : 'state', type : 'string', value : '$:/temp/search', end : 31 }, { start : 31, name : 'type', type : 'string', value : 'nomatch', end : 46 }, { start : 46, name : 'text', type : 'string', value : '', end : 54 } ], end : 55, isBlock : false, children : [  ] } ] } ]

		);
		expect(parse("<div attribute={{TiddlerTitle!!field}}>some text</div>")).toEqual(

			[ { type : 'element', tag : 'p', start: 0, end: 54, children : [ { type : 'element', tag : 'div', isBlock : false, attributes : { attribute : { type : 'indirect', name : 'attribute', textReference : 'TiddlerTitle!!field', start : 4, end : 38 } }, orderedAttributes: [ { type : 'indirect', name : 'attribute', textReference : 'TiddlerTitle!!field', start : 4, end : 38 } ], children : [ { type : 'text', text : 'some text', start : 39, end : 48 } ], start : 0, end : 39 } ] } ]

		);
		expect(parse("<div attribute={{Tiddler Title!!field}}>some text</div>")).toEqual(

			[ { type : 'element', tag : 'p', start: 0, end: 55, children : [ { type : 'element', tag : 'div', isBlock : false, attributes : { attribute : { type : 'indirect', name : 'attribute', textReference : 'Tiddler Title!!field', start : 4, end : 39 } }, orderedAttributes: [ { type : 'indirect', name : 'attribute', textReference : 'Tiddler Title!!field', start : 4, end : 39 } ], children : [ { type : 'text', text : 'some text', start : 40, end : 49 } ], start : 0, end : 40 } ] } ]

		);
		expect(parse("<div attribute={{TiddlerTitle!!field}}>\n\nsome text</div>")).toEqual(

			[ { type : 'element', start : 0, attributes : { attribute : { start : 4, name : 'attribute', type : 'indirect', textReference : 'TiddlerTitle!!field', end : 38 } }, orderedAttributes: [ { start : 4, name : 'attribute', type : 'indirect', textReference : 'TiddlerTitle!!field', end : 38 } ], tag : 'div', end : 39, isBlock : true, children : [ { type : 'element', tag : 'p', start : 41, end : 50, children : [ { type : 'text', text : 'some text', start : 41, end : 50 } ] } ] } ]

		);
		expect(parse("<div><div attribute={{TiddlerTitle!!field}}>\n\nsome text</div></div>")).toEqual(

			[ { type : 'element', tag : 'p', start: 0, end: 67, children : [ { type : 'element', start : 0, attributes : {  }, orderedAttributes: [ ], tag : 'div', end : 5, isBlock : false, children : [ { type : 'element', start : 5, attributes : { attribute : { start : 9, name : 'attribute', type : 'indirect', textReference : 'TiddlerTitle!!field', end : 43 } }, orderedAttributes: [ { start : 9, name : 'attribute', type : 'indirect', textReference : 'TiddlerTitle!!field', end : 43 } ], tag : 'div', end : 44, isBlock : true, children : [ { type : 'element', tag : 'p', start : 46, end : 55, children : [ { type : 'text', text : 'some text', start : 46, end : 55 } ] } ] } ] } ] } ]

		);
		expect(parse("<div><div attribute={{TiddlerTitle!!field}}>\n\n!some heading</div></div>")).toEqual(

			[ { type : 'element', tag : 'p', start: 0, end: 71, children : [ { type : 'element', start : 0, attributes : {  }, orderedAttributes: [ ], tag : 'div', end : 5, isBlock : false, children : [ { type : 'element', start : 5, attributes : { attribute : { start : 9, name : 'attribute', type : 'indirect', textReference : 'TiddlerTitle!!field', end : 43 } }, orderedAttributes: [ { start : 9, name : 'attribute', type : 'indirect', textReference : 'TiddlerTitle!!field', end : 43 } ], tag : 'div', end : 44, isBlock : true, children : [ { type : 'element', tag : 'h1', attributes : { class : { type : 'string', value : '' } }, children : [ { type : 'text', text : 'some heading</div></div>', start : 47, end : 71 } ] } ] } ] } ] } ]

		);
		expect(parse("<div><div attribute={{TiddlerTitle!!field}}>\n!some heading</div></div>")).toEqual(

			[ { type : 'element', tag : 'p', start: 0, end: 70, children : [ { type : 'element', start : 0, attributes : {  }, orderedAttributes: [ ], tag : 'div', end : 5, isBlock : false, children : [ { type : 'element', start : 5, attributes : { attribute : { start : 9, name : 'attribute', type : 'indirect', textReference : 'TiddlerTitle!!field', end : 43 } }, orderedAttributes: [ { start : 9, name : 'attribute', type : 'indirect', textReference : 'TiddlerTitle!!field', end : 43 } ], tag : 'div', end : 44, isBlock : false, children : [ { type : 'text', text : '\n!some heading', start : 44, end : 58 } ] } ] } ] } ]

		);
		// Regression test for issue (#3306)
		expect(parse("<div><span><span>\n\nSome text</span></span></div>")).toEqual(

			[ { type : 'element', tag : 'p', start: 0, end: 48, children : [ { type : 'element', start : 0, attributes : {  }, orderedAttributes: [ ], tag : 'div', end : 5, isBlock : false, children : [ { type : 'element', start : 5, attributes : {  }, orderedAttributes: [ ], tag : 'span', end : 11, isBlock : false, children : [ { type : 'element', start : 11, attributes : {  }, orderedAttributes: [ ], tag : 'span', end : 17, isBlock : true, children : [ { type : 'element', tag : 'p', start : 19, end : 28, children : [ { type : 'text', text : 'Some text', start : 19, end : 28 } ] } ] } ] } ] } ] } ]

		);
	});

	it("should parse macro definitions", function() {
		expect(parse("\\define myMacro()\nnothing\n\\end\n")).toEqual(

			[{"type":"set","attributes":{"name":{"name":"name","type":"string","value":"myMacro"},"value":{"name":"value","type":"string","value":"nothing"}},"children":[],"params":[],"isMacroDefinition":true,"orderedAttributes":[{"name":"name","type":"string","value":"myMacro"},{"name":"value","type":"string","value":"nothing"}]}]

		);
	});

	it("should parse procedure definitions with no parameters", function() {
		expect(parse("\\procedure myMacro()\nnothing\n\\end\n")).toEqual(

			[{"type":"set","attributes":{"name":{"name":"name","type":"string","value":"myMacro"},"value":{"name":"value","type":"string","value":"nothing"}},"children":[],"params":[],"orderedAttributes":[{"name":"name","type":"string","value":"myMacro"},{"name":"value","type":"string","value":"nothing"}],"isProcedureDefinition":true}]

		);
	});

	it("should parse single line procedure definitions with no parameters", function() {
		expect(parse("\\procedure myMacro() nothing\n")).toEqual(

			[{"type":"set","attributes":{"name":{"name":"name","type":"string","value":"myMacro"},"value":{"name":"value","type":"string","value":"nothing"}},"children":[],"params":[],"orderedAttributes":[{"name":"name","type":"string","value":"myMacro"},{"name":"value","type":"string","value":"nothing"}],"isProcedureDefinition":true}]

		);
	});

	it("should parse procedure definitions with parameters", function() {
		expect(parse("\\procedure myMacro(one,two,three,four:elephant)\nnothing\n\\end\n")).toEqual(

			[{"type":"set","attributes":{"name":{"name":"name","type":"string","value":"myMacro"},"value":{"name":"value","type":"string","value":"nothing"}},"children":[],"params":[{"name":"one"},{"name":"two"},{"name":"three"},{"name":"four","default":"elephant"}],"orderedAttributes":[{"name":"name","type":"string","value":"myMacro"},{"name":"value","type":"string","value":"nothing"}],"isProcedureDefinition":true}]

		);
	});

	it("should parse procedure definitions", function() {
		expect(parse("\\procedure myMacro(one:'Jaguar')\n<$text text=<<one>>/>\n\\end\n\n")).toEqual(

			[{"type":"set","attributes":{"name":{"name":"name","type":"string","value":"myMacro"},"value":{"name":"value","type":"string","value":"<$text text=<<one>>/>"}},"children":[],"params":[{"name":"one","default":"Jaguar"}],"orderedAttributes":[{"name":"name","type":"string","value":"myMacro"},{"name":"value","type":"string","value":"<$text text=<<one>>/>"}],"isProcedureDefinition":true}]

		);

	});	it("should parse function definitions with no parameters", function() {
		expect(parse("\\function myMacro()\nnothing\n\\end\n")).toEqual(

			[{"type":"set","attributes":{"name":{"name":"name","type":"string","value":"myMacro"},"value":{"name":"value","type":"string","value":"nothing"}},"children":[],"params":[],"orderedAttributes":[{"name":"name","type":"string","value":"myMacro"},{"name":"value","type":"string","value":"nothing"}],"isFunctionDefinition":true}]

		);
	});

	it("should parse single line function definitions with no parameters", function() {
		expect(parse("\\function myMacro() nothing\n")).toEqual(

			[{"type":"set","attributes":{"name":{"name":"name","type":"string","value":"myMacro"},"value":{"name":"value","type":"string","value":"nothing"}},"children":[],"params":[],"orderedAttributes":[{"name":"name","type":"string","value":"myMacro"},{"name":"value","type":"string","value":"nothing"}],"isFunctionDefinition":true}]

		);
	});

	it("should parse function definitions with parameters", function() {
		expect(parse("\\function myMacro(one,two,three,four:elephant)\nnothing\n\\end\n")).toEqual(

			[{"type":"set","attributes":{"name":{"name":"name","type":"string","value":"myMacro"},"value":{"name":"value","type":"string","value":"nothing"}},"children":[],"params":[{"name":"one"},{"name":"two"},{"name":"three"},{"name":"four","default":"elephant"}],"orderedAttributes":[{"name":"name","type":"string","value":"myMacro"},{"name":"value","type":"string","value":"nothing"}],"isFunctionDefinition":true}]

		);
	});

	it("should parse function definitions", function() {
		expect(parse("\\function myMacro(one:'Jaguar')\n<$text text=<<one>>/>\n\\end\n\n")).toEqual(

			[{"type":"set","attributes":{"name":{"name":"name","type":"string","value":"myMacro"},"value":{"name":"value","type":"string","value":"<$text text=<<one>>/>"}},"children":[],"params":[{"name":"one","default":"Jaguar"}],"orderedAttributes":[{"name":"name","type":"string","value":"myMacro"},{"name":"value","type":"string","value":"<$text text=<<one>>/>"}],"isFunctionDefinition":true}]

		);
	});

	it("should parse comment in pragma area. Comment will be invisible", function() {
		expect(parse("<!-- comment in pragma area -->\n\\define aMacro()\nnothing\n\\end\n")).toEqual(

			[{"type":"set","attributes":{"name":{"name":"name","type":"string","value":"aMacro"},"value":{"name":"value","type":"string","value":"nothing"}},"children":[],"params":[],"isMacroDefinition":true,"orderedAttributes":[{"name":"name","type":"string","value":"aMacro"},{"name":"value","type":"string","value":"nothing"}]}]

		);
	});

	it("should block mode filtered transclusions", function() {
		expect(parse("{{{ filter }}}")).toEqual(

			[ { type: 'list', attributes: { filter: { type: 'string', value: ' filter ' } }, isBlock: true } ]

		);
		expect(parse("{{{ fil\nter }}}")).toEqual(

			[ { type: 'list', attributes: { filter: { type: 'string', value: ' fil\nter ' } }, isBlock: true } ]

		);
	});

	it("should parse inline macro calls", function() {
		expect(parse("<<john>><<paul>><<george>><<ringo>>")).toEqual(

			[{"type":"element","tag":"p","children":[{"type":"transclude","start":0,"end":8,"attributes":{"$variable":{"name":"$variable","type":"string","value":"john"}},"orderedAttributes":[{"name":"$variable","type":"string","value":"john"}]},{"type":"transclude","start":8,"end":16,"attributes":{"$variable":{"name":"$variable","type":"string","value":"paul"}},"orderedAttributes":[{"name":"$variable","type":"string","value":"paul"}]},{"type":"transclude","start":16,"end":26,"attributes":{"$variable":{"name":"$variable","type":"string","value":"george"}},"orderedAttributes":[{"name":"$variable","type":"string","value":"george"}]},{"type":"transclude","start":26,"end":35,"attributes":{"$variable":{"name":"$variable","type":"string","value":"ringo"}},"orderedAttributes":[{"name":"$variable","type":"string","value":"ringo"}]}],"start":0,"end":35}]

		);
		expect(parse("text <<john one:val1 two: 'val \"2\"' three: \"val '3'\" four: \"\"\"val 4\"5'\"\"\" five: [[val 5]] >>")).toEqual(

			[{"type":"element","tag":"p","children":[{"type":"text","text":"text ","start":0,"end":5},{"type":"transclude","start":5,"end":92,"attributes":{"$variable":{"name":"$variable","type":"string","value":"john"},"one":{"name":"one","type":"string","value":"val1","start":11,"end":20},"two":{"name":"two","type":"string","value":"val \"2\"","start":20,"end":35},"three":{"name":"three","type":"string","value":"val '3'","start":35,"end":52},"four":{"name":"four","type":"string","value":"val 4\"5'","start":52,"end":73},"five":{"name":"five","type":"string","value":"val 5","start":73,"end":89}},"orderedAttributes":[{"name":"$variable","type":"string","value":"john"},{"name":"one","type":"string","value":"val1","start":11,"end":20},{"name":"two","type":"string","value":"val \"2\"","start":20,"end":35},{"name":"three","type":"string","value":"val '3'","start":35,"end":52},{"name":"four","type":"string","value":"val 4\"5'","start":52,"end":73},{"name":"five","type":"string","value":"val 5","start":73,"end":89}]}],"start":0,"end":92}]

		);
		expect(parse("ignored << carrots <<john>>")).toEqual(

			[{"type":"element","tag":"p","children":[{"type":"text","text":"ignored << carrots ","start":0,"end":19},{"type":"transclude","start":19,"end":27,"attributes":{"$variable":{"name":"$variable","type":"string","value":"john"}},"orderedAttributes":[{"name":"$variable","type":"string","value":"john"}]}],"start":0,"end":27}]

		);
		expect(parse("text <<<john>>")).toEqual(

			[{"type":"element","tag":"p","children":[{"type":"text","text":"text ","start":0,"end":5},{"type":"transclude","start":5,"end":14,"attributes":{"$variable":{"name":"$variable","type":"string","value":"<john"}},"orderedAttributes":[{"name":"$variable","type":"string","value":"<john"}]}],"start":0,"end":14}]

		);
		expect(parse("before\n<<john>>")).toEqual(

			[{"type":"element","tag":"p","children":[{"type":"text","text":"before\n","start":0,"end":7},{"type":"transclude","start":7,"end":15,"attributes":{"$variable":{"name":"$variable","type":"string","value":"john"}},"orderedAttributes":[{"name":"$variable","type":"string","value":"john"}]}],"start":0,"end":15}]

		);
		// A single space will cause it to be inline
		expect(parse("<<john>> ")).toEqual(

			[{"type":"element","tag":"p","children":[{"type":"transclude","start":0,"end":8,"attributes":{"$variable":{"name":"$variable","type":"string","value":"john"}},"orderedAttributes":[{"name":"$variable","type":"string","value":"john"}]},{"type":"text","text":" ","start":8,"end":9}],"start":0,"end":9}]

		);
		expect(parse("text <<outie one:'my <<innie>>' >>")).toEqual(

			[{"type":"element","tag":"p","children":[{"type":"text","text":"text ","start":0,"end":5},{"type":"transclude","start":5,"end":34,"attributes":{"$variable":{"name":"$variable","type":"string","value":"outie"},"one":{"name":"one","type":"string","value":"my <<innie>>","start":12,"end":31}},"orderedAttributes":[{"name":"$variable","type":"string","value":"outie"},{"name":"one","type":"string","value":"my <<innie>>","start":12,"end":31}]}],"start":0,"end":34}]

		);

	});

	it("should parse block macro calls", function() {
		expect(parse("<<john>>\n<<paul>>\r\n<<george>>\n<<ringo>>")).toEqual(

			[ { type: 'transclude', start: 0, attributes: { $variable: { name: "$variable", type: "string", value: "john" }}, orderedAttributes: [ { name: "$variable", type: "string", value: "john" }], end: 8, isBlock: true }, { type: 'transclude', start: 9, attributes: { $variable: { name: "$variable", type: "string", value: "paul" }}, orderedAttributes: [ { name: "$variable", type: "string", value: "paul" }], end: 17, isBlock: true }, { type: 'transclude', start: 19, attributes: { $variable: { name: "$variable", type: "string", value: "george" }}, orderedAttributes: [ { name: "$variable", type: "string", value: "george" }], end: 29, isBlock: true }, { type: 'transclude', start: 30, attributes: { $variable: { name: "$variable", type: "string", value: "ringo" }}, orderedAttributes: [ { name: "$variable", type: "string", value: "ringo" }], end: 39, isBlock: true } ]

		);
		expect(parse("<<john one:val1 two: 'val \"2\"' three: \"val '3'\" four: \"\"\"val 4\"5'\"\"\" five: [[val 5]] >>")).toEqual(

			[{"type":"transclude","start":0,"end":87,"attributes":{"$variable":{"name":"$variable","type":"string","value":"john"},"one":{"name":"one","type":"string","value":"val1","start":6,"end":15},"two":{"name":"two","type":"string","value":"val \"2\"","start":15,"end":30},"three":{"name":"three","type":"string","value":"val '3'","start":30,"end":47},"four":{"name":"four","type":"string","value":"val 4\"5'","start":47,"end":68},"five":{"name":"five","type":"string","value":"val 5","start":68,"end":84}},"orderedAttributes":[{"name":"$variable","type":"string","value":"john"},{"name":"one","type":"string","value":"val1","start":6,"end":15},{"name":"two","type":"string","value":"val \"2\"","start":15,"end":30},{"name":"three","type":"string","value":"val '3'","start":30,"end":47},{"name":"four","type":"string","value":"val 4\"5'","start":47,"end":68},{"name":"five","type":"string","value":"val 5","start":68,"end":84}],"isBlock":true}]

		);
		expect(parse("<< carrots\n\n<<john>>")).toEqual(

			[ { type: 'element', tag: 'p', start : 0, end : 10, children: [ { type: 'text', text: '<< carrots', start : 0, end : 10 } ] }, { type: 'transclude', start: 12, attributes: { $variable: {name: "$variable", type:"string", value: "john"} }, orderedAttributes: [ {name: "$variable", type:"string", value: "john"} ], end: 20, isBlock: true } ]

		);
		expect(parse("before\n\n<<john>>")).toEqual(

			[ { type: 'element', tag: 'p', start : 0, end : 6, children: [ { type: 'text', text: 'before', start : 0, end : 6 } ] }, { type: 'transclude', start: 8, attributes: { $variable: {name: "$variable", type:"string", value: "john"} }, orderedAttributes: [ {name: "$variable", type:"string", value: "john"} ], end: 16, isBlock: true } ]

		);
		expect(parse("<<john>>\nafter")).toEqual(

			[ { type: 'transclude', start: 0, attributes: { $variable: {name: "$variable", type:"string", value: "john"} }, orderedAttributes: [ {name: "$variable", type:"string", value: "john"} ], end: 8, isBlock: true }, { type: 'element', tag: 'p', start: 9, end: 14, children: [ { type: 'text', text: 'after', start: 9, end: 14 } ] } ]

		);
		expect(parse("<<multiline arg:\"\"\"\n\nwikitext\n\"\"\" >>")).toEqual(

			[{"type":"transclude","start":0,"end":36,"attributes":{"$variable":{"name":"$variable","type":"string","value":"multiline"},"arg":{"name":"arg","type":"string","value":"\n\nwikitext\n","start":11,"end":33}},"orderedAttributes":[{"name":"$variable","type":"string","value":"multiline"},{"name":"arg","type":"string","value":"\n\nwikitext\n","start":11,"end":33}],"isBlock":true}]

		);
		expect(parse("<<outie one:'my <<innie>>' >>")).toEqual(

			[ { type: 'transclude', start: 0, attributes: { $variable: {name: "$variable", type:"string", value: "outie"}, one: {name: "one", type:"string", value: "my <<innie>>", start: 7, end: 26} }, orderedAttributes: [ {name: "$variable", type:"string", value: "outie"}, {name: "one", type:"string", value: "my <<innie>>", start: 7, end: 26} ], end: 29, isBlock: true } ]

		);
	});

	it("should parse tricky macrocall parameters", function() {
		expect(parse("<<john pa>am>>")).toEqual(

			[{"type":"transclude","start":0,"end":14,"attributes":{"0":{"name":"0","type":"string","value":"pa>am","start":6,"end":12},"$variable":{"name":"$variable","type":"string","value":"john"}},"orderedAttributes":[{"name":"$variable","type":"string","value":"john"},{"name":"0","type":"string","value":"pa>am","start":6,"end":12}],"isBlock":true}]

		);
		expect(parse("<<john param> >>")).toEqual(

			[{"type":"transclude","start":0,"end":16,"attributes":{"0":{"name":"0","type":"string","value":"param>","start":6,"end":13},"$variable":{"name":"$variable","type":"string","value":"john"}},"orderedAttributes":[{"name":"$variable","type":"string","value":"john"},{"name":"0","type":"string","value":"param>","start":6,"end":13}],"isBlock":true}]

		);
		expect(parse("<<john param>>>")).toEqual(

			[{"type":"element","tag":"p","children":[{"type":"transclude","start":0,"end":14,"attributes":{"0":{"name":"0","type":"string","value":"param","start":6,"end":12},"$variable":{"name":"$variable","type":"string","value":"john"}},"orderedAttributes":[{"name":"$variable","type":"string","value":"john"},{"name":"0","type":"string","value":"param","start":6,"end":12}]},{"type":"text","text":">","start":14,"end":15}],"start":0,"end":15}]

		);
		// equals signs should be allowed
		expect(parse("<<john var>=4 >>")).toEqual(

			[{"type":"transclude","start":0,"end":16,"attributes":{"0":{"name":"0","type":"string","value":"var>=4","start":6,"end":13},"$variable":{"name":"$variable","type":"string","value":"john"}},"orderedAttributes":[{"name":"$variable","type":"string","value":"john"},{"name":"0","type":"string","value":"var>=4","start":6,"end":13}],"isBlock":true}]

		);

	});

	it("should parse horizontal rules", function() {
		expect(parse("---Not a rule\n\n----\n\nBetween\n\n---")).toEqual(

			[ { type : 'element', tag : 'p', start : 0, end : 13, children : [ { type : 'entity', entity : '&mdash;' }, { type : 'text', text : 'Not a rule', start : 3, end : 13 } ] }, { type : 'element', tag : 'hr' }, { type : 'element', tag : 'p', start : 21, end : 28, children : [ { type : 'text', text : 'Between', start : 21, end : 28 } ] }, { type : 'element', tag : 'hr' } ]

		);

	});

	it("should parse hard linebreak areas", function() {
		expect(parse("\"\"\"Something\nin the\nway she moves\n\"\"\"\n\n")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'text', text : 'Something', start : 3, end : 12 }, { type : 'element', tag : 'br' }, { type : 'text', text : 'in the', start : 13, end : 19 }, { type : 'element', tag : 'br' }, { type : 'text', text : 'way she moves', start : 20, end : 33 }, { type : 'element', tag : 'br' } ], start : 0, end : 37 } ]

		);

	});

});

})();
