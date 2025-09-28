/*\
title: $:/core/modules/filters/format/variable.js
type: application/javascript
module-type: formatfilteroperator
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.variable = function(source,operand,options) {
	var results = [],
		widget = options.widget,
		variable,
		varInfo,
		variableTemplate = (operand.length >=6  && operand) ? operand : "$type$ $name$($params$) $firstLine$";

	source(function(tiddler,title) {
		varInfo = widget.getVariableInfo(title, {});
		varInfo.name = title;
		if(title && title.length) {
			variable = $tw.utils.formatVariableString(variableTemplate, varInfo);
			results.push(variable);
		}
	});
	return results;
};

})();
