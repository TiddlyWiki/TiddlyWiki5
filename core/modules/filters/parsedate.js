/*\
title: $:/core/modules/filters/parsedate.js
type: application/javascript
module-type: filteroperator

Filter operator converting different date formats into TiddlyWiki's date format

\*/
"use strict";

var DEFAULT_UTC_OUTPUT_FORMAT = "[UTC]YYYY0MM0DD0hh0mm0ss0XXX";
var DEFAULT_LOCAL_OUTPUT_FORMAT = "YYYY0MM0DD0hh0mm0ss0XXX";
var INTEGER_INPUT_REGEX = /^-?\d+$/;
var LOOSE_DATE_CLEANUP_REGEX = /(\d+)(st|nd|rd|th)|,/gi;

function isValidDate(date) {
	return (date instanceof Date) && !isNaN(date.valueOf());
}

function sanitizeLooseDateInput(input) {
	return input.replace(LOOSE_DATE_CLEANUP_REGEX,function(match,numeric) {
		return numeric || "";
	});
}

function parseInputDate(title,inputFormat) {
	var sanitizedTitle;
	switch(inputFormat) {
		case "JS":
			return $tw.utils.parseECMAScriptDate(title);
		case "TW":
			return $tw.utils.parseDate(title);
		case "UNIXTIME":
		case "NUMBER":
			sanitizedTitle = sanitizeLooseDateInput(title);
			if(INTEGER_INPUT_REGEX.test(sanitizedTitle)) {
				return new Date(Number(sanitizedTitle));
			}
			return new Date(sanitizedTitle);
		case "AUTO": {
			var parsedDate;
			if(INTEGER_INPUT_REGEX.test(title)) {
				return new Date(Number(title));
			}
			parsedDate = $tw.utils.parseECMAScriptDate(title);
			if(isValidDate(parsedDate)) {
				return parsedDate;
			}
			parsedDate = $tw.utils.parseDate(title);
			if(isValidDate(parsedDate)) {
				return parsedDate;
			}
			sanitizedTitle = sanitizeLooseDateInput(title);
			if(INTEGER_INPUT_REGEX.test(sanitizedTitle)) {
				return new Date(Number(sanitizedTitle));
			}
			return new Date(sanitizedTitle);
		}
		default:
			return null;
	}
}

function formatOutputDate(date,outputFormat) {
	var normalizedOutputFormat = (outputFormat || "").toUpperCase();
	if(normalizedOutputFormat === "" || normalizedOutputFormat === "UTC") {
		return $tw.utils.stringifyDate(date);
	}
	if(normalizedOutputFormat === "LOCAL") {
		return $tw.utils.formatDateString(date,DEFAULT_LOCAL_OUTPUT_FORMAT);
	}
	if(normalizedOutputFormat === "UNIXTIME" || normalizedOutputFormat === "NUMBER") {
		return date.getTime().toString();
	}
	return $tw.utils.formatDateString(date,outputFormat);
}

/*
Export our filter function
*/
exports.parsedate = function(source,operator) {
	var operands = operator.operands || [];
	var inputFormat = (operands[0] || operator.operand || "JS").toUpperCase();
	var outputFormat = operands[1] || operator.suffix || "";
	if(["JS","TW","UNIXTIME","NUMBER","AUTO"].indexOf(inputFormat) === -1) {
		return [$tw.language.getString("Error/ParseDateFilterOperator")];
	}

	var results = [];
	source(function(tiddler,title) {
		var date = parseInputDate(title,inputFormat);
		if(isValidDate(date)) {
			results.push(formatOutputDate(date,outputFormat));
		}
	});
	return results;
};
