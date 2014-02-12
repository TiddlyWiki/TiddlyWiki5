/*\
title: $:/core/modules/filters/field.js
type: application/javascript
module-type: filteroperator

Filter operator for comparing fields for equality

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.field = function(source,operator,options) {
	var results = [],
		fieldname = (operator.suffix || operator.operator).toLowerCase(),
		checkTitle = fieldname === "title";
	// Function to check an individual title
	function checkTiddler(title) {
		var tiddler = checkTitle ? title : options.wiki.getTiddler(title);
		if(tiddler) {
			var match,
				text = checkTitle ? title : tiddler.getFieldString(fieldname);
			if(operator.regexp) {
				match = !!operator.regexp.exec(text);
			} else {
				match = text === operator.operand;
			}
			if(operator.prefix === "!") {
				match = !match;
			}
			if(match) {
				results.push(title);
			}
		}
	}
	// Iterate through the source tiddlers
	if($tw.utils.isArray(source)) {
		$tw.utils.each(source,function(title) {
			checkTiddler(title);
		});
	} else {
		$tw.utils.each(source,function(element,title) {
			checkTiddler(title);
		});
	}
	return results;
};

})();
