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

	it("should parse elements", function() {

		expect(parse("<div>\n<span><strong>Hi!</strong></span>\n</div>")).toEqual(

			[ { type: 'element', tag: 'div', children: [ { type: 'text', text: '\n' }, { type: 'element', tag: 'span', children: [ { type: 'element', tag: 'strong', children: [ { type: 'text', text: 'Hi!' } ], attributes: { }, start: 12, end: 20, isBlock: false } ], attributes: { }, start: 6, end: 12, isBlock: false }, { type: 'text', text: '\n' } ], attributes: { }, start: 0, end: 5, isBlock: true } ]

		);

	});

	it("should add missing closing tags if possible", function() {

		expect(parse("<div>\n<span></span>")).toEqual(

			[ { type: 'element', tag: 'div', children: [ { type: 'text', text: '\n' }, { type: 'element', tag: 'span', children: [  ], attributes: { }, start: 6, end: 12, isBlock: false } ], attributes: { }, start: 0, end: 5, isBlock: true } ]

		);

	});

	it("should otherwise indicate that something is missing, by partially interpreting tags as raw text", function() {

		expect(parse("<div>\n<span>\n</div>")).toEqual(

			[ { type: 'element', tag: 'div', children: [ { type: 'text', text: '\n' }, { type: 'element', tag: 'span', children: [ { type: 'text', text: '\n</div>' } ], attributes: { }, start: 6, end: 12, isBlock: false } ], attributes: { }, start: 0, end: 5, isBlock: true } ]

		);

		expect(parse("div><span></span></div>")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'text', text: 'div>' }, { type: 'element', tag: 'span', children: [ ], attributes: { }, start: 4, end: 10, isBlock: false }, { type: 'text', text: '</div>' } ] } ]

		);

	});

	it("should parse self closing elements", function() {

		expect(parse("<div/>")).toEqual(

			[ { type: 'element', tag: 'div', attributes: { }, start: 0, end: 6, isBlock: true, isSelfClosing: true } ]

		);

	});

	it("should automatically wrap in paragraphs", function() {

		expect(parse("paragraph\n\nanother paragraph")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'text', text: 'paragraph' } ] }, { type: 'element', tag: 'p', children: [ { type: 'text', text: 'another paragraph' } ] } ]

		);

	});

	it("should interpret block elements", function() {

		expect(parse("! Heading\n\n* list")).toEqual(

			[ { type: 'element', tag: 'h1', children: [ { type: 'text', text: 'Heading' } ], attributes: { class: { type: 'string', value: '' } } }, { type: 'element', tag: 'ul', children: [ { type: 'element', tag: 'li', children: [ { type: 'text', text: 'list' } ] } ] } ]

		);

	});

	it("should interpret inline elements", function() {

		expect(parse("//italic//, ''bold'', __underlined__")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'element', tag: 'em', children: [ { type: 'text', text: 'italic' } ] }, { type: 'text', text: ', ' }, { type: 'element', tag: 'strong', children: [ { type: 'text', text: 'bold' } ] }, { type: 'text', text: ', ' }, { type: 'element', tag: 'u', children: [ { type: 'text', text: 'underlined' } ] } ] } ]

		);

	});

	it("should wrap an element in a p and parse the children in inline mode, when there is no newline after the opening tag", function() {

		expect(parse("<span>! Not a heading</span>")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'element', tag: 'span', children: [ { type: 'text', text: '! Not a heading' } ], attributes: { }, start: 0, end: 6, isBlock: false } ] } ]

		);

	});

	it("should also do so, when a '\' directly after the opening tag escapes a directly following linebreak. It throws away the '\' and the linebreak", function() {

		expect(parse("<span>\\\n...</span>")).toEqual(parse("<span>...</span>"));

	});

	it("should not wrap an element in a p and parse the children in inline mode, when there is exactly one newline after the opening tag", function() {

		expect(parse("<div>\n! Not a heading\n</div>")).toEqual(

			[ { type: 'element', tag: 'div', children: [ { type: 'text', text: '\n! Not a heading\n' } ], attributes: { }, start: 0, end: 5, isBlock: true } ]

		);

	});

	it("should not wrap an element in a p and parse the children in block mode, when there are two or more newlines after the opening tag", function() {

		expect(parse("<div>\n\n! I am a heading\n\n</div>")).toEqual(

			[ { type: 'element', tag: 'div', children: [ { type: 'element', tag: 'h1', children: [ { type: 'text', text: 'I am a heading' } ], attributes: { class: { type: 'string', value: '' } } } ], attributes: { }, start: 0, end: 5, isBlock: true } ]

		);

		expect(parse("<div>\n\n...\n\n</div>")).toEqual(parse("<div>\n\n\n\n\n...\n\n\n\n\n</div>"));

	});

	it("should trim away those newlines from the start of pre and code elements, but keep indents and whitespace before and between text", function() {

		expect(parse("<pre>\nmy code</pre>")).toEqual(

			[ { type: 'element', tag: 'pre', children: [ { type: 'text', text: 'my code' } ], attributes: { }, start: 0, end: 5, isBlock: true } ]

		);

		expect(parse("<pre>\n    my indented code</pre>")).toEqual(

			[ { type: 'element', tag: 'pre', children: [ { type: 'text', text: '    my indented code' } ], attributes: { }, start: 0, end: 5, isBlock: true } ]

		);

		expect(parse("<pre>\n       my\n\n   //<span style='color:blue;'>blue italic</span>//\n\nindented       code\n</pre>")).toEqual(

			[ { type: 'element', tag: 'pre', children: [ { type: 'text', text: '       my\n\n   ' }, { type: 'element', tag: 'em', children: [ { type: 'element', tag: 'span', children: [ { type: 'text', text: 'blue italic' } ], attributes: { style: { name: 'style', type: 'string', value: 'color:blue;', start: 27, end: 47 } }, start: 22, end: 48, isBlock: false } ] }, { type: 'text', text: '\n\nindented       code\n' } ], attributes: { }, start: 0, end: 5, isBlock: true } ]

		);

		expect(parse("<code>my code wrapped in a p</code>")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'element', tag: 'code', children: [ { type: 'text', text: 'my code wrapped in a p' } ], attributes: { }, start: 0, end: 6, isBlock: false } ] } ]

		);

		expect(parse("<code>\nmy code</code>")).toEqual(

			[ { type: 'element', tag: 'code', children: [ { type: 'text', text: 'my code' } ], attributes: { }, start: 0, end: 6, isBlock: true } ]

		);

		expect(parse("<code>\n   sunset   at   the   beach   </code>")).toEqual(

			[ { type: 'element', tag: 'code', children: [ { type: 'text', text: '   sunset   at   the   beach   ' } ], attributes: { }, start: 0, end: 6, isBlock: true } ]

		);

	});

	it("should not wrap self closing or void elements in a p, when they stand alone in a line", function() {

		expect(parse("<button/>")).toEqual(

			[ { type: 'element', tag: 'button', attributes: { }, start: 0, end: 9, isBlock: true, isSelfClosing: true } ]

		);

		expect(parse("<img>")).toEqual(

			[ { type: 'element', tag: 'img', attributes: { }, start: 0, end: 5, isBlock: true } ]

		);

		// To have p wrapping, add the closing tag ...
		expect(parse("<button></button>")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'element', tag: 'button', children: [  ], attributes: { }, start: 0, end: 8, isBlock: false } ] } ]

		);

		// ... or append more inline content ...
		expect(parse("<button/> Hi")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'element', tag: 'button', attributes: { }, start: 0, end: 9, isBlock: false, isSelfClosing: true }, { type: 'text', text: ' Hi' } ] } ]

		);

		// ... or explicitely wrap in a p.
		expect(parse("<p>\n<button/>\n</p>")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'text', text: '\n' }, { type: 'element', tag: 'button', attributes: { }, start: 4, end: 13, isBlock: false, isSelfClosing: true }, { type: 'text', text: '\n' } ], attributes: { }, start: 0, end: 3, isBlock: true } ]

		);

	});

	it("should handle the end of input as if it was a line break, because editors or users may accidently add or trim those", function() {
	    // (Also applies to macro definitions)

		expect(parse("<img>")).toEqual(parse("<img>\n"));

		expect(parse("<button/>")).toEqual(parse("<button/>\n"));

		// Otherwise the last image in this example would be wrapped in a p
		expect(parse("<img>\n\n<img>\n\n<img>")).toEqual(

			[ { type: 'element', tag: 'img', attributes: { }, start: 0, end: 5, isBlock: true }, { type: 'element', tag: 'img', attributes: { }, start: 7, end: 12, isBlock: true }, { type: 'element', tag: 'img', attributes: { }, start: 14, end: 19, isBlock: true } ]

		);

	});

	it("should parse linebreaks", function() {

		expect(parse("<br>")).toEqual(

			[ { type: 'element', tag: 'br', attributes: { }, start: 0, end: 4, isBlock: true } ]

		);

		expect(parse("<br/>")).toEqual(

			[ { type: 'element', tag: 'br', attributes: { }, start: 0, end: 5, isBlock: true, isSelfClosing: true } ]

		);

		expect(parse("<br\\>")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'text', text: '<br\\>' } ] } ]

		);

		expect(parse("</br>")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'text', text: '</br>' } ] } ]

		);

	});

	it("should parse tags with attributes", function() {

		expect(parse("<div attribute>some text</div>")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'element', tag: 'div', isBlock: false, attributes: { attribute: { type: 'string', value: 'true', start: 4, end: 14, name: 'attribute' } }, children: [ { type: 'text', text: 'some text' } ], start: 0, end: 15 } ] } ]

		);

		expect(parse("<div attribute='value'>some text</div>")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'element', tag: 'div', isBlock: false, attributes: { attribute: { type: 'string', name: 'attribute', value: 'value', start: 4, end: 22 } }, children: [ { type: 'text', text: 'some text' } ], start: 0, end: 23 } ] } ]

		);

		expect(parse("<div attribute={{TiddlerTitle}}>some text</div>")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'element', tag: 'div', isBlock: false, attributes: { attribute: { type: 'indirect', name: 'attribute', textReference: 'TiddlerTitle', start: 4, end: 31 } }, children: [ { type: 'text', text: 'some text' } ], start: 0, end: 32 } ] } ]

		);

		expect(parse("<$reveal state='$:/temp/search' type='nomatch' text=''></$reveal>")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'reveal', tag: '$reveal', start: 0, attributes: { state: { start: 8, name: 'state', type: 'string', value: '$:/temp/search', end: 31 }, type: { start: 31, name: 'type', type: 'string', value: 'nomatch', end: 46 }, text: { start: 46, name: 'text', type: 'string', value: '', end: 54 } }, end: 55, isBlock: false, children: [  ] } ] } ]

		);

		expect(parse("<div attribute={{TiddlerTitle!!field}}>some text</div>")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'element', tag: 'div', isBlock: false, attributes: { attribute: { type: 'indirect', name: 'attribute', textReference: 'TiddlerTitle!!field', start: 4, end: 38 } }, children: [ { type: 'text', text: 'some text' } ], start: 0, end: 39 } ] } ]

		);

		expect(parse("<div attribute={{Tiddler Title!!field}}>some text</div>")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'element', tag: 'div', isBlock: false, attributes: { attribute: { type: 'indirect', name: 'attribute', textReference: 'Tiddler Title!!field', start: 4, end: 39 } }, children: [ { type: 'text', text: 'some text' } ], start: 0, end: 40 } ] } ]

		);

		expect(parse("<div attribute={{TiddlerTitle!!field}}>\n\nsome text</div>")).toEqual(

			[ { type: 'element', start: 0, attributes: { attribute: { start: 4, name: 'attribute', type: 'indirect', textReference: 'TiddlerTitle!!field', end: 38 } }, tag: 'div', end: 39, isBlock: true, children: [ { type: 'element', tag: 'p', children: [ { type: 'text', text: 'some text' } ] } ] } ]

		);

		expect(parse("<div><div attribute={{TiddlerTitle!!field}}>\n\nsome text</div></div>")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'element', start: 0, attributes: { }, tag: 'div', end: 5, isBlock: false, children: [ { type: 'element', start: 5, attributes: { attribute: { start: 9, name: 'attribute', type: 'indirect', textReference: 'TiddlerTitle!!field', end: 43 } }, tag: 'div', end: 44, isBlock: true, children: [ { type: 'element', tag: 'p', children: [ { type: 'text', text: 'some text' } ] } ] } ] } ] } ]

		);

		expect(parse("<div><div attribute={{TiddlerTitle!!field}}>\n\n!some heading</div></div>")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'element', start: 0, attributes: { }, tag: 'div', end: 5, isBlock: false, children: [ { type: 'element', start: 5, attributes: { attribute: { start: 9, name: 'attribute', type: 'indirect', textReference: 'TiddlerTitle!!field', end: 43 } }, tag: 'div', end: 44, isBlock: true, children: [ { type: 'element', tag: 'h1', attributes: { class: { type: 'string', value: '' } }, children: [ { type: 'text', text: 'some heading</div></div>' } ] } ] } ] } ] } ]

		);

		expect(parse("<div><div attribute={{TiddlerTitle!!field}}>\n!some heading</div></div>")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'element', start: 0, attributes: { }, tag: 'div', end: 5, isBlock: false, children: [ { type: 'element', start: 5, attributes: { attribute: { start: 9, name: 'attribute', type: 'indirect', textReference: 'TiddlerTitle!!field', end: 43 } }, tag: 'div', end: 44, isBlock: false, children: [ { type: 'text', text: '\n!some heading' } ] } ] } ] } ]

		);

	});

	it("should pass the Regression test for issue (#3306)", function() {

		// For the records, this is invalid html, as a p should not be a child element of a p or a span.
		// Valid would be e.g. <div>\n<div>\n<div>\n\nSome text</div>\n</div>\n</div>
		expect(parse("<div><span><span>\n\nSome text</span></span></div>")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'element', start: 0, attributes: { }, tag: 'div', end: 5, isBlock: false, children: [ { type: 'element', start: 5, attributes: { }, tag: 'span', end: 11, isBlock: false, children: [ { type: 'element', start: 11, attributes: { }, tag: 'span', end: 17, isBlock: true, children: [ { type: 'element', tag: 'p', children: [ { type: 'text', text: 'Some text' } ] } ] } ] } ] } ] } ]

		);

	});

	it("should parse macro definitions", function() {

		expect(parse("\\define myMacro()\nnothing\n\\end\n")).toEqual(

			[ { type: 'set', attributes: { name: { type: 'string', value: 'myMacro' }, value: { type: 'string', value: 'nothing' } }, children: [  ], params: [  ], isMacroDefinition: true } ]

		);

	});

	it("should parse comment in pragma area. Comment will be INVISIBLE", function() {

		expect(parse("<!-- comment in pragma area -->\n\\define aMacro()\nnothing\n\\end\n")).toEqual(

			[ { type: 'set', attributes: { name: { type: 'string', value: 'aMacro' }, value: { type: 'string', value: 'nothing' } }, children: [  ], params: [  ], isMacroDefinition: true } ]

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

			[ { type: 'element', tag: 'p', children: [ { type: 'entity', entity: '&mdash;' }, { type: 'text', text: 'Not a rule' } ] }, { type: 'element', tag: 'hr' }, { type: 'element', tag: 'p', children: [ { type: 'text', text: 'Between' } ] }, { type: 'element', tag: 'hr' } ]

		);

	});

	it("should parse hard linebreak areas", function() {

		expect(parse("\"\"\"Something\nin the\nway she moves\n\"\"\"\n\n")).toEqual(

			[ { type: 'element', tag: 'p', children: [ { type: 'text', text: 'Something' }, { type: 'element', tag: 'br' }, { type: 'text', text: 'in the' }, { type: 'element', tag: 'br' }, { type: 'text', text: 'way she moves' }, { type: 'element', tag: 'br' } ] } ]

		);

	});

});

})();
