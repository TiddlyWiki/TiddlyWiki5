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
		return wiki.parseText("text/vnd.tiddlywiki",text).tree;
	};

	it("should parse tags", function() {
		expect(parse("<br>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'br', isBlock : false, attributes : {  }, start : 0, end : 4 } ] } ]

		);
		expect(parse("</br>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'text', text : '</br>' } ] } ]

		);
		expect(parse("<div>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'div', isBlock : false, attributes : {  }, children : [  ], start : 0, end : 5 } ] } ]

		);
		expect(parse("<div/>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'div', isSelfClosing : true, isBlock : false, attributes : {  }, start : 0, end : 6 } ] } ]

		);
		expect(parse("<div></div>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'div', isBlock : false, attributes : {  }, children : [ ], start : 0, end : 5 } ] } ]

		);
		expect(parse("<div>some text</div>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'div', isBlock : false, attributes : {  }, children : [ { type : 'text', text : 'some text' } ], start : 0, end : 5 } ] } ]

		);
		expect(parse("<div attribute>some text</div>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'div', isBlock : false, attributes : { attribute : { type : 'string', value : 'true', start : 4, end : 14, name: 'attribute' } }, children : [ { type : 'text', text : 'some text' } ], start : 0, end : 15 } ] } ]

		);
		expect(parse("<div attribute='value'>some text</div>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'div', isBlock : false, attributes : { attribute : { type : 'string', name: 'attribute', value : 'value', start: 4, end: 22 } }, children : [ { type : 'text', text : 'some text' } ], start: 0, end: 23 } ] } ]

		);
		expect(parse("<div attribute={{TiddlerTitle}}>some text</div>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'div', isBlock : false, attributes : { attribute : { type : 'indirect', name: 'attribute', textReference : 'TiddlerTitle', start : 4, end : 31 } }, children : [ { type : 'text', text : 'some text' } ], start : 0, end : 32 } ] } ]

		);
		expect(parse("<$reveal state='$:/temp/search' type='nomatch' text=''>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'reveal', tag: '$reveal', start : 0, attributes : { state : { start : 8, name : 'state', type : 'string', value : '$:/temp/search', end : 31 }, type : { start : 31, name : 'type', type : 'string', value : 'nomatch', end : 46 }, text : { start : 46, name : 'text', type : 'string', value : '', end : 54 } }, end : 55, isBlock : false, children : [  ] } ] } ]

		);
		expect(parse("<div attribute={{TiddlerTitle!!field}}>some text</div>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'div', isBlock : false, attributes : { attribute : { type : 'indirect', name : 'attribute', textReference : 'TiddlerTitle!!field', start : 4, end : 38 } }, children : [ { type : 'text', text : 'some text' } ], start : 0, end : 39 } ] } ]

		);
		expect(parse("<div attribute={{Tiddler Title!!field}}>some text</div>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'div', isBlock : false, attributes : { attribute : { type : 'indirect', name : 'attribute', textReference : 'Tiddler Title!!field', start : 4, end : 39 } }, children : [ { type : 'text', text : 'some text' } ], start : 0, end : 40 } ] } ]

		);
		expect(parse("<div attribute={{TiddlerTitle!!field}}>\n\nsome text</div>")).toEqual(

			[ { type : 'element', start : 0, attributes : { attribute : { start : 4, name : 'attribute', type : 'indirect', textReference : 'TiddlerTitle!!field', end : 38 } }, tag : 'div', end : 39, isBlock : true, children : [ { type : 'element', tag : 'p', children : [ { type : 'text', text : 'some text' } ] } ] } ]

		);
		expect(parse("<div><div attribute={{TiddlerTitle!!field}}>\n\nsome text</div></div>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', start : 0, attributes : {  }, tag : 'div', end : 5, isBlock : false, children : [ { type : 'element', start : 5, attributes : { attribute : { start : 9, name : 'attribute', type : 'indirect', textReference : 'TiddlerTitle!!field', end : 43 } }, tag : 'div', end : 44, isBlock : true, children : [ { type : 'element', tag : 'p', children : [ { type : 'text', text : 'some text' } ] } ] } ] } ] } ]

		);
		expect(parse("<div><div attribute={{TiddlerTitle!!field}}>\n\n!some heading</div></div>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', start : 0, attributes : {  }, tag : 'div', end : 5, isBlock : false, children : [ { type : 'element', start : 5, attributes : { attribute : { start : 9, name : 'attribute', type : 'indirect', textReference : 'TiddlerTitle!!field', end : 43 } }, tag : 'div', end : 44, isBlock : true, children : [ { type : 'element', tag : 'h1', attributes : { class : { type : 'string', value : '' } }, children : [ { type : 'text', text : 'some heading</div></div>' } ] } ] } ] } ] } ]

		);
		expect(parse("<div><div attribute={{TiddlerTitle!!field}}>\n!some heading</div></div>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', start : 0, attributes : {  }, tag : 'div', end : 5, isBlock : false, children : [ { type : 'element', start : 5, attributes : { attribute : { start : 9, name : 'attribute', type : 'indirect', textReference : 'TiddlerTitle!!field', end : 43 } }, tag : 'div', end : 44, isBlock : false, children : [ { type : 'text', text : '\n!some heading' } ] } ] } ] } ]

		);
		// Regression test for issue (#3306)
		expect(parse("<div><span><span>\n\nSome text</span></span></div>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', start : 0, attributes : {  }, tag : 'div', end : 5, isBlock : false, children : [ { type : 'element', start : 5, attributes : {  }, tag : 'span', end : 11, isBlock : false, children : [ { type : 'element', start : 11, attributes : {  }, tag : 'span', end : 17, isBlock : true, children : [ { type : 'element', tag : 'p', children : [ { type : 'text', text : 'Some text' } ] } ] } ] } ] } ] } ]

		);
	});

	it("should parse macro definitions", function() {
		expect(parse("\\define myMacro()\nnothing\n\\end\n")).toEqual(

			[ { type : 'set', attributes : { name : { type : 'string', value : 'myMacro' }, value : { type : 'string', value : 'nothing' } }, children : [  ], params : [  ], isMacroDefinition : true } ]

		);

	});

	it("should parse inline macro calls", function() {
		expect(parse("<<john>><<paul>><<george>><<ringo>>")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'macrocall', start: 0, params: [  ], name: 'john', end: 8 }, { type: 'macrocall', start: 8, params: [  ], name: 'paul', end: 16 }, { type: 'macrocall', start: 16, params: [  ], name: 'george', end: 26 }, { type: 'macrocall', start: 26, params: [  ], name: 'ringo', end: 35 } ] } ]

		);
		expect(parse("text <<john one:val1 two: 'val \"2\"' three: \"val '3'\" four: \"\"\"val 4\"5'\"\"\" five: [[val 5]] >>")).toEqual(

			[{ type: 'element', tag: 'p', children: [ { type: 'text', text: 'text ' }, { type: 'macrocall', name: 'john', start: 5, params: [ { type: 'macro-parameter', start: 11, value: 'val1', name: 'one', end: 20 }, { type: 'macro-parameter', start: 20, value: 'val "2"', name: 'two', end: 35 }, { type: 'macro-parameter', start: 35, value: 'val \'3\'', name: 'three', end: 52 }, { type: 'macro-parameter', start: 52, value: 'val 4"5\'', name: 'four', end: 73 }, { type: 'macro-parameter', start: 73, value: 'val 5', name: 'five', end: 89 } ], end: 92 } ] } ]

		);
		expect(parse("ignored << carrots <<john>>")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'text', text: 'ignored << carrots ' }, { type: 'macrocall', name: 'john', start: 19, params: [  ], end: 27 } ] } ]

		);
		expect(parse("text <<<john>>")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'text', text: 'text ' }, { type: 'macrocall', name: '<john', start: 5, params: [  ], end: 14 } ] } ]

		);
		expect(parse("before\n<<john>>")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'text', text: 'before\n' }, { type: 'macrocall', start: 7, params: [  ], name: 'john', end: 15 } ] } ]

		);
		// A single space will cause it to be inline
		expect(parse("<<john>> ")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'macrocall', start: 0, params: [  ], name: 'john', end: 8 }, { type: 'text', text: ' ' } ] } ]

		);
		expect(parse("text <<outie one:'my <<innie>>' >>")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'text', text: 'text ' }, { type: 'macrocall', start: 5, params: [ { type: 'macro-parameter', start: 12, value: 'my <<innie>>', name: 'one', end: 31 } ], name: 'outie', end: 34 } ] } ]

		);

	});

	it("should parse block macro calls", function() {
		expect(parse("<<john>>\n<<paul>>\r\n<<george>>\n<<ringo>>")).toEqual(

			[ { type: 'macrocall', start: 0, name: 'john', params: [  ], end: 8, isBlock: true }, { type: 'macrocall', start: 9, name: 'paul', params: [  ], end: 17, isBlock: true }, { type: 'macrocall', start: 19, name: 'george', params: [  ], end: 29, isBlock: true }, { type: 'macrocall', start: 30, name: 'ringo', params: [  ], end: 39, isBlock: true } ]

		);
		expect(parse("<<john one:val1 two: 'val \"2\"' three: \"val '3'\" four: \"\"\"val 4\"5'\"\"\" five: [[val 5]] >>")).toEqual(

			[ { type: 'macrocall', start: 0, name: 'john', params: [ { type: 'macro-parameter', start: 6, value: 'val1', name: 'one', end: 15 }, { type: 'macro-parameter', start: 15, value: 'val "2"', name: 'two', end: 30 }, { type: 'macro-parameter', start: 30, value: 'val \'3\'', name: 'three', end: 47 }, { type: 'macro-parameter', start: 47, value: 'val 4"5\'', name: 'four', end: 68 }, { type: 'macro-parameter', start: 68, value: 'val 5', name: 'five', end: 84 }], end: 87, isBlock: true } ]

		);
		expect(parse("<< carrots\n\n<<john>>")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'text', text: '<< carrots' } ] }, { type: 'macrocall', start: 12, params: [  ], name: 'john', end: 20, isBlock: true } ]

		);
		expect(parse("before\n\n<<john>>")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'text', text: 'before' } ] }, { type: 'macrocall', start: 8, name: 'john', params: [  ], end: 16, isBlock: true } ]

		);
		expect(parse("<<john>>\nafter")).toEqual(

			[ { type: 'macrocall', start: 0, name: 'john', params: [  ], end: 8, isBlock: true }, { type: 'element', tag: 'p', children: [ { type: 'text', text: 'after' } ] } ]

		);
		expect(parse("<<multiline arg:\"\"\"\n\nwikitext\n\"\"\" >>")).toEqual(

			[ { type: 'macrocall', start: 0, params: [ { type: 'macro-parameter', start: 11, value: '\n\nwikitext\n', name: 'arg', end: 33 } ], name: 'multiline', end: 36, isBlock: true }]

		);
		expect(parse("<<outie one:'my <<innie>>' >>")).toEqual(

			[ { type: 'macrocall', start: 0, params: [ { type: 'macro-parameter', start: 7, value: 'my <<innie>>', name: 'one', end: 26 } ], name: 'outie', end: 29, isBlock: true } ]

		);
	});

	it("should parse tricky macrocall parameters", function() {
		expect(parse("<<john pa>am>>")).toEqual(

			[ { type: 'macrocall', start: 0, params: [ { type: 'macro-parameter', start: 6, value: 'pa>am', end: 12 } ], name: 'john', end: 14, isBlock: true } ]

		);
		expect(parse("<<john param> >>")).toEqual(

			[ { type: 'macrocall', start: 0, params: [ { type: 'macro-parameter', start: 6, value: 'param>', end: 13 } ], name: 'john', end: 16, isBlock: true } ]

		);
		expect(parse("<<john param>>>")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'macrocall', start: 0, params: [ { type: 'macro-parameter', start: 6, value: 'param', end: 12 } ], name: 'john', end: 14 }, { type: 'text', text: '>' } ] } ]

		);
		// equals signs should be allowed
		expect(parse("<<john var>=4 >>")).toEqual(

			[ { type: 'macrocall', start: 0, params: [ { type: 'macro-parameter', start: 6, value: 'var>=4', end: 13 } ], name: 'john', end: 16, isBlock: true } ]

		);

	});

	it("should parse horizontal rules", function() {
		expect(parse("---Not a rule\n\n----\n\nBetween\n\n---")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'entity', entity : '&mdash;' }, { type : 'text', text : 'Not a rule' } ] }, { type : 'element', tag : 'hr' }, { type : 'element', tag : 'p', children : [ { type : 'text', text : 'Between' } ] }, { type : 'element', tag : 'hr' } ]

		);

	});

	it("should parse hard linebreak areas", function() {
		expect(parse("\"\"\"Something\nin the\nway she moves\n\"\"\"\n\n")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'text', text : 'Something' }, { type : 'element', tag : 'br' }, { type : 'text', text : 'in the' }, { type : 'element', tag : 'br' }, { type : 'text', text : 'way she moves' }, { type : 'element', tag : 'br' } ] } ]

		);

	});

});

})();
