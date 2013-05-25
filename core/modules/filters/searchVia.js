/*\
title: $:/core/modules/filters/searchVia.js
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
exports.searchVia = function(source,operator,options) {
	var term = options.wiki.getTiddlerText(operator.operand,""),
		invert = operator.prefix === "!";
	return options.wiki.search(term,{
		titles: source,
		invert: invert,
		exclude: [operator.operand]
	});
};

})();
