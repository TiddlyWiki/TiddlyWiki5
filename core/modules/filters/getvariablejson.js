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
	// "replacer" does not contain: isCacheable
	var replacer= "params name value default text isFunctionDefinition isProcedureDefinition isWidgetDefinition isMacroDefinition".split(" ");
	source(function(tiddler,title) {
		var v = widget.getVariableInfo(title, {});
		var x = {};
		if (v.params && v.srcVariable) {
			x.params = v.params;
			x.text = v.text;
			x.value = v.srcVariable.value;
			x.isFunctionDefinition = v.srcVariable.isFunctionDefinition;
			x.isProcedureDefinition = v.srcVariable.isProcedureDefinition;
			x.isWidgetDefinition = v.srcVariable.isWidgetDefinition;
			x.isMacroDefinition = v.srcVariable.isMacroDefinition;
			var text = JSON.stringify(x,replacer);
		}
		results.push(text || "");
	});
	return results;
};

})();
