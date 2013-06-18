/*\
title: test-html-parser.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for the internal components of the HTML tag parser

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function FakeParser() {

}

$tw.utils.extend(FakeParser.prototype,require("$:/core/modules/parsers/wikiparser/rules/html.js"));

describe("HTML tag new parser tests", function() {

	var parser = new FakeParser();

	it("should parse whitespace", function() {
		expect(parser.parseWhiteSpace("p  ",0)).toEqual(
			null
		);
		expect(parser.parseWhiteSpace("p  ",1)).toEqual(
			{ type : 'whitespace', start : 1, end : 3 }
		);
	});

	it("should parse string tokens", function() {
		expect(parser.parseTokenString("p=  ",0,"=")).toEqual(
			null
		);
		expect(parser.parseTokenString("p=  ",1,"=")).toEqual(
			{ type : 'token', value : '=', start : 1, end : 2 }
		);
	});

	it("should parse regexp tokens", function() {
		expect(parser.parseTokenRegExp("p='  ",0,/(=(?:'|"))/)).toEqual(
			null
		);
		expect(parser.parseTokenRegExp("p='  ",1,/(=(?:'|"))/g).match[0]).toEqual(
			'=\''
		);
		expect(parser.parseTokenRegExp("p=blah  ",2,/([^\s>]+)/g).match[0]).toEqual(
			'blah'
		);
	});

	it("should parse string literals", function() {
		expect(parser.parseStringLiteral("p='blah'  ",0)).toEqual(
			null
		);
		expect(parser.parseStringLiteral("p='blah'  ",2)).toEqual(
			{ type : 'string', start : 2, value : 'blah', end : 8 }
		);
		expect(parser.parseStringLiteral("p=''  ",2)).toEqual(
			{ type : 'string', start : 2, value : '', end : 4 }
		);
		expect(parser.parseStringLiteral("p=\"blah'  ",2)).toEqual(
			null
		);
		expect(parser.parseStringLiteral("p=\"\"  ",2)).toEqual(
			{ type : 'string', start : 2, value : '', end : 4 }
		);
	});

	it("should parse macro parameters", function() {
		expect(parser.parseMacroParameter("me",0)).toEqual(
			{ type : 'macro-parameter', start : 0, value : 'me', end : 2 }
		);
		expect(parser.parseMacroParameter("me:one",0)).toEqual(
			{ type : 'macro-parameter', start : 0, value : 'one', name : 'me', end : 6 }
		);
		expect(parser.parseMacroParameter("me:'one two three'",0)).toEqual(
			{ type : 'macro-parameter', start : 0, value : 'one two three', name : 'me', end : 18 }
		);
		expect(parser.parseMacroParameter("'one two three'",0)).toEqual(
			{ type : 'macro-parameter', start : 0, value : 'one two three', end : 15 }
		);
		expect(parser.parseMacroParameter("me:[[one two three]]",0)).toEqual(
			{ type : 'macro-parameter', start : 0, value : 'one two three', name : 'me', end : 20 }
		);
		expect(parser.parseMacroParameter("[[one two three]]",0)).toEqual(
			{ type : 'macro-parameter', start : 0, value : 'one two three', end : 17 }
		);
		expect(parser.parseMacroParameter("myparam>",0)).toEqual(
			{ type : 'macro-parameter', start : 0, value : 'myparam', end : 7 }
		);
	});

	it("should parse macro invocations", function() {
		expect(parser.parseMacroInvocation("<<mymacro",0)).toEqual(
			null
		);
		expect(parser.parseMacroInvocation("<<mymacro>>",0)).toEqual(
			{ type : 'macrocall', start : 0, params : [  ], name : 'mymacro', end : 11 }
		);
		expect(parser.parseMacroInvocation("<<mymacro one two three>>",0)).toEqual(
			{ type : 'macrocall', start : 0, params : [ { type : 'macro-parameter', start : 9, value : 'one', end : 13 }, { type : 'macro-parameter', start : 13, value : 'two', end : 17 }, { type : 'macro-parameter', start : 17, value : 'three', end : 23 } ], name : 'mymacro', end : 25 }
		);
		expect(parser.parseMacroInvocation("<<mymacro p:one q:two three>>",0)).toEqual(
			{ type : 'macrocall', start : 0, params : [ { type : 'macro-parameter', start : 9, value : 'one', name : 'p', end : 15 }, { type : 'macro-parameter', start : 15, value : 'two', name : 'q', end : 21 }, { type : 'macro-parameter', start : 21, value : 'three', end : 27 } ], name : 'mymacro', end : 29 }
		);
		expect(parser.parseMacroInvocation("<<mymacro 'one two three'>>",0)).toEqual(
			{ type : 'macrocall', start : 0, params : [ { type : 'macro-parameter', start : 9, value : 'one two three', end : 25 } ], name : 'mymacro', end : 27 } 
		);
		expect(parser.parseMacroInvocation("<<mymacro r:'one two three'>>",0)).toEqual(
			{ type : 'macrocall', start : 0, params : [ { type : 'macro-parameter', start : 9, value : 'one two three', name : 'r', end : 27 } ], name : 'mymacro', end : 29 } 
		);
		expect(parser.parseMacroInvocation("<<myMacro one:two three:'four and five'>>",0)).toEqual(
			{ type : 'macrocall', start : 0, params : [ { type : 'macro-parameter', start : 9, value : 'two', name : 'one', end : 17 }, { type : 'macro-parameter', start : 17, value : 'four and five', name : 'three', end : 39 } ], name : 'myMacro', end : 41 } 
		);
	});

	it("should parse HTML attributes", function() {
		expect(parser.parseAttribute("p='blah'  ",1)).toEqual(
			null
		);
		expect(parser.parseAttribute("p='blah'  ",0)).toEqual(
			{ type : 'string', start : 0, name : 'p', value : 'blah', end : 8 }
		);
		expect(parser.parseAttribute("p=\"blah\"  ",0)).toEqual(
			{ type : 'string', start : 0, name : 'p', value : 'blah', end : 8 }
		);
		expect(parser.parseAttribute("p=blah  ",0)).toEqual(
			{ type : 'string', start : 0, name : 'p', value : 'blah', end : 6 }
		);
		expect(parser.parseAttribute("p =blah  ",0)).toEqual(
			{ type : 'string', start : 0, name : 'p', value : 'blah', end : 7 }
		);
		expect(parser.parseAttribute("p= blah  ",0)).toEqual(
			{ type : 'string', start : 0, name : 'p', value : 'blah', end : 7 }
		);
		expect(parser.parseAttribute("p = blah  ",0)).toEqual(
			{ type : 'string', start : 0, name : 'p', value : 'blah', end : 8 }
		);
		expect(parser.parseAttribute("p = >blah  ",0)).toEqual(
			{ type : 'string', value : 'true', start : 0, name : 'p', end : 4 }
		);
		expect(parser.parseAttribute(" attrib1>",0)).toEqual(
			{ type : 'string', value : 'true', start : 0, name : 'attrib1', end : 8 }
		);
	});

	it("should parse HTML tags", function() {
		expect(parser.parseTag("<mytag>",1)).toEqual(
			null
		);
		expect(parser.parseTag("</mytag>",0)).toEqual(
			null
		);
		expect(parser.parseTag("<mytag>",0)).toEqual(
			{ type : 'element', start : 0, attributes : [  ], tag : 'mytag', end : 7 }
		);
		expect(parser.parseTag("<mytag attrib1>",0)).toEqual(
			{ type : 'element', start : 0, attributes : { attrib1 : { type : 'string', value : 'true', start : 6, name : 'attrib1', end : 14 } }, tag : 'mytag', end : 15 }
		);
		expect(parser.parseTag("<mytag attrib1/>",0)).toEqual(
			{ type : 'element', start : 0, attributes : { attrib1 : { type : 'string', value : 'true', start : 6, name : 'attrib1', end : 14 } }, tag : 'mytag', isSelfClosing : true, end : 16 }
		);
		expect(parser.parseTag("<$view field=\"title\" format=\"link\"/>",0)).toEqual(
			{ type : 'element', start : 0, attributes : { field : { start : 6, name : 'field', type : 'string', value : 'title', end : 20 }, format : { start : 20, name : 'format', type : 'string', value : 'link', end : 34 } }, tag : '$view', isSelfClosing : true, end : 36 }
		);
		expect(parser.parseTag("<mytag attrib1='something'>",0)).toEqual(
			{ type : 'element', start : 0, attributes : { attrib1 : { type : 'string', start : 6, name : 'attrib1', value : 'something', end : 26 } }, tag : 'mytag', end : 27 }
		);
		expect(parser.parseTag("<$mytag attrib1='something' attrib2=else thing>",0)).toEqual(
			{ type : 'element', start : 0, attributes : { attrib1 : { type : 'string', start : 7, name : 'attrib1', value : 'something', end : 27 }, attrib2 : { type : 'string', start : 27, name : 'attrib2', value : 'else', end : 40 }, thing : { type : 'string', start : 40, name : 'thing', value : 'true', end : 46 } }, tag : '$mytag', end : 47 }
		);
		expect(parser.parseTag("< $mytag attrib1='something' attrib2=else thing>",0)).toEqual(
			null
		);
		expect(parser.parseTag("<$mytag attrib3=<<myMacro one:two three:'four and five'>>>",0)).toEqual(
			{ type : 'element', start : 0, attributes : { attrib3 : { type : 'macro', start : 7, name : 'attrib3', value : { type : 'macrocall', start : 16, params : [ { type : 'macro-parameter', start : 25, value : 'two', name : 'one', end : 33 }, { type : 'macro-parameter', start : 33, value : 'four and five', name : 'three', end : 55 } ], name : 'myMacro', end : 57 }, end : 57 } }, tag : '$mytag', end : 58 }
		);
		expect(parser.parseTag("<$mytag attrib1='something' attrib2=else thing attrib3=<<myMacro one:two three:'four and five'>>>",0)).toEqual(
			{ type : 'element', start : 0, attributes : { attrib1 : { type : 'string', start : 7, name : 'attrib1', value : 'something', end : 27 }, attrib2 : { type : 'string', start : 27, name : 'attrib2', value : 'else', end : 40 }, thing : { type : 'string', start : 40, name : 'thing', value : 'true', end : 47 }, attrib3 : { type : 'macro', start : 47, name : 'attrib3', value : { type : 'macrocall', start : 55, params : [ { type : 'macro-parameter', start : 64, value : 'two', name : 'one', end : 72 }, { type : 'macro-parameter', start : 72, value : 'four and five', name : 'three', end : 94 } ], name : 'myMacro', end : 96 }, end : 96 } }, tag : '$mytag', end : 97 }
		);
	});

	it("should find and parse HTML tags", function() {
		expect(parser.findNextTag("<something <mytag>",1)).toEqual(
			{ type : 'element', start : 11, attributes : {  }, tag : 'mytag', end : 18 }
		);
		expect(parser.findNextTag("something else </mytag>",0)).toEqual(
			null
		);
		expect(parser.findNextTag("<<some other stuff>> <mytag>",0)).toEqual(
			{ type : 'element', start : 1, attributes : { other : { type : 'string', value : 'true', start : 6, name : 'other', end : 13 }, stuff : { type : 'string', value : 'true', start : 13, name : 'stuff', end : 18 } }, tag : 'some', end : 19 }
		);
		expect(parser.findNextTag("<<some other stuff>> <mytag>",2)).toEqual(
			{ type : 'element', start : 21, attributes : {  }, tag : 'mytag', end : 28 }
		);
	});

});

describe("HTML tag parser tests", function() {

	// Create a wiki
	var wiki = new $tw.Wiki();

	// Define a parsing shortcut
	var parse = function(text) {
		return wiki.parseText("text/vnd.tiddlywiki",text).tree;
	};

	it("should parse unclosed tags", function() {
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

});

})();
