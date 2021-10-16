/*\
title: $:/core/modules/utils/csv.js
type: application/javascript
module-type: utils

A barebones CSV parser

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Parse a CSV string with a header row and return an array of hashmaps.
*/
exports.parseCsvStringWithHeader = function(text,options) {
	options = options || {};
	var separator = options.separator || ",",
		rows = text.split(/\r?\n/mg).map(function(row) {
			return $tw.utils.trim(row);
		}).filter(function(row) {
			return row !== "";
		});
	if(rows.length < 1) {
		return "Missing header row";
	}
	var headings = rows[0].split(separator),
		results = [];
	for(var row=1; row<rows.length; row++) {
		var columns = rows[row].split(separator),
			columnResult = Object.create(null);
		if(columns.length !== headings.length) {
			return "Malformed CSV row '" + rows[row] + "'";
		}
		for(var column=0; column<columns.length; column++) {
			var columnName = headings[column];
			columnResult[columnName] = $tw.utils.trim(columns[column] || "");
		}
		results.push(columnResult);
	}
	return results;
}

})();
