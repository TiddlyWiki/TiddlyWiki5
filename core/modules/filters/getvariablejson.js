/*\
title: $:/core/modules/filters/getvariablejson.js
type: application/javascript
module-type: filteroperator

Filter operator for replacing input values by the value of the variable with the same name, or blank if the variable is missing

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.getvariablejson = function(source,operator,options) {
	var results = [],
		space = operator.operands[1] || null,
		replacerList = (operator.operands[2]) ? operator.operands[2].split(" ") : null,
		widget = options.widget;
	source(function(tiddler,title) {
		var variable = widget.getVariableInfo(title, {}),
		text = JSON.stringify(variable,replacerList,space);
		results.push(text || "");
	});
	return results;
};

})();
