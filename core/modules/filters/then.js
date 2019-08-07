/*\
title: $:/core/modules/filters/then.js
type: application/javascript
module-type: filteroperator

Filter operator for replacing any titles with a constant

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.then = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push(operator.operand);
	});
	return results;
};

})();
