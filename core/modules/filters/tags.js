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
LinkedList instead of Object. Should be as performant but allows us to have unsorted arrays.
*/
exports.tags = function(source,operator,options) {
	var results = new $tw.utils.LinkedList();
	source(function(tiddler,title) {
		var t, length;
		if(tiddler && tiddler.fields.tags) {
			for(t=0, length=tiddler.fields.tags.length; t<length; t++) {
				results.pushTop(tiddler.fields.tags[t])
			}
		}
	});
	// return results.makeTiddlerIterator(options.wiki);
	return results.toArray();
};

})();
