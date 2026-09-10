/*\
title: test-getattribute-filter.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the getattribute filter operator.

\*/

/* eslint-env node, browser, jasmine */
"use strict";

describe("getattribute filter tests", function() {

	var wiki = new $tw.Wiki();

	function test(text,filter) {
		return wiki.filterTiddlers(filter,$tw.rootWidget.makeFakeWidgetWithVariables({text: text}));
	}

	it("should retrieve attributes of a widget invocation", function() {
		expect(test("<$transclude $variable=\"colour\" name=\"foreground\"/>","[<text>getattribute[$variable]]")).toEqual(["colour"]);
		expect(test("<$transclude $variable=\"colour\" name=\"foreground\"/>","[<text>getattribute[name]]")).toEqual(["foreground"]);
		// Unquoted attribute values
		expect(test("<$transclude $variable=colour name=foreground/>","[<text>getattribute[name]]")).toEqual(["foreground"]);
		// The $macrocall widget uses $name rather than $variable
		expect(test("<$macrocall $name=\"colour\" name=\"foreground\"/>","[<text>getattribute[$name]]")).toEqual(["colour"]);
		// Attribute order is irrelevant
		expect(test("<$macrocall name=\"foreground\" $name=\"colour\"/>","[<text>getattribute[name]]")).toEqual(["foreground"]);
	});

	it("should retrieve attributes of an HTML element", function() {
		expect(test("<div class=\"tc-test\"/>","[<text>getattribute[class]]")).toEqual(["tc-test"]);
		expect(test("<div class=\"tc-test\">Hello</div>","[<text>getattribute[class]]")).toEqual(["tc-test"]);
	});

	it("should retrieve parameters of a macro invocation", function() {
		// Named parameters are retrieved by name
		expect(test("<<colour name:foreground>>","[<text>getattribute[name]]")).toEqual(["foreground"]);
		// Positional parameters are numbered from zero
		expect(test("<<colour foreground>>","[<text>getattribute[0]]")).toEqual(["foreground"]);
		expect(test("<<colour foreground background>>","[<text>getattribute[1]]")).toEqual(["background"]);
		// The macro name is available as $variable
		expect(test("<<colour foreground>>","[<text>getattribute[$variable]]")).toEqual(["colour"]);
		// Quoted parameters have their quotes removed
		expect(test("<<colour \"tiddler-title-foreground\">>","[<text>getattribute[0]]")).toEqual(["tiddler-title-foreground"]);
		expect(test("<<colour [[a b]]>>","[<text>getattribute[0]]")).toEqual(["a b"]);
	});

	it("should return the first of several attributes that is present", function() {
		expect(test("<<colour foreground>>","[<text>getattribute[name],[0]]")).toEqual(["foreground"]);
		expect(test("<<colour name:foreground>>","[<text>getattribute[name],[0]]")).toEqual(["foreground"]);
		expect(test("<$macrocall $name=\"colour\" name=\"foreground\"/>","[<text>getattribute[$variable],[$name]]")).toEqual(["colour"]);
	});

	it("should ignore whitespace surrounding the invocation", function() {
		expect(test("  <<colour foreground>>\n","[<text>getattribute[0]]")).toEqual(["foreground"]);
	});

	it("should produce no output for text that is not a single invocation", function() {
		expect(test("","[<text>getattribute[name]]")).toEqual([]);
		expect(test("#ff0000","[<text>getattribute[name]]")).toEqual([]);
		expect(test("[tf.colour[foreground]]","[<text>getattribute[name]]")).toEqual([]);
		// Text either side of the invocation
		expect(test("linear-gradient(<<colour a>>,<<colour b>>)","[<text>getattribute[0]]")).toEqual([]);
		expect(test("a <<colour foreground>>","[<text>getattribute[0]]")).toEqual([]);
		// Two invocations
		expect(test("<<colour a>><<colour b>>","[<text>getattribute[0]]")).toEqual([]);
	});

	it("should produce no output for an absent attribute", function() {
		expect(test("<<colour>>","[<text>getattribute[0]]")).toEqual([]);
		expect(test("<<colour foreground>>","[<text>getattribute[name]]")).toEqual([]);
	});

	it("should produce no output for attributes without a literal value", function() {
		// Filtered, indirect and macro attribute values cannot be resolved without evaluating the invocation
		expect(test("<$transclude $variable=\"colour\" name={{{ [[foreground]] }}}/>","[<text>getattribute[name]]")).toEqual([]);
		expect(test("<$transclude $variable=\"colour\" name={{SomeTiddler}}/>","[<text>getattribute[name]]")).toEqual([]);
		expect(test("<$transclude $variable=\"colour\" name=<<someMacro>>/>","[<text>getattribute[name]]")).toEqual([]);
		// The $variable attribute is still available
		expect(test("<$transclude $variable=\"colour\" name={{SomeTiddler}}/>","[<text>getattribute[$variable]]")).toEqual(["colour"]);
	});

	it("should process each input title in turn", function() {
		var results = wiki.filterTiddlers("[[<<colour foreground>>]] [[<<colour background>>]] [[#ff0000]] +[getattribute[0]]");
		expect(results).toEqual(["foreground","background"]);
	});

});
