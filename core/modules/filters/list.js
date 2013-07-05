/*\
title: $:/core/modules/filters/list.js
type: application/javascript
module-type: filteroperator

Filter operator returning the tiddlers whose title is listed in the operand tiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.list = function(source,operator,options) {
	var results = [],
		list = options.wiki.getTiddlerList(operator.operand);
	function checkTiddler(title) {
		var match = list.indexOf(title) !== -1;
		if(operator.prefix === "!") {
			match = !match;
		}
		if(match) {
			results.push(title);
		}
	}
	// Iterate through the source tiddlers
	if($tw.utils.isArray(source)) {
		$tw.utils.each(source,function(title) {
			checkTiddler(title);
		});
	} else {
		if(operator.prefix !== "!") {
			results = list;
		} else {
			$tw.utils.each(source,function(element,title) {
				checkTiddler(title);
			});
		}
	}
	return results;
};

})();
