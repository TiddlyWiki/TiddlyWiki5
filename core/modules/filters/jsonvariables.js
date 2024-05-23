/*\
title: $:/core/modules/filters/jsonvariables.js
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
exports.jsonvariables = function(source,operator,options) {
	var results = [],
		widget = options.widget;
	// "replacer" must be defined, otherwise JSON.stringify will throw a circular reference error RSOD
	// "replacer" does not contain: isCacheable
	var replacer= "params name value default resultList srcVariable text isFunctionDefinition isProcedureDefinition isWidgetDefinition isMacroDefinition".split(" ");
	source(function(tiddler,title) {
		var variable = widget.getVariableInfo(title, {}),
		text = JSON.stringify(variable,replacer);
		results.push(text || "");
	});
	return results;
};

})();
