/*\
title: test-fakedom.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the fakedom that Tiddlywiki occasionally uses.

\*/
"use strict";

describe("fakedom tests", function() {

	it("properly assigns nodeType based on DOM standards", function() {
		// According to MDN, ELEMENT_NODE == 1 && TEXT_NODE == 3
		// There are others, but currently they're not implemented in fakedom
		expect($tw.fakeDocument.createElement("div").nodeType).toBe(1);
		expect($tw.fakeDocument.createElement("div").ELEMENT_NODE).toBe(1);
		expect($tw.fakeDocument.createTextNode("text").nodeType).toBe(3);
		expect($tw.fakeDocument.createTextNode("text").TEXT_NODE).toBe(3);
	});

	// Real CSSStyleDeclaration returns undefined for Symbol property keys.
	// Without a guard, the TW_Style Proxy throws on Symbol access. This bites
	// in practice when Jasmine pretty-prints fakedom elements on failure.
	// See related TODO in test-select-widget.js
	it("returns undefined for Symbol property access on element.style", function() {
		var el = $tw.fakeDocument.createElement("div");
		expect(function() { return el.style[Symbol.toPrimitive]; }).not.toThrow();
		expect(el.style[Symbol.toPrimitive]).toBeUndefined();
		expect(function() { el.style[Symbol.iterator] = "x"; }).not.toThrow();
	});
});
