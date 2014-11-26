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
		var psa = $tw.utils.parseStringArray;
		expect(psa("Tiddler8")).toEqual(["Tiddler8"]);
		expect(psa(" Tiddler8")).toEqual(["Tiddler8"]);
		expect(psa("Tiddler8 ")).toEqual(["Tiddler8"]);
		expect(psa("Tiddler8 two")).toEqual(["Tiddler8","two"]);
		expect(psa(" Tiddler8 two ")).toEqual(["Tiddler8","two"]);
		expect(psa(" Tidd\u00a0ler8 two ")).toEqual(["Tidd\u00a0ler8","two"]);
		expect(psa(" [[Tidd\u00a0ler8]] two ")).toEqual(["Tidd\u00a0ler8","two"]);
	});

	it("should parse text references", function() {
		var ptr = $tw.utils.parseTextReference;
		expect(ptr("title")).toEqual(
			{ title : 'title' }
		);
		expect(ptr("ti#tle")).toEqual(
			{ title : 'ti#tle' }
		);
		expect(ptr("ti!tle")).toEqual(
			{ title : 'ti!tle' }
		);
		expect(ptr("ti#tle##index")).toEqual(
			{ title : 'ti#tle', index : 'index' }
		);
		expect(ptr("ti!tle!!field")).toEqual(
			{ title : 'ti!tle', field : 'field' }
		);
		expect(ptr("title##index!!field")).toEqual(
			{ title : 'title##index', field : 'field' }
		);
		expect(ptr("title!!field##index")).toEqual(
			{ title : 'title', field : 'field##index' }
		);

	});

});

})();
