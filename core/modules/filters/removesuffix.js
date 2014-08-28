/*\
title: $:/core/modules/filters/removesuffix.js
type: application/javascript
module-type: filteroperator

Filter operator for removing a suffix from each title in the list. Titles that do not end with the suffix are removed.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.removesuffix = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		if(title.substr(-operator.operand.length).toLowerCase() === operator.operand.toLowerCase()) {
			results.push(title.substr(operator.operand.length));
		}
	});
	return results;
};

})();
