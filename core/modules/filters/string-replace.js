/*\
title: $:/core/modules/filters/string-replace.js
type: application/javascript
module-type: filteroperator

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports["string-replace"] = function(source,operator,options) {
	var results = [];
	
	source(function(tiddler,title) {
		if(title && operator.operands && (operator.operands.length > 1)) {
			results.push(
				title.replace(operator.operands[0],operator.operands[1])
			);
		}
	});
	return results;
};

})();