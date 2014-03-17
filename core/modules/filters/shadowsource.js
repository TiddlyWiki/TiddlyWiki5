/*\
title: $:/core/modules/filters/shadowsource.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the source plugins for shadow tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.shadowsource = function(source,operator,options) {
	var results = [],
		pushShadowSource = function(title) {
			var source = options.wiki.getShadowSource(title);
	 		if(source) {
 				$tw.utils.pushTop(results,source);
	 		}
		};
	// Iterate through the source tiddlers
	if($tw.utils.isArray(source)) {
		$tw.utils.each(source,function(title) {
			pushShadowSource(title);
		});
	} else {
		$tw.utils.each(source,function(element,title) {
			pushShadowSource(title);
		});
	}
	results.sort();
	return results;
};

})();
