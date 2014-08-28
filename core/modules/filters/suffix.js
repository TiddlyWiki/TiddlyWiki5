/*\
title: $:/core/modules/filters/suffix.js
type: application/javascript
module-type: filteroperator

Filter operator for checking if a title ends with a suffix

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.suffix = function(source,operator,options) {
	var results = [];
	if(operator.prefix === "!") {
		source(function(tiddler,title) {
			if(title.substr(-operator.operand.length).toLowerCase() !== operator.operand.toLowerCase()) {
				results.push(title);
			}
		});
	} else {
		source(function(tiddler,title) {
			if(title.substr(-operator.operand.length).toLowerCase() === operator.operand.toLowerCase()) {
				results.push(title);
			}
		});
	}
	return results;
};

})();
