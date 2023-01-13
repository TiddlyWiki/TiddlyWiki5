/*\
title: modules/utils/test-csv.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the backlinks mechanism.

\*/
(function(){
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe('CSV Parsing', function() {
	var tid = $tw.wiki.getTiddler('csv-cases');
	var testCases = JSON.parse(tid.fields.text);
	
	$tw.utils.each(testCases, function(testCase) {
		if (testCase.skip) {
			return;
		}
		it("Test case: " + testCase.name, function() {
			var parsedCsv = $tw.utils.parseCsvString(testCase.csv, testCase.options);
			expect(parsedCsv).withContext("The generated CSV should match the expected one").toEqual(testCase.json);
			
			var parsedCsvWithHeaders = $tw.utils.parseCsvStringWithHeader(testCase.csv, testCase.options);
			expect(parsedCsvWithHeaders).withContext("The generated CSV with headers should match the expected one").toEqual(testCase.jsonWithHeaders);
		});
	})
	
});

})();
