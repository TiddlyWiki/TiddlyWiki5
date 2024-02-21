/*\
title: $:/core/modules/filters/variables.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the names of the active variables

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.variables = function(source,operator,options) {
	var operands = [];
	$tw.utils.each(operator.operands,function(operand,index){
		operands.push({
			name: (index + 1).toString(),
			value: operand
		});
	});
	var names = [],
		sort,
		widget = options.widget,
		included = (operands[0].value) ? operands[0].value : "var fn proc macro widget";

		// variableTemplate = (operands.length > 1 && operands[1]) ? operands[1].value : "$type$ $name$($params$) $firstLine$";

	switch(operator.suffix) {
		case "raw":
			sort = false;
			break;
		case "sort":  // the fallthrough is intentional. "sort" is default
		default:
			sort = true;
			break;
	}
	while(widget && !widget.hasOwnProperty("variables")) {
		widget = widget.parentWidget;
	}
	if(widget && widget.variables) {
		for(var variable in widget.variables) {
			var varInfo = widget.getVariableInfo(variable, {});

			// varInfo.name = variable;
			// variable = $tw.utils.formatVariableString(variableTemplate, varInfo);

			if ( ((included.indexOf("fn") !== -1) && varInfo.srcVariable.isFunctionDefinition ) ||
				((included.indexOf("proc") !== -1) && varInfo.srcVariable.isProcedureDefinition ) ||
				((included.indexOf("macro") !== -1) && varInfo.srcVariable.isMacroDefinition ) ||
				((included.indexOf("widget") !== -1) && varInfo.srcVariable.isWidgetDefinition ) )
			{
				names.push(variable);
			} else if ((included.indexOf("var") !== -1) && !varInfo.srcVariable.isFunctionDefinition && !varInfo.srcVariable.isProcedureDefinition && !varInfo.srcVariable.isMacroDefinition && !varInfo.srcVariable.isWidgetDefinition )
			{
				names.push(variable);
			}
		}
	}
	if (sort) {
		return names.sort();
	} else {
		return names;
	}
};

})();
