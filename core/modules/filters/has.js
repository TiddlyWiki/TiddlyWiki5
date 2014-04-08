/*\
title: $:/core/modules/filters/has.js
type: application/javascript
module-type: filteroperator

Filter operator for checking if a tiddler has the specified field

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.has = function(source,operator,options) {
	var results = [];
	if(operator.prefix === "!") {
		source(function(tiddler,title) {
			if(tiddler && (!$tw.utils.hop(tiddler.fields,operator.operand) || tiddler.fields[operator.operand] === "")) {
				results.push(title);
			}
		});
	} else {
		source(function(tiddler,title) {
			if(tiddler && $tw.utils.hop(tiddler.fields,operator.operand) && tiddler.fields[operator.operand] !== "") {
				results.push(title);
			}
		});
	}
	return results;
};

})();
