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
			fieldList = operator.suffixes[0] || [],
			firstField = fieldList[0] || "", 
			firstChar = firstField.charAt(0),
			fields;
		if(firstChar === "-") {
			fields = [firstField.slice(1)].concat(fieldList.slice(1));
			excludeFields = true;
		} else if(fieldList[0] === "*"){
			fields = [];
			excludeFields = true;
		} else {
			fields = fieldList.slice(0);
		}
		return options.wiki.search(operator.operand,{
			source: source,
			invert: invert,
			field: fields,
			excludeField: excludeFields,
			some: hasFlag("some"),
			caseSensitive: hasFlag("casesensitive"),
			literal: hasFlag("literal"),
			whitespace: hasFlag("whitespace"),
			anchored: hasFlag("anchored"),
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
