/*\
title: $:/core/modules/filters/parsedate.js
type: application/javascript
module-type: filteroperator

Filter operator converting different date formats into TiddlyWiki's date format

\*/

"use strict";

const DEFAULT_LOCAL_OUTPUT_FORMAT = "YYYY0MM0DD0hh0mm0ss0XXX";
const INTEGER_INPUT_REGEX = /^-?\d+$/;
const LOOSE_DATE_CLEANUP_REGEX = /(\d+)(st|nd|rd|th)|,/gi;
const INPUT_FORMATS = new Set(["JS","TW","UNIXTIME","NUMBER","AUTO"]);
const NUMERIC_OUTPUT_FORMATS = new Set(["UNIXTIME","NUMBER"]);

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
			// Next, try native TiddlyWiki date parsing (eg, 17-digit TW timestamps)
			const twParsedDate = $tw.utils.parseDate(title);
			if(isValidDate(twParsedDate)) {
				return twParsedDate;
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

const formatOutputDate = (date, outputFormat) => {
	const normalizedOutputFormat = (outputFormat || "").toUpperCase();
	if(normalizedOutputFormat === "" || normalizedOutputFormat === "UTC") {
		return $tw.utils.stringifyDate(date);
	}
	if(normalizedOutputFormat === "LOCAL") {
		return $tw.utils.formatDateString(date,DEFAULT_LOCAL_OUTPUT_FORMAT);
	}
	if(NUMERIC_OUTPUT_FORMATS.has(normalizedOutputFormat)) {
		return date.getTime().toString();
	}
	return $tw.utils.formatDateString(date,outputFormat);
};

/*
Export our filter function
*/
exports.parsedate = (source, operator) => {
	const operands = operator.operands || [];
	const inputFormat = (operands[0] || operator.operand || "JS").toUpperCase();
	const outputFormat = operands[1] || operator.suffix || "";
	if(!INPUT_FORMATS.has(inputFormat)) {
		return [$tw.language.getString("Error/ParseDateFilterOperator")];
	}
	const results = [];
	source((tiddler,title) => {
		const date = parseInputDate(title,inputFormat);
		if(isValidDate(date)) {
			results.push(formatOutputDate(date,outputFormat));
		}
	});
	return results;
};
