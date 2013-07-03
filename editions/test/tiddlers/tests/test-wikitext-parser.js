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

			[ { type : 'element', tag : 'p', children : [ { type : 'element', start : 0, attributes : { state : { start : 8, name : 'state', type : 'string', value : '$:/temp/search', end : 31 }, type : { start : 31, name : 'type', type : 'string', value : 'nomatch', end : 46 }, text : { start : 46, name : 'text', type : 'string', value : '', end : 54 } }, tag : '$reveal', end : 55, children : [  ], isBlock : false } ] } ]

		);
		expect(parse("<div attribute={{TiddlerTitle!!field}}>some text</div>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'div', isBlock : false, attributes : { attribute : { type : 'indirect', name : 'attribute', textReference : 'TiddlerTitle!!field', start : 4, end : 38 } }, children : [ { type : 'text', text : 'some text' } ], start : 0, end : 39 } ] } ]

		);
		expect(parse("<div attribute={{TiddlerTitle!!field}}>\nsome text</div>")).toEqual(

			[ { type : 'element', start : 0, attributes : { attribute : { start : 4, name : 'attribute', type : 'indirect', textReference : 'TiddlerTitle!!field', end : 38 } }, tag : 'div', end : 39, isBlock : true, children : [ { type : 'element', tag : 'p', children : [ { type : 'text', text : 'some text' } ] } ] } ]

		);
		expect(parse("<div><div attribute={{TiddlerTitle!!field}}>\nsome text</div></div>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', start : 0, attributes : {  }, tag : 'div', end : 5, isBlock : false, children : [ { type : 'element', start : 5, attributes : { attribute : { start : 9, name : 'attribute', type : 'indirect', textReference : 'TiddlerTitle!!field', end : 43 } }, tag : 'div', end : 44, isBlock : true, children : [ { type : 'element', tag : 'p', children : [ { type : 'text', text : 'some text' } ] } ] } ] } ] } ]

		);
	});

	it("should parse macro definitions", function() {
		expect(parse("\\define myMacro()\nnothing\n\\end\n")).toEqual(

			[ { type : 'macrodef', name : 'myMacro', params : [  ], text : 'nothing' } ]

		);

	});

});

})();
