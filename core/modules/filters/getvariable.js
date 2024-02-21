const { widget } = require("../widgets/widget");

/*\
title: $:/core/modules/filters/getvariable.js
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
exports.getvariable = function(source,operator,options) {
	var results = [],
		operand = operator.operand,
		widget = options.widget;
	source(function(tiddler,title) {
		var variable = widget.getVariableInfo(title, {}),
			text = (operand === "value") ? variable.srcVariable.value : variable.text;
		results.push(text || "");
	});
	return results;
};

})();
