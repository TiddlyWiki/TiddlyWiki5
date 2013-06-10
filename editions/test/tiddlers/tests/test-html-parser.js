/*\
title: test-html-parser.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the parse rule for HTML elements

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("HTML tag parser tests", function() {

	// Create a wiki
	var wiki = new $tw.Wiki();

	// Define a parsing shortcut
	var parse = function(text) {
		return wiki.parseText("text/vnd.tiddlywiki",text).tree;
	};

	it("should parse unclosed tags", function() {
		expect(parse("<br>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'br', isBlock : false, attributes : {  }, children : [  ] } ] } ]

		);
		expect(parse("</br>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'text', text : '</br>' } ] } ]

		);
		expect(parse("<div>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'div', isBlock : false, attributes : {  }, children : [  ] } ] } ]

		);
		expect(parse("<div/>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'div', isBlock : false, attributes : {  }, children : [  ] } ] } ]

		);
		expect(parse("<div></div>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'div', isBlock : false, attributes : {  }, children : [  ] } ] } ]

		);
		expect(parse("<div>some text</div>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'div', isBlock : false, attributes : {  }, children : [ { type : 'text', text : 'some text' } ] } ] } ]

		);
		expect(parse("<div attribute>some text</div>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'div', isBlock : false, attributes : { attribute : { type : 'string', value : 'true' } }, children : [ { type : 'text', text : 'some text' } ] } ] } ]

		);
		expect(parse("<div attribute='value'>some text</div>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'div', isBlock : false, attributes : { attribute : { type : 'string', value : 'value' } }, children : [ { type : 'text', text : 'some text' } ] } ] } ]

		);
		expect(parse("<div attribute={{TiddlerTitle}}>some text</div>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'div', isBlock : false, attributes : { attribute : { type : 'indirect', textReference : 'TiddlerTitle' } }, children : [ { type : 'text', text : 'some text' } ] } ] } ]

		);
		expect(parse("<div attribute={{TiddlerTitle!!field}}>some text</div>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'div', isBlock : false, attributes : { attribute : { type : 'indirect', textReference : 'TiddlerTitle!!field' } }, children : [ { type : 'text', text : 'some text' } ] } ] } ]

		);
	});

});

})();
