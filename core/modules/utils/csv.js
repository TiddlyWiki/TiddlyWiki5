/*\
title: $:/core/modules/utils/csv.js
type: application/javascript
module-type: utils

A barebones CSV parser

\*/

"use strict";

var QUOTE = '"';

var getCellInfo = function(text, start, length, SEPARATOR) {
	var isCellQuoted = text.charAt(start) === QUOTE;
	var cellStart = isCellQuoted ? start + 1 : start;
	
	if (text.charAt(i) === SEPARATOR) {
		return [cellStart, cellStart, false];
	}
	
	for (var i = cellStart; i < length; i++) {
		var cellCharacter = text.charAt(i);
		var isEOL = cellCharacter === "\n" || cellCharacter === "\r";
		
		if (isEOL && !isCellQuoted) {
			return [cellStart, i, false];
			
		} else if (cellCharacter === SEPARATOR && !isCellQuoted) {
			return [cellStart, i, false];
			
		} else if (cellCharacter === QUOTE && isCellQuoted) {
			var nextCharacter = i + 1 < length ? text.charAt(i + 1) : '';
			if (nextCharacter !== QUOTE) {
				return [cellStart, i, true];
			} else {
				i++;
			}
		}
	}
	
	return [cellStart, i, isCellQuoted];
}
	
exports.parseCsvString = function(text, options) {
	if (!text) {
		return [];
	}
	
	options = options || {};
	var SEPARATOR = options.separator || ",",
		length = text.length,
		rows = [],
		nextRow = [];
		
	for (var i = 0; i < length; i++) {
		var cellInfo = getCellInfo(text, i, length, SEPARATOR);
		var cellText = text.substring(cellInfo[0], cellInfo[1]);
		if (cellInfo[2]) {
			cellText = cellText.replace(/""/g, '"');
			cellInfo[1]++;
		}
		nextRow.push(cellText);
		
		i = cellInfo[1];
		
		var character = text.charAt(i);
		var nextCharacter = i + 1 < length ? text.charAt(i + 1) : '';
		
		if (character === "\r" || character === "\n") {
			// Edge case for empty rows
			if (nextRow.length === 1 && nextRow[0] === '') {
				nextRow.length = 0;
			}
			rows.push(nextRow);
			nextRow = [];
			
			if (character === "\r") {
				var nextCharacter = i + 1 < length ? text.charAt(i + 1) : '';
				
				if (nextCharacter === "\n") {
					i++;
				}
			}
		}
	}
	
	// Special case if last cell in last row is an empty cell
	if (text.charAt(length - 1) === SEPARATOR) {
		nextRow.push("");
	}
	
	rows.push(nextRow);
	
	return rows;
}

/*
Parse a CSV string with a header row and return an array of hashmaps.
*/
exports.parseCsvStringWithHeader = function(text,options) {
	var csv = $tw.utils.parseCsvString(text, options);
	var headers = csv[0];
	
	csv = csv.slice(1);
	for (var i = 0; i < csv.length; i++) {
		var row = csv[i];
		var rowObject = Object.create(null);

		for(var columnIndex=0; columnIndex<headers.length; columnIndex++) {
			var columnName = headers[columnIndex];
			if (columnName) {
				rowObject[columnName] = $tw.utils.trim(row[columnIndex] || "");
			}
		}
		csv[i] = rowObject;
	}
	return csv;
}
