/*\
title: $:/core/modules/filters/parsedate.js
type: application/javascript
module-type: filteroperator

Filter operator converting different date formats into TiddlyWiki's date format

\*/

"use strict";

const INTEGER_INPUT_REGEX = /^-?\d+$/;
const LOOSE_DATE_CLEANUP_REGEX = /(\d+)(st|nd|rd|th)|,/gi;
// 8 / 12 / 14 / 17 digit TW date forms (optional leading minus for negative years)
const TW_DIGIT_DATE_REGEX = /^-?\d{8}(\d{4}(\d{2}(\d{3})?)?)?$/;
const INPUT_FORMATS = new Set(["JS","TW","UNIXTIME","NUMBER","AUTO"]);

const isValidDate = (date) => Object.prototype.toString.call(date) === "[object Date]" && !isNaN(date.valueOf());

const sanitizeLooseDateInput = (input) => input.replace(LOOSE_DATE_CLEANUP_REGEX,(match,numeric) => numeric || "");

/*
Return true when a digit string looks like a TiddlyWiki date rather than a
unix timestamp. Lengths 8/12/14/17 match common TW forms; calendar field
bounds reject values that parseDate would otherwise accept via Date rollover
(which previously caused AUTO to mis-detect unix timestamps as TW dates).
*/
const isPlausibleTwDigitDate = (input) => {
	if(!TW_DIGIT_DATE_REGEX.test(input)) {
		return false;
	}
	const digits = input.charAt(0) === "-" ? input.slice(1) : input;
	const month = parseInt(digits.substr(4,2),10);
	const day = parseInt(digits.substr(6,2),10);
	if(month < 1 || month > 12 || day < 1 || day > 31) {
		return false;
	}
	if(digits.length >= 12) {
		const hour = parseInt(digits.substr(8,2),10);
		const minute = parseInt(digits.substr(10,2),10);
		if(hour > 23 || minute > 59) {
			return false;
		}
	}
	if(digits.length >= 14) {
		const second = parseInt(digits.substr(12,2),10);
		if(second > 59) {
			return false;
		}
	}
	return true;
};

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
			sanitizedTitle = sanitizeLooseDateInput(title);
			// Prefer plausible TW digit dates over unix milliseconds so that
			// 8/12/14/17-digit TW strings are not misread or dropped
			if(isPlausibleTwDigitDate(sanitizedTitle)) {
				const twParsedDate = $tw.utils.parseDate(sanitizedTitle);
				if(isValidDate(twParsedDate)) {
					return twParsedDate;
				}
			}
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
