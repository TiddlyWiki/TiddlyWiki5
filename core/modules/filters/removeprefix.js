/*\
title: $:/core/modules/filters/removeprefix.js
type: application/javascript
module-type: filteroperator

Filter operator for removing a prefix from each title in the list. Titles that do not start with the prefix are removed.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.removeprefix = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		if(title.substr(0,operator.operand.length).toLowerCase() === operator.operand.toLowerCase()) {
			results.push(title.substr(operator.operand.length));
		}
	});
	return results;
};

})();
