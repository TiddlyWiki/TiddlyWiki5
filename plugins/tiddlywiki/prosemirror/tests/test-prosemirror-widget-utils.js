/*\
title: test-prosemirror-widget-utils.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests parseWidget and parseAttributes from widget-block/utils.js.
These utilities parse <<macro "args">> invocations from user input.

\*/

"use strict";

describe("ProseMirror parseWidget tests", () => {

	let parseWidget, parseAttributes;
	try {
		const utils = require("$:/plugins/tiddlywiki/prosemirror/widget-block/utils.js");
		parseWidget = utils.parseWidget;
		parseAttributes = utils.parseAttributes;
	} catch(e) {
		return;
	}

	// --- Basic macro detection ---

	it("should parse a simple macro without args", () => {
		const result = parseWidget("<<myMacro>>");
		expect(result).not.toBeNull();
		expect(result.widgetName).toBe("myMacro");
	});

	it("should parse a macro with leading/trailing whitespace", () => {
		const result = parseWidget("  <<myMacro>>  ");
		expect(result).not.toBeNull();
		expect(result.widgetName).toBe("myMacro");
	});

	it("should return null for non-macro text", () => {
		expect(parseWidget("just text")).toBeNull();
		expect(parseWidget("")).toBeNull();
		expect(parseWidget("<single-bracket>")).toBeNull();
	});

	// --- Macro name validation ---

	it("should parse a macro with hyphens in name", () => {
		const result = parseWidget("<<list-links>>");
		expect(result).not.toBeNull();
		expect(result.widgetName).toBe("list-links");
	});

	it("should parse a macro with underscores in name", () => {
		const result = parseWidget("<<my_macro>>");
		expect(result).not.toBeNull();
		expect(result.widgetName).toBe("my_macro");
	});

	// --- Positional arguments ---

	it("should parse a single quoted positional argument", () => {
		const result = parseWidget('<<myMacro "hello world">>');
		expect(result).not.toBeNull();
		expect(result.attributes["0"]).toBe("hello world");
	});

	it("should parse a single-quoted positional argument", () => {
		const result = parseWidget("<<myMacro 'hello world'>>");
		expect(result).not.toBeNull();
		expect(result.attributes["0"]).toBe("hello world");
	});

	// --- Named arguments ---

	it("should parse named key=value arguments", () => {
		const result = parseWidget('<<myMacro key:"value">>');
		expect(result).not.toBeNull();
		expect(result.attributes.key).toBe("value");
	});

	// --- Critical: >> inside quoted strings ---

	it("should handle >> inside double-quoted attribute values", () => {
		const input = '<<myMacro "value with >> inside">>';
		const result = parseWidget(input);
		expect(result).not.toBeNull();
		expect(result.widgetName).toBe("myMacro");
		expect(result.attributes["0"]).toBe("value with >> inside");
	});

	it("should handle >> inside single-quoted attribute values", () => {
		const input = "<<myMacro 'value with >> inside'>>";
		const result = parseWidget(input);
		expect(result).not.toBeNull();
		expect(result.widgetName).toBe("myMacro");
		expect(result.attributes["0"]).toBe("value with >> inside");
	});

	// --- Critical: nested << >> ---

	it("should handle nested macros in attribute (triple-quote delimited)", () => {
		const input = '<<myMacro """<<innerMacro>>""">>';
		const result = parseWidget(input);
		expect(result).not.toBeNull();
		expect(result.widgetName).toBe("myMacro");
	});

	// --- TiddlyWiki filter syntax in arguments ---

	it("should parse filter argument with square brackets", () => {
		const input = '<<list-links "[tag[task]sort[title]]">>';
		const result = parseWidget(input);
		expect(result).not.toBeNull();
		expect(result.widgetName).toBe("list-links");
		expect(result.attributes["0"]).toBe("[tag[task]sort[title]]");
	});

	// --- Complex real-world cases ---

	it("should parse macro with multiple arguments", () => {
		const input = '<<myMacro "arg1" key:"val2">>';
		const result = parseWidget(input);
		expect(result).not.toBeNull();
		expect(result.widgetName).toBe("myMacro");
		expect(result.attributes["0"]).toBe("arg1");
		expect(result.attributes.key).toBe("val2");
	});

	it("should parse a macro with colon-delimited named args", () => {
		const input = '<<image-picker actions:"<$action-sendmessage $message=\'test\'/>"  >>';
		const result = parseWidget(input);
		expect(result).not.toBeNull();
		expect(result.widgetName).toBe("image-picker");
	});

	// --- parseAttributes edge cases ---

	it("should parse empty attributes string", () => {
		const result = parseAttributes("");
		expect(Object.keys(result).length).toBe(0);
	});

	it("should parse null/undefined attributes", () => {
		const result = parseAttributes(null);
		expect(Object.keys(result).length).toBe(0);
	});

	it("should parse unquoted positional values", () => {
		const result = parseAttributes("hello");
		expect(result["0"]).toBe("hello");
	});
});
