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

	it("should parse void elements defined by the HTML5 standard", function() {
		expect(parse("<br>")).toEqual(
			[
				{
					type : 'element',
					tag : 'br',
					isBlock : true,
					attributes : {  },
					start : 0, end : 4
				}
			]
		);
		expect(parse("<br/>")).toEqual(
			[
				{
					type : 'element',
					tag : 'br',
					isSelfClosing : true,
					isBlock : true,
					attributes : {  },
					start : 0, end : 5
				}
			]
		);
		expect(parse("</br>")).toEqual(
			[
				{
					type : 'element',
					tag : 'p',
					children : [
						{ type : 'text', text : '</br>' }
					]
				}
			]
		);
	});
	it("should parse other void elements", function() {
		expect(parse("<button/>")).toEqual(
			[
				{
					type : 'element',
					tag : 'button',
					isSelfClosing : true,
					isBlock : true,
					attributes : {  },
					start : 0, end : 9
				}
			]
		);
	});
	it("should parse elements inside of inline contexts in inline mode", function() {
		expect(parse("<span></span>")).toEqual(
			[
				{
					type : 'element',
					tag : 'p',
					children : [
						{
							type : 'element',
							tag : 'span',
							isBlock : false,
							attributes : {  },
							children : [ ],
							start : 0, end : 6
						}
					]
				}
			]
		);
		expect(parse("<span>text</span>")).toEqual(
			[
				{
					type : 'element',
					tag : 'p',
					children : [
						{
							type : 'element',
							tag : 'span',
							isBlock : false,
							attributes : {  },
							children : [
								{ type : 'text', text : 'text' }
							],
							start : 0, end : 6
						}
					]
				}
			]
		);
		expect(parse("text<span>text</span>")).toEqual(
			[
				{
					type : 'element',
					tag : 'p',
					children : [
						{ type : 'text', text : 'text' },
						{
							type : 'element',
							tag : 'span',
							isBlock : false,
							attributes : {  },
							children : [
								{ type : 'text', text : 'text' }
							],
							start : 4,
							end : 10
						}
					]
				}
			]
		);
		expect(parse("<span>text</span>text")).toEqual(
			[
				{
					type : 'element',
					tag : 'p',
					children : [
						{
							type : 'element',
							tag : 'span',
							isBlock : false,
							attributes : {  },
							children : [
								{ type : 'text', text : 'text' }
							],
							start : 0, end : 6
						},
						{ type : 'text', text : 'text' }
					]
				}
			]
		);
	});
	it("should parse linebreak escapers", function() {
		expect(parse("<span>\\\n</span>")).toEqual(
			[
				{
					type : "element",
					tag : "p",
					children : [
						{
							type : "element",
							tag : "span",
							isBlock : false,
							attributes : {},
							children : [
								{ type : "text", text : "\n" }
							],
							start : 0, end : 6
						}
					]
				}
			]
		);
		expect(parse("<span>\\\ntext\n</span>")).toEqual(
			[
				{
					type : "element",
					tag : "p",
					children : [
						{
							type : "element",
							tag : "span",
							isBlock : false,
							attributes : {},
							children : [
								{ type : "text", text : "\ntext\n" }
							],
							start : 0, end : 6
						}
					]
				}
			]
		);
		expect(parse("<span>\\text</span>")).toEqual(
			[
				{
					type : 'element',
					tag : 'p',
					children : [
						{
							type : 'element',
							tag : 'span',
							isBlock : false,
							attributes : {  },
							children : [
								{ type : 'text', text : '\\text' }
							],
							start : 0, end : 6
						}
					]
				}
			]
		);
	});
	it("should parse elements in block mode and their children in inline mode", function() {
		expect(parse("<div>\n</div>")).toEqual(
			[
				{
					type : 'element',
					tag : 'div',
					isBlock : true,
					attributes : {  },
					children: [
						{ type : 'text', text : '\n' }
					],
					start : 0, end : 5
				}
			]
		);
		expect(parse("<div>\ntext\n</div>")).toEqual(
			[
				{
					type : 'element',
					tag : 'div',
					isBlock : true,
					attributes : {  },
					children: [
						{ type : 'text', text : '\ntext\n' }
					],
					start : 0, end : 5
				}
			]
		);
		expect(parse("<div>\n!i am not a heading\n</div>")).toEqual(
			[
				{
					type : 'element',
					tag : 'div',
					isBlock : true,
					attributes : {  },
					children: [
						{ type : 'text', text : '\n!i am not a heading\n' }
					],
					start : 0, end : 5
				}
			]
		);
	});
	it("should parse preformatted block elements in block mode and skip newlines before first child", function() {
		expect(parse("<pre>\nLinebreak sets block mode. Then skip it\n</pre>")).toEqual(
			[
				{
					type: "element",
					tag: "pre",
					isBlock: true,
					attributes: {},
					children: [
						{ type: "text", text: "Linebreak sets block mode. Then skip it\n" }
					],
					start: 0, end: 5
				}
			]
		);
		expect(parse("<pre>\n    but keep indents\n</pre>")).toEqual(
			[
				{
					type: "element",
					tag: "pre",
					isBlock: true,
					attributes: {},
					children: [
						{ type: "text", text: "    but keep indents\n" }
					],
					start: 0, end: 5
				}
			]
		);
	});
	it("should parse both elements and their children in block mode", function() {
		expect(parse("<div>\n\ntext\n\n</div>")).toEqual(
			[
				{
					type : 'element',
					tag : 'div',
					start : 0,
					end : 5,
					isBlock : true,
					attributes : { },
					children : [
						{
							type : 'element',
							tag : 'p',
							children : [
								{ type : 'text', text : 'text' }
							]
						}
					]
				}
			]
		);
		expect(parse("<div>\n\n! text\n\n</div>")).toEqual(
			[
				{
					type : 'element',
					tag : 'div',
					start : 0,
					end : 5,
					isBlock : true,
					attributes : { },
					children : [
						{
							type: "element",
							tag: "h1",
							attributes: {
								class: { type: "string", value: "" }
							},
							children: [
								{ type: "text", text: "text" }
							]
						}
					]
				}
			]
		);
	});
	it("should parse standalone elements inside of inline contexts in inline mode", function() {
		expect(parse("<span/>text")).toEqual(
			[
				{
					type : 'element',
					tag : 'p',
					children : [
						{
							type : 'element',
							tag : 'span',
							isSelfClosing : true,
							isBlock : false,
							attributes : {  },
							start : 0, end : 7
						},
						{type : 'text', text : 'text'}
					]
				}
			]
		);
		expect(parse("text<span/>")).toEqual(
			[
				{
					type : 'element',
					tag : 'p',
					children : [
						{type : 'text', text : 'text'},
						{
							type : 'element',
							tag : 'span',
							isSelfClosing : true,
							isBlock : false,
							attributes : {  },
							start : 4, end : 11
						}
					]
				}
			]
		);
	});
	it("should parse standalone elements inside of block contexts in block mode", function() {
		expect(parse("<div/>")).toEqual(
			[
				{
					type : 'element',
					tag : 'div',
					isBlock : true,
					isSelfClosing: true,
					attributes : {  },
					start : 0, end : 6
				}
			]
		);
	});
	it("should close missing tags", function() {
		/* This tests for something which does not behave intuitive -
		'<div><span></div>' should become '<div><span></span></div>',
		not '<p><div><span>&lt;/div&gt;</span></div></p>' -- Nille */
		expect(parse("<span>text")).toEqual(parse("<span>text</span>"));
		expect(parse("<div>\ntext")).toEqual(parse("<div>\ntext</div>"));
	});

	it("should parse tags with attributes", function() {
		expect(parse("<div attribute>some text</div>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'div', isBlock : false, attributes : { attribute : { type : 'string', value : 'true', start : 4, end : 14, name: 'attribute' } }, children : [ { type : 'text', text : 'some text' } ], start : 0, end : 15 } ] } ]

		);
		expect(parse("<div attribute='value'>some text</div>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'div', isBlock : false, attributes : { attribute : { type : 'string', name: 'attribute', value : 'value', start: 4, end: 22 } }, children : [ { type : 'text', text : 'some text' } ], start: 0, end: 23 } ] } ]

		);
		expect(parse("<div attribute={{TiddlerTitle}}>some text</div>")).toEqual(

			[ { type : 'element', tag : 'p', children : [ { type : 'element', tag : 'div', isBlock : false, attributes : { attribute : { type : 'indirect', name: 'attribute', textReference : 'TiddlerTitle', start : 4, end : 31 } }, children : [ { type : 'text', text : 'some text' } ], start : 0, end : 32 } ] } ]

		);
		expect(parse("<$reveal state='$:/temp/search' type='nomatch' text=''/>")).toEqual(

			[ { type: 'reveal', tag: '$reveal', attributes: { state: { type: 'string', name: 'state', value: '$:/temp/search', start: 8, end: 31 }, type: { type: 'string', name: 'type', value: 'nomatch', start: 31, end: 46 }, text: { type: 'string', name: 'text', value: '', start: 46, end: 54 } }, isSelfClosing: true, isBlock: true, start: 0, end: 56 } ]

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

});

})();
