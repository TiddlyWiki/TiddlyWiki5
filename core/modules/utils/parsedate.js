/*\
title: $:/core/modules/utils/parsedate.js
type: application/javascript
module-type: utils

Extended date parsing for $tw.utils.parseDate().

\*/

"use strict";

// Preserve the boot implementation before this module replaces $tw.utils.parseDate
const parseTwDate = $tw.utils.parseDate;

// Parse https://tc39.es/ecma262/#sec-date-time-string-format
const dateValidator = new RegExp("^(\\d{4}(-\\d{2}){0,2})?((^|T)\\d{2}:\\d{2}(:\\d{2}(\\.\\d{3})?)?(Z|([+-]\\d{2}:\\d{2}))?)?$");
const INTEGER_INPUT_REGEX = /^-?\d+$/;
const LOOSE_DATE_CLEANUP_REGEX = /(\d+)(st|nd|rd|th)|,/gi;
// 8 / 12 / 14 / 17 digit TW date forms (optional leading minus for negative years)
const TW_DIGIT_DATE_REGEX = /^-?\d{8}(\d{4}(\d{2}(\d{3})?)?)?$/;

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

const parseECMAScriptDate = function(input) {
	if(dateValidator.test(input)) {
		return new Date(input);
	} else {
		return false;
	}
};

/*
Parse a date string. With no format argument, preserves the boot behaviour of
parsing native TiddlyWiki YYYYMMDDHHMMSSmmm strings (and passing through Date
values). An optional format argument selects other input formats: JS
(ECMAScript/ISO 8601), TW (native TiddlyWiki), UNIXTIME/NUMBER (signed integer
unix milliseconds), or AUTO (try JS, then plausible TW digit dates, then unix
milliseconds, then loose date parsing).
*/
exports.parseDate = function(value, format) {
	if(format === undefined || format === null || format === "") {
		return parseTwDate(value);
	}
	let sanitizedTitle;
	const inputFormat = String(format).toUpperCase();
	switch(inputFormat) {
		case "TW":
			return parseTwDate(value);
		case "JS":
			return parseECMAScriptDate(value);
		case "UNIXTIME":
		case "NUMBER":
			if(INTEGER_INPUT_REGEX.test(value)) {
				return new Date(Number(value));
			}
			sanitizedTitle = sanitizeLooseDateInput(value);
			if(INTEGER_INPUT_REGEX.test(sanitizedTitle)) {
				return new Date(Number(sanitizedTitle));
			}
			return null;
		case "AUTO": {
			if(typeof value !== "string") {
				return parseTwDate(value);
			}
			const parsedDate = parseECMAScriptDate(value);
			if(isValidDate(parsedDate)) {
				return parsedDate;
			}
			sanitizedTitle = sanitizeLooseDateInput(value);
			if(isPlausibleTwDigitDate(sanitizedTitle)) {
				const twParsedDate = parseTwDate(sanitizedTitle);
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
