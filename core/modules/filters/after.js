/*\
title: $:/core/modules/filters/after.js
type: application/javascript
module-type: filteroperator

Filter operator returning the tiddler from the current list that is after the tiddler named in the operand.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.after = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push(title);
	});
	var index = results.indexOf(operator.operand);
	if(index === -1 || index > (results.length - 2)) {
		return [];
	} else {
		return [results[index + 1]];
	}
};

})();
