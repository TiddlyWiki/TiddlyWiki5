/*\
title: $:/core/modules/filters/modulestring.js
type: application/javascript
module-type: filteroperator

Filter [[module-name]modulestring[en-gb]] retrieve a module strings in a particular language

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.modulestring = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		var s = $tw.modules.getModuleString(title,operator.operands[0] || "",operator.operands[1] || "");
		if(s !== null) {
			results.push(s);
		}
	});
	results.sort();
	return results;
};

})();
