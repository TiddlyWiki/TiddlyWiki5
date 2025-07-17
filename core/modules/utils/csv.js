/*\
title: $:/core/modules/utils/csv.js
type: application/javascript
module-type: utils

A barebones CSV parser

\*/

"use strict";

const QUOTE = '"';

const getCellInfo = function(text,start,length,SEPARATOR) {
	const isCellQuoted = text.charAt(start) === QUOTE;
	const cellStart = isCellQuoted ? start + 1 : start;

	if(text.charAt(i) === SEPARATOR) {
		return [cellStart,cellStart,false];
	}

	for(var i = cellStart;i < length;i++) {
		const cellCharacter = text.charAt(i);
		const isEOL = cellCharacter === "\n" || cellCharacter === "\r";

		if(isEOL && !isCellQuoted) {
			return [cellStart,i,false];

		} else if(cellCharacter === SEPARATOR && !isCellQuoted) {
			return [cellStart,i,false];

		} else if(cellCharacter === QUOTE && isCellQuoted) {
			const nextCharacter = i + 1 < length ? text.charAt(i + 1) : '';
			if(nextCharacter !== QUOTE) {
				return [cellStart,i,true];
			} else {
				i++;
			}
		}
	}

	return [cellStart,i,isCellQuoted];
};

exports.parseCsvString = function(text,options) {
	if(!text) {
		return [];
	}

	options = options || {};
	const SEPARATOR = options.separator || ",";
	const {length} = text;
	const rows = [];
	let nextRow = [];

	for(let i = 0;i < length;i++) {
		const cellInfo = getCellInfo(text,i,length,SEPARATOR);
		let cellText = text.substring(cellInfo[0],cellInfo[1]);
		if(cellInfo[2]) {
			cellText = cellText.replace(/""/g,'"');
			cellInfo[1]++;
		}
		nextRow.push(cellText);

		i = cellInfo[1];

		const character = text.charAt(i);
		var nextCharacter = i + 1 < length ? text.charAt(i + 1) : '';

		if(character === "\r" || character === "\n") {
			// Edge case for empty rows
			if(nextRow.length === 1 && nextRow[0] === '') {
				nextRow.length = 0;
			}
			rows.push(nextRow);
			nextRow = [];

			if(character === "\r") {
				var nextCharacter = i + 1 < length ? text.charAt(i + 1) : '';

				if(nextCharacter === "\n") {
					i++;
				}
			}
		}
	}

	// Special case if last cell in last row is an empty cell
	if(text.charAt(length - 1) === SEPARATOR) {
		nextRow.push("");
	}

	rows.push(nextRow);

	return rows;
};

/*
Parse a CSV string with a header row and return an array of hashmaps.
*/
exports.parseCsvStringWithHeader = function(text,options) {
	let csv = $tw.utils.parseCsvString(text,options);
	const headers = csv[0];

	csv = csv.slice(1);
	for(let i = 0;i < csv.length;i++) {
		const row = csv[i];
		const rowObject = Object.create(null);

		for(let columnIndex = 0;columnIndex < headers.length;columnIndex++) {
			const columnName = headers[columnIndex];
			if(columnName) {
				rowObject[columnName] = $tw.utils.trim(row[columnIndex] || "");
			}
		}
		csv[i] = rowObject;
	}
	return csv;
};
