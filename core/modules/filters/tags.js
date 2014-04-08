/*\
title: $:/core/modules/filters/tags.js
type: application/javascript
module-type: filteroperator

Filter operator returning all the tags of the selected tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.tags = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		if(tiddler && tiddler.fields.tags) {
			$tw.utils.pushTop(results,tiddler.fields.tags);
		}
	});
	return results;
};

})();
