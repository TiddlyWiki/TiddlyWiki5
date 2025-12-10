/*\
title: $:/core/modules/filters/parsedate.js
type: application/javascript
module-type: filteroperator

Filter operator converting different date formats into TiddlyWiki's date format

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.parsedate = function(source,operator,options) {
	var parser = null;
	var format = operator.operand || "JS";
	switch (format) {
		case "JS":
			parser = $tw.utils.parseECMAScriptDate;
			break;
	}
	if(!(parser instanceof Function)) {
		return [$tw.language.getString("Error/ParseDateFilterOperator")];
	}

	var results = [];
	source(function(tiddler,title) {
		const date = parser(title);
		// Check that date is a Date instance _and_ that it contains a valid date
		if((date instanceof Date) && !isNaN(date.valueOf())) {
			results.push($tw.utils.stringifyDate(date));
		}
	});
	return results;
};

})();
