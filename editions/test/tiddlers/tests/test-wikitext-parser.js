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

			[ { type : 'element', tag : 'p', children : [ { type : 'element', start : 0, attributes : {  }, tag : 'div', end : 5, isBlock : false, children : [ { type : 'element', start : 5, attributes : { attribute : { start : 9, name : 'attribute', type : 'indirect', textReference : 'TiddlerTitle!!field', end : 43 } }, tag : 'div', end : 44, isBlock : false, children : [ { type : 'text', text : '!some heading' } ] } ] } ] } ]

		);
	});

	it("should parse macro definitions", function() {
		expect(parse("\\define myMacro()\nnothing\n\\end\n")).toEqual(

			[ { type : 'set', attributes : { name : { type : 'string', value : 'myMacro' }, value : { type : 'string', value : 'nothing' } }, children : [  ], params : [  ], isMacroDefinition : true } ]

		);

	});

	it("should parse macro calls", function() {
		expect(parse("<<john>><<paul>><<george>><<ringo>>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'macrocall', name : 'john', params : [  ] }, { type : 'macrocall', name : 'paul', params : [  ] }, { type : 'macrocall', name : 'george', params : [  ] }, { type : 'macrocall', name : 'ringo', params : [  ] } ] } ]

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

	it("should parse elements in inline mode", function() {
		expect(parse("<inline></inline>")).toEqual(
			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'inline', isBlock : false, start : 0, end : 8, attributes : {}, children : [] } ] } ]
		);
		expect(parse("<inline>")).toEqual(parse("<inline></inline>"));
		expect(parse("<inline/>")).toEqual(
			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'inline', isSelfClosing : true, isBlock : false, start : 0, end : 9, attributes : {} } ] } ]
		);
		expect(parse("<x>!inline</x>")).toEqual(
			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'x', isBlock : false, start : 0, end : 3, attributes : {}, children : [ { type : 'text', text : '!inline' } ] } ] } ]
		);
		expect(parse("<x>!inline")).toEqual(parse("<x>!inline</x>"));
	});

	it("should parse elements in block mode", function() {
		expect(parse("<block>\n\n</block>")).toEqual(
			[ { type : 'element', tag : 'block', isBlock : true, start : 0, end : 7, attributes : {}, children : [] } ]
		);
		expect(parse("<block>\n\n")).toEqual(parse("<block>\n\n</block>"));
		expect(parse("<block/>\n")).toEqual(
			[ { type : 'element', tag : 'block', isSelfClosing : true, isBlock : true, start : 0, end : 8, attributes : {} } ]
		);

		expect(parse("<x>\n\n!block\n\n</x>")).toEqual(
			[ { type : 'element', tag : 'x', isBlock : true, start : 0, end : 3, attributes : {}, children : [ { type : 'element', tag : 'h1', attributes : { 'class' : { type : 'string', value : '' } }, children : [ { type : 'text', text : 'block' } ] } ] } ]
		);
		expect(parse("<x>\n\n!block")).toEqual(parse("<x>\n\n!block\n\n</x>"));
	});

	it("should parse elements in block, children in inline mode", function() {
		expect(parse("<block>\n</block>")).toEqual(
			[ { "type": "element", "tag": "block", "isBlock": true, "start": 0, "end": 7, "attributes": {}, "children": [] } ]
		);
		expect(parse("<block>\n</block>")).toEqual(parse("<block>\n\n</block>"));
		expect(parse("<block>\n")).toEqual(parse("<block>\n</block>"));

		expect(parse("<block>\n!inline</block>")).toEqual(
			[ { "type": "element", "tag": "block", "isBlock": true, "start": 0, "end": 7, "attributes": {}, "children": [ { "type": "text", "text": "!inline" } ] } ]
		);
		expect(parse("<block>\n!inline")).toEqual(parse("<block>\n!inline</block>"));
	});

	it("should trim unneeded, but preserve needed whitespace", function() {
		// autoparagraphed elements / whitespace before end of parsed string
		expect(parse("...")).toEqual(
			[ { type : 'element', tag : 'p', children : [ { type : 'text', text : '...' } ] } ]
		);
		expect(parse("\r\t ...")).toEqual(parse("..."));
		expect(parse("... \t\r\n")).toEqual(parse("..."));
		expect(parse("...\n\n")).toEqual(parse("..."));

		// inline mode
		expect(parse("<e>...</e>")).toEqual(
			[ { "type": "element", "tag": "p", "children": [ { "type": "element", "tag": "e", "isBlock": false, "start": 0, "end": 3, "attributes": {}, "children": [ { "type": "text", "text": "..." } ] } ] } ]
		);
		expect(parse("<e>... \t\r\n</e>")).toEqual(parse("<e>...</e>"));
		expect(parse("<e>...\n\n</e>")).toEqual(parse("<e>...</e>"));

		// element block, children inline mode
		expect(parse("<e>\n...</e>")).toEqual(
			[ { "type": "element", "tag": "e", "isBlock": true, "start": 0, "end": 3, "attributes": {}, "children": [ { "type": "text", "text": "..." } ] } ]
		);
		expect(parse("<e>\n... \t\r\n</e>")).toEqual(parse("<e>\n...</e>"));
		expect(parse("<e>\n...\n\n</e>")).toEqual(parse("<e>\n...</e>"));

		// preserve an indented first line in the element block, children inline mode. Needed for eg. pre´s.
		expect(parse("<pre>\n    i am indented\n</pre>")).toEqual(
			[ { "type": "element", "tag": "pre", "isBlock": true, "start": 0, "end": 5, "attributes": {}, "children": [ { "type": "text", "text": "    i am indented" } ] } ]
		);

		// block mode
		expect(parse("<e>\n\n...</e>")).toEqual(
			[ { type : 'element', tag : 'e', isBlock : true, start : 0, end : 3, attributes : {}, children : [ { type : 'element', tag : 'p', children : [ { type : 'text', text : '...' } ] } ] } ]
		);
		expect(parse("<e>\n\n... \t\r\n</e>")).toEqual(parse("<e>\n\n...</e>"));
		expect(parse("<e>\n\n...\n\n</e>")).toEqual(parse("<e>\n\n...</e>"));
	});

});

})();
