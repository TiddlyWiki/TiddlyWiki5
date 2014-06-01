/*\
title: $:/core/modules/filters/get.js
type: application/javascript
module-type: filteroperator

Filter operator for replacing tiddler titles by the value of the field specified in the operand.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.get = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		if(tiddler) {
			var value = tiddler.getFieldString(operator.operand);
			if(value) {
				results.push(value);
			}
		}
	});
	return results;
};

})();
