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
			var shadowInfo = options.wiki.shadowTiddlers[title];
	 		if(shadowInfo) {
 				$tw.utils.pushTop(results,shadowInfo.source);
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
