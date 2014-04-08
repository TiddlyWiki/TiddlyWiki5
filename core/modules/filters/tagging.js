/*\
title: $:/core/modules/filters/tagging.js
type: application/javascript
module-type: filteroperator

Filter operator returning all tiddlers that are tagged with the selected tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.tagging = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		$tw.utils.pushTop(results,options.wiki.getTiddlersWithTag(title));
	});
	return results;
};

})();
