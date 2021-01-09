/*\
title: $:/core/modules/filters/lookup.js
type: application/javascript
module-type: filteroperator

Filter operator that looks up values via a title prefix

[lookup:<field>[<prefix>]]

Prepends the prefix to the selected items and returns the specified field value

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.lookup = function(source,operator,options) {
	var results = [];
	if(operator.operands.length == 1) {
		source(function(tiddler,title) {
			results.push(options.wiki.getTiddlerText(operator.operand + title) || operator.suffix || '');
		});
	} else if (operator.operands.length == 2){
		var reference = operator.operands[1];
		if(!(reference.startsWith("!!") || reference.startsWith("##"))) {
			reference = "!!" + reference;
		}
		source(function(tiddler,title) {
			results.push(options.wiki.getTextReference(operator.operands[0] + title + reference) || operator.suffix || '');
		});
	}
	return results;
};

})();
