/*\
title: $:/core/modules/filters/parsedate.js
type: application/javascript
module-type: filteroperator

Filter operator converting different date formats into TiddlyWiki's date format

\*/

"use strict";

const INTEGER_INPUT_REGEX = /^-?\d+$/;
const LOOSE_DATE_CLEANUP_REGEX = /(\d+)(st|nd|rd|th)|,/gi;
const INPUT_FORMATS = new Set(["JS","TW","UNIXTIME","NUMBER","AUTO"]);

const isValidDate = (date) => date instanceof Date && !isNaN(date.valueOf());

const sanitizeLooseDateInput = (input) => input.replace(LOOSE_DATE_CLEANUP_REGEX,(match,numeric) => numeric || "");

const parseInputDate = (title, inputFormat) => {
	let sanitizedTitle;
	switch(inputFormat) {
		case "JS":
			return $tw.utils.parseECMAScriptDate(title);
		case "TW":
			return $tw.utils.parseDate(title);
		case "UNIXTIME":
		case "NUMBER":
			if(INTEGER_INPUT_REGEX.test(title)) {
				return new Date(Number(title));
			}
			sanitizedTitle = sanitizeLooseDateInput(title);
			if(INTEGER_INPUT_REGEX.test(sanitizedTitle)) {
				return new Date(Number(sanitizedTitle));
			}
			return null;
		case "AUTO": {
			// Try ECMAScript/ISO date format first
			const parsedDate = $tw.utils.parseECMAScriptDate(title);
			if(isValidDate(parsedDate)) {
				return parsedDate;
			}
			// Sanitize loose date text (strips ordinal suffixes and commas),
			// then treat pure-integer result as unix timestamp, otherwise
			// fall back to native Date parsing
			sanitizedTitle = sanitizeLooseDateInput(title);
			if(INTEGER_INPUT_REGEX.test(sanitizedTitle)) {
				return new Date(Number(sanitizedTitle));
			}
			return new Date(sanitizedTitle);
		}
		default:
			return null;
	}
};

/*
Export our filter function
*/
exports.parsedate = (source, operator) => {
	const inputFormat = (operator.operand || "JS").toUpperCase();
	if(!INPUT_FORMATS.has(inputFormat)) {
		return [$tw.language.getString("Error/ParseDateFilterOperator")];
	}
	const results = [];
	source((tiddler,title) => {
		const date = parseInputDate(title,inputFormat);
		if(isValidDate(date)) {
			results.push($tw.utils.stringifyDate(date));
		}
	});
	return results;
};
