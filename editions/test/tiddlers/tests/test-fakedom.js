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

	// Per DOM spec, tagName returns the HTML-uppercased qualified name for HTML
	// elements. Other namespaces preserve case.
	// https://dom.spec.whatwg.org/#dom-element-tagname
	var HTML_NS = "http://www.w3.org/1999/xhtml";
	var SVG_NS = "http://www.w3.org/2000/svg";

	it("tagName uppercases for HTML namespace", function() {
		// Default namespace is HTML
		expect($tw.fakeDocument.createElement("div").tagName).toBe("DIV");
		// The exact predicate the select widget relies on (#9839)
		expect($tw.fakeDocument.createElement("optgroup").tagName === "OPTGROUP").toBe(true);
		// Already-uppercase input stays uppercase
		expect($tw.fakeDocument.createElement("OPTGROUP").tagName).toBe("OPTGROUP");
		// Mixed-case input is normalised
		expect($tw.fakeDocument.createElement("Div").tagName).toBe("DIV");
		// Hyphenated custom-element names uppercase whole tag, hyphens survive
		expect($tw.fakeDocument.createElement("my-button").tagName).toBe("MY-BUTTON");
		// Empty tag returns empty string
		expect($tw.fakeDocument.createElement("").tagName).toBe("");
		// Explicit HTML namespace via createElementNS uppercases the same way
		expect($tw.fakeDocument.createElementNS(HTML_NS,"Div").tagName).toBe("DIV");
	});

	it("tagName preserves case for non-HTML namespaces", function() {
		// SVG: lowercase preserved
		expect($tw.fakeDocument.createElementNS(SVG_NS,"circle").tagName).toBe("circle");
		// SVG: camelCase preserved (linearGradient is the canonical example)
		expect($tw.fakeDocument.createElementNS(SVG_NS,"linearGradient").tagName).toBe("linearGradient");
		// SVG: already-uppercase input is also preserved (NOT lowercased)
		expect($tw.fakeDocument.createElementNS(SVG_NS,"DIV").tagName).toBe("DIV");
		// Empty namespace string is "no namespace", not HTML. Case preserved.
		expect($tw.fakeDocument.createElementNS("","div").tagName).toBe("div");
	});

	it("tagName reflects current state without mutating it", function() {
		// Reading tagName must not overwrite the internal `tag` field
		var el = $tw.fakeDocument.createElement("div");
		expect(el.tagName).toBe("DIV");
		expect(el.tag).toBe("div");
		// Idempotent: two reads return identical values
		var first = el.tagName, second = el.tagName;
		expect(first).toBe(second);
		// Dynamic namespace change is reflected. The getter must read current
		// state, not a value cached at construction time.
		var dynamic = $tw.fakeDocument.createElement("foo");
		expect(dynamic.tagName).toBe("FOO");
		dynamic.namespaceURI = SVG_NS;
		expect(dynamic.tagName).toBe("foo");
	});
});
