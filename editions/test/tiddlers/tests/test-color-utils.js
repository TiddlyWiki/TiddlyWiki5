/*\
title: test-color-utils.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the colour utilities.

\*/

/* eslint-env node, browser, jasmine */
"use strict";

describe("color-utils tests", function() {

	it("should parse CSS colours to 0-255 components", function() {
		expect($tw.utils.parseCSSColor("red")).toEqual([255,0,0,1]);
		expect($tw.utils.parseCSSColor("rgba(255,0,0,0.5)")).toEqual([255,0,0,0.5]);
		// Out of gamut components are clamped
		expect($tw.utils.parseCSSColor("color(display-p3 1 0 0)")).toEqual([255,0,0,1]);
		expect($tw.utils.parseCSSColor("notacolour")).toBe(null);
	});

	it("should parse CSS colours to color.js objects", function() {
		var c = $tw.utils.parseCSSColorObject("#5778d8");
		expect(c.alpha).toBe(1);
		expect($tw.utils.parseCSSColorObject("notacolour")).toBe(null);
	});

	it("should convert CSS colours to six digit hex values", function() {
		expect($tw.utils.convertCSSColorToRGBString("red")).toBe("#ff0000");
		expect($tw.utils.convertCSSColorToRGBString("#abc")).toBe("#aabbcc");
		// Alpha is discarded
		expect($tw.utils.convertCSSColorToRGBString("rgba(255,0,0,0.5)")).toBe("#ff0000");
		expect($tw.utils.convertCSSColorToRGBString("#aabbccdd")).toBe("#aabbcc");
		// Out of gamut colours are clamped
		expect($tw.utils.convertCSSColorToRGBString("color(display-p3 1 0 0)")).toBe("#ff0000");
		// Unparseable input falls back to black
		expect($tw.utils.convertCSSColorToRGBString("notacolour")).toBe("#000000");
	});

});
