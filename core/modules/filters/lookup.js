/*\
title: $:/core/modules/filters/lookup.js
type: application/javascript
module-type: filteroperator

Filter operator that looks up values via a title prefix

[lookup:<field>[<prefix>]]

Prepends the prefix to the selected items and returns the specified field value

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.lookup = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push(options.wiki.getTiddlerText(operator.operand + title) || operator.suffix || '');
	});
	return results;
};

})();
