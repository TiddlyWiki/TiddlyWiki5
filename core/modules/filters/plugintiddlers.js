/*\
title: $:/core/modules/filters/plugintiddlers.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the titles of the shadow tiddlers within a plugin

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.plugintiddlers = function(source,operator,options) {
	var results = [],
		pushShadows;
	switch(operator.operand) {
		default:
		 	pushShadows = function(title) {
		 		var pluginInfo = options.wiki.pluginInfo[title];
		 		if(pluginInfo) {
		 			$tw.utils.each(pluginInfo.tiddlers,function(fields,title) {
		 				results.push(title);
		 			});
		 		}
			};
			break;
	}
	// Iterate through the source tiddlers
	if($tw.utils.isArray(source)) {
		$tw.utils.each(source,function(title) {
			pushShadows(title);
		});
	} else {
		$tw.utils.each(source,function(element,title) {
			pushShadows(title);
		});
	}
	results.sort();
	return results;
};

})();
