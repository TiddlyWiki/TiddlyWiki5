/*\
title: $:/core/modules/filters/getvariablejson.js
type: application/javascript
module-type: filteroperator

Filter operator to get widget variable info and
Display as JSON with basic formatting

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
		widget = options.widget;
	// "replacer" must be defined, otherwise JSON.stringify will throw a circular reference error RSOD
	var replacer= "params name value default text isFunctionDefinition isProcedureDefinition isWidgetDefinition isMacroDefinition isVariable".split(" ");
	source(function(tiddler,title) {
		var text,
			out = {},
			info = widget.getVariableInfo(title, {});

		out.text = info.text;
		if (info.params) {
			// unify parameter elements
			out.params = info.params.map(function(param) {
				return {"name":param.name, "default": param.value || param.default || ""}
			});
		};
		if (info.srcVariable) {
			out.value = info.srcVariable.value;
			out.isFunctionDefinition = (info.srcVariable.isFunctionDefinition) ? "yes" : "no";
			out.isProcedureDefinition = (info.srcVariable.isProcedureDefinition) ? "yes" : "no";
			out.isWidgetDefinition = (info.srcVariable.isWidgetDefinition) ? "yes" : "no";
			out.isMacroDefinition = (info.srcVariable.isMacroDefinition) ? "yes" : "no";
			out.isVariable = (info.srcVariable.isFunctionDefinition ||
					info.srcVariable.isProcedureDefinition || 
					info.srcVariable.isWidgetDefinition ||
					info.srcVariable.isMacroDefinition) ? "no" : "yes";
		}
		text = JSON.stringify(out,replacer);
		results.push(text || "");
	});
	return results;
};
})();
