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
		};
		return options.wiki.search(operator.operand,{
			source: source,
			invert: invert,
			field: operator.suffixes[0],
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
