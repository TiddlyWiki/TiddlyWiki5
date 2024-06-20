/*\
title: test-fakedom.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the fakedom that Tiddlywiki occasionally uses.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
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
});

})();
