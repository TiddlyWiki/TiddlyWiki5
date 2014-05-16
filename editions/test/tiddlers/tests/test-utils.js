/*\
title: test-utils.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests various utility functions.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("Utility tests", function() {

	it("should handle parsing a string array", function() {
		expect($tw.utils.parseStringArray("Tiddler8")).toEqual(["Tiddler8"]);
		expect($tw.utils.parseStringArray(" Tiddler8")).toEqual(["Tiddler8"]);
		expect($tw.utils.parseStringArray("Tiddler8 ")).toEqual(["Tiddler8"]);
		expect($tw.utils.parseStringArray("Tiddler8 two")).toEqual(["Tiddler8","two"]);
		expect($tw.utils.parseStringArray(" Tiddler8 two ")).toEqual(["Tiddler8","two"]);
		expect($tw.utils.parseStringArray(" Tidd\u00a0ler8 two ")).toEqual(["Tidd\u00a0ler8","two"]);
		expect($tw.utils.parseStringArray(" [[Tidd\u00a0ler8]] two ")).toEqual(["Tidd\u00a0ler8","two"]);
	});

});

})();
