/*\
title: $:/core/modules/filters/prefix.js
type: application/javascript
module-type: filteroperator

Filter operator for checking if a title starts with a prefix

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.prefix = function(source,operator,options) {
	var results = [];
	if(operator.prefix === "!") {
		source(function(tiddler,title) {
			if(title.substr(0,operator.operand.length) !== operator.operand) {
				results.push(title);
			}
		});
	} else {
		source(function(tiddler,title) {
			if(title.substr(0,operator.operand.length) === operator.operand) {
				results.push(title);
			}
		});
	}
	return results;
};

})();
