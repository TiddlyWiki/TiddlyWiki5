/*\
title: $:/core/modules/filters/title.js
type: application/javascript
module-type: filteroperator

Filter operator for comparing title fields for equality

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.title = function(source,operator,options) {
	var results = [];
	// Function to check an individual title
	function checkTiddler(title) {
		var tiddler = options.wiki.getTiddler(title);
		if(tiddler) {
			var match = tiddler.fields[operator.operator] === operator.operand;
			if(operator.prefix === "!") {
				match = !match;
			}
			if(match) {
				results.push(title);
			}
		}
	};
	// Iterate through the source tiddlers
	if($tw.utils.isArray(source)) {
		$tw.utils.each(source,function(title) {
			checkTiddler(title);
		});
	} else {
		// If we're filtering a hashmap we change the behaviour to pass through missing tiddlers
		if(operator.prefix !== "!") {
			results.push(operator.operand);
		} else {
			$tw.utils.each(source,function(element,title) {
				if(title !== operator.operand) {
					checkTiddler(title);
				}
			});
		}
	}
	return results;
};

})();
