/*\
title: test-csv.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the CSV parser.

\*/

"use strict";

describe("CSV tests", function() {

	it("parses a simple table", function() {
		expect($tw.utils.parseCsvString("a,b,c\n1,2,3")).toEqual([["a","b","c"],["1","2","3"]]);
	});

	it("parses a table whose first cell reads empty", function() {
		expect($tw.utils.parseCsvString(",b,c\n1,2,3")).toEqual([["","b","c"],["1","2","3"]]);
	});

	it("parses an empty cell in the middle of a row", function() {
		expect($tw.utils.parseCsvString("a,,c")).toEqual([["a","","c"]]);
	});

	it("parses quoted cells", function() {
		expect($tw.utils.parseCsvString('a,"b,still b",c')).toEqual([["a","b,still b","c"]]);
	});

	it("parses a quoted cell holding an escaped quote", function() {
		expect($tw.utils.parseCsvString('a,"b ""quoted""",c')).toEqual([["a",'b "quoted"',"c"]]);
	});

	it("honours a custom separator", function() {
		expect($tw.utils.parseCsvString("a;b;c",{separator: ";"})).toEqual([["a","b","c"]]);
	});

	it("parses a table with a header row into hashmaps", function() {
		expect($tw.utils.parseCsvStringWithHeader("a,b\n1,2")).toEqual([{a: "1", b: "2"}]);
	});
});
