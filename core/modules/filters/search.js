/*\
title: $:/core/modules/filters/search.js
type: application/javascript
module-type: filteroperator

Filter operator for searching for the text in the operand tiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.search = function(source,operator,options) {
	var invert = operator.prefix === "!";
	if(operator.suffixes) {
		var hasFlag = function(flag) {
				return (operator.suffixes[1] || []).indexOf(flag) !== -1;
			},
			excludeFields = false,
			firstChar = operator.suffixes[0][0].charAt(0),
			fields;
		if(operator.suffixes[0][0].charAt(0) === "-") {
			fields = [operator.suffixes[0][0].slice(1)].concat(operator.suffixes[0].slice(1));
			excludeFields = true;
		} else if(operator.suffixes[0][0] === "*"){
			fields = [];
			excludeFields = true;
		} else {
			fields = operator.suffixes[0].slice(0);
		}
		return options.wiki.search(operator.operand,{
			source: source,
			invert: invert,
			field: fields,
			excludeField: excludeFields,
			caseSensitive: hasFlag("casesensitive"),
			literal: hasFlag("literal"),
			whitespace: hasFlag("whitespace"),
			regexp: hasFlag("regexp"),
			words: hasFlag("words")
		});
	} else {
		return options.wiki.search(operator.operand,{
			source: source,
			invert: invert
		});
	}
};

})();
