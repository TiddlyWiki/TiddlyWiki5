/*\
title: test-popup.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests some utility function of the Popup prototype.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("Popup tests", function() {

	it("parseCoordinates should parse valid coordinates", function() {
		var popup = require("$:/core/modules/utils/dom/popup.js");

		expect(popup.parseCoordinates("(1,2,3,4)")).toEqual({absolute: false, left: 1, top: 2, width: 3, height: 4});
		expect(popup.parseCoordinates("(1.5,2.6,3.7,4.8)")).toEqual({absolute: false, left: 1.5, top: 2.6, width: 3.7, height: 4.8});
		expect(popup.parseCoordinates("@(1,2,3,4)")).toEqual({absolute: true, left: 1, top: 2, width: 3, height: 4});
		expect(popup.parseCoordinates("@(1.5,2.6,3.7,4.8)")).toEqual({absolute: true, left: 1.5, top: 2.6, width: 3.7, height: 4.8});
	});

	it("parseCoordinates should not parse invalid coordinates", function() {
		var popup = require("$:/core/modules/utils/dom/popup.js");

		expect(popup.parseCoordinates("#(1,2,3,4)")).toEqual(false);
		expect(popup.parseCoordinates("(1,2,3,4")).toEqual(false);
		expect(popup.parseCoordinates("(1,2,3)")).toEqual(false);
	});

	it("buildCoordinates should create valid coordinates", function() {
		var popup = require("$:/core/modules/utils/dom/popup.js");

		var coordinates = {
			left: 1.5,
			top: 2.6,
			width: 3.7,
			height: 4.8
		};

		expect(popup.buildCoordinates(popup.coordinatePrefix.csOffsetParent, coordinates)).toEqual("(1.5,2.6,3.7,4.8)");
		expect(popup.buildCoordinates(popup.coordinatePrefix.csAbsolute, coordinates)).toEqual("@(1.5,2.6,3.7,4.8)");
	});

	it("buildCoordinates should detect invalid input", function() {
		var popup = require("$:/core/modules/utils/dom/popup.js");

		var coordinates = {
			left: "invalid",
			top: 2.6,
			width: 3.7,
			height: 4.8
		};

		expect(popup.buildCoordinates(popup.coordinatePrefix.csOffsetParent, coordinates)).toEqual("(0,0,0,0)");
		expect(popup.buildCoordinates("dummy", coordinates)).toEqual("(0,0,0,0)");
	});
});

})();
