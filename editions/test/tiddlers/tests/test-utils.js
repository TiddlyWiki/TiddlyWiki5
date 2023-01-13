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

	it("should handle parsing a date", function() {
		var pd = function(v) {
			return $tw.utils.parseDate(v).toUTCString();
		};
		expect(pd("20150428204930183")).toEqual("Tue, 28 Apr 2015 20:49:30 GMT");
		expect(pd("-20150428204930183")).toEqual("Sun, 28 Apr -2015 20:49:30 GMT");
		expect(pd("00730428204930183")).toEqual("Fri, 28 Apr 0073 20:49:30 GMT");
		expect(pd("-00730428204930183")).toEqual("Thu, 28 Apr -0073 20:49:30 GMT");
	});

	it("should handle base64 encoding emojis", function() {
		var booksEmoji = "📚";
		expect(booksEmoji).toBe(booksEmoji);
		// 📚 is U+1F4DA BOOKS, which is represented by surrogate pair 0xD83D 0xDCDA in Javascript
		expect(booksEmoji.length).toBe(2);
		expect(booksEmoji.charCodeAt(0)).toBe(55357); // 0xD83D
		expect(booksEmoji.charCodeAt(1)).toBe(56538); // 0xDCDA
		expect($tw.utils.base64Encode(booksEmoji)).not.toBe("7aC97bOa", "if base64 is 7aC97bOa then surrogate pairs were incorrectly treated as codepoints");
		expect($tw.utils.base64Encode(booksEmoji)).toBe("8J+Tmg==", "if surrogate pairs are correctly treated as a single code unit then base64 should be 8J+Tmg==");
		expect($tw.utils.base64Decode("8J+Tmg==")).toBe(booksEmoji);
		expect($tw.utils.base64Decode($tw.utils.base64Encode(booksEmoji))).toBe(booksEmoji, "should round-trip correctly");
	});

	it("should handle stringifying a string array", function() {
		var str = $tw.utils.stringifyList;
		expect(str([])).toEqual("");
		expect(str(["Tiddler8"])).toEqual("Tiddler8");
		expect(str(["Tiddler8  "])).toEqual("[[Tiddler8  ]]");
		expect(str(["A+B", "A-B", "A=B"])).toEqual("A+B A-B A=B");
		expect(str(["A B"])).toEqual("[[A B]]");
		// Starting special characters aren't treated specially,
		// even though this makes a list incompatible with a filter parser.
		expect(str(["+T", "-T", "~T", "=T", "$T"])).toEqual("+T -T ~T =T $T");
		expect(str(["A", "", "B"])).toEqual("A  B");
	});

	it("stringifyList shouldn't interfere with setting variables to negative numbers", function() {
		var wiki = new $tw.Wiki();
		wiki.addTiddler({title: "test", text: "<$set name=X filter='\"-7\"'>{{{ [<X>add[2]] }}}</$set>"});
		// X shouldn't be wrapped in brackets. If it is, math filters will treat it as zero.
		expect(wiki.renderTiddler("text/plain","test")).toBe("-5");
	});

	it("should handle formatting a date string", function() {
		var fds = $tw.utils.formatDateString,
			// nov is month: 10!
			d = new Date(2014,10,9,17,41,28,542);
		expect(fds(d,"{era:bce||ce}")).toBe("ce");
		expect(fds(d,"YYYY")).toBe("2014");
		expect(fds(d,"DDD DD MMM YYYY")).toBe("Sunday 9 November 2014");
		expect(fds(d,"ddd hh mm ssss")).toBe("Sun 17 41 2828");
		expect(fds(d,"MM0DD")).toBe("1109");
		expect(fds(d,"MM0\\D\\D")).toBe("110DD");
		expect(fds(d,"TIMESTAMP")).toBe(d.getTime().toString());
		const day = d.getUTCDate();
		const dayStr = ("" + day).padStart(2, '0');
		const hours = d.getUTCHours();
		const hoursStr = ("" + hours).padStart(2, '0');
		const expectedUtcStr = `201411${dayStr}${hoursStr}4128542`;
		expect(fds(d,"[UTC]YYYY0MM0DD0hh0mm0ssXXX")).toBe(expectedUtcStr);

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

		// Negative years
		d = new Date(-2014,10,9,17,41,28,542);
		expect(fds(d,"YYYY")).toBe("-2014");
		expect(fds(d,"aYYYY")).toBe("2014");
		expect(fds(d,"{era:bce||ce}")).toBe("bce");

		// Zero years
		d = new Date(0,10,9,17,41,28,542);
		d.setUTCFullYear(0); // See https://stackoverflow.com/a/5870822
		expect(fds(d,"YYYY")).toBe("0000");
		expect(fds(d,"aYYYY")).toBe("0000");
		expect(fds(d,"{era:bce|z|ce}")).toBe("z");
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

	it("should compare versions", function() {
		var cv = $tw.utils.compareVersions;
		expect(cv("v0.0.0","v0.0.0")).toEqual(0);
		expect(cv("0.0.0","v0.0.0")).toEqual(0);
		expect(cv("v0.0.0","0.0.0")).toEqual(0);
		expect(cv("v0.0.0","not a version")).toEqual(0);
		expect(cv("v0.0.0",undefined)).toEqual(0);
		expect(cv("not a version","v0.0.0")).toEqual(0);
		expect(cv(undefined,"v0.0.0")).toEqual(0);
		expect(cv("v1.0.0","v1.0.0")).toEqual(0);
		expect(cv("v1.0.0","1.0.0")).toEqual(0);

		expect(cv("v1.0.1",undefined)).toEqual(+1);
		expect(cv("v1.0.1","v1.0.0")).toEqual(+1);
		expect(cv("v1.1.1","v1.1.0")).toEqual(+1);
		expect(cv("v1.1.2","v1.1.1")).toEqual(+1);
		expect(cv("1.1.2","v1.1.1")).toEqual(+1);

		expect(cv("v1.0.0","v1.0.1")).toEqual(-1);
		expect(cv("v1.1.0","v1.1.1")).toEqual(-1);
		expect(cv("v1.1.1","v1.1.2")).toEqual(-1);
		expect(cv("1.1.1","1.1.2")).toEqual(-1);
	});

	it("should insert strings into sorted arrays", function() {
		expect($tw.utils.insertSortedArray([],"a").join(",")).toEqual("a");
		expect($tw.utils.insertSortedArray(["b","c","d"],"a").join(",")).toEqual("a,b,c,d");
		expect($tw.utils.insertSortedArray(["b","c","d"],"d").join(",")).toEqual("b,c,d");
		expect($tw.utils.insertSortedArray(["b","c","d"],"f").join(",")).toEqual("b,c,d,f");
		expect($tw.utils.insertSortedArray(["b","c","d","e"],"f").join(",")).toEqual("b,c,d,e,f");
		expect($tw.utils.insertSortedArray(["b","c","g"],"f").join(",")).toEqual("b,c,f,g");
		expect($tw.utils.insertSortedArray(["b","c","d"],"ccc").join(",")).toEqual("b,c,ccc,d");
	});

});

})();
