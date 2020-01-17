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

	it("should handle formatting a date string", function() {
		var fds = $tw.utils.formatDateString,
			// nov is month: 10!
			d = new Date(2014,10,9,17,41,28,542);
		expect(fds(d,"DDD DD MMM YYYY")).toBe("Sunday 9 November 2014");
		expect(fds(d,"ddd hh mm ssss")).toBe("Sun 17 41 2828");
		expect(fds(d,"MM0DD")).toBe("1109");
		expect(fds(d,"MM0\\D\\D")).toBe("110DD");

		// test some edge cases found at: https://en.wikipedia.org/wiki/ISO_week_date
		// 2016-11-13 is Week 45 and it's a Sunday (month nr: 10)
		d = new Date(2016,10,12,23,59,59);
		expect(fds(d,"WW")).toBe("45");
		d = new Date(2016,10,13,23,59,59,999);
		expect(fds(d,"WW")).toBe("45");
		d = new Date(2016,10,13,23,59,60);  // see 60 seconds. so it's week 46
		expect(fds(d,"WW")).toBe("46");

		// 2006 Dez. 31 is end of week 52 (month nr: 11)
		d = new Date(2006,11,31,23,59,59);
		expect(fds(d,"WW")).toBe("52");
		d = new Date(2006,11,31,23,59,60);
		expect(fds(d,"WW")).toBe("1");

		// 2010 Jan 03 is in week 53 (month nr: 0)
		d = new Date(2010,0,3,23,59,59);
		expect(fds(d,"WW")).toBe("53");
		d = new Date(2010,0,3,23,59,60);
		expect(fds(d,"WW")).toBe("1");

		// 2014 12 29 is in week 1 of 2015 (month nr. 11)
		d = new Date(2014,11,29,23,59,59);
		expect(fds(d,"WW")).toBe("1");
		expect(fds(d,"wYYYY")).toBe("2015");
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
