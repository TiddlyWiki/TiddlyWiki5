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
	var tags = {};
	source(function(tiddler,title) {
		var t, length;
		if(tiddler && tiddler.fields.tags) {
			for(t=0, length=tiddler.fields.tags.length; t<length; t++) {
				tags[tiddler.fields.tags[t]] = true;
			}
		}
	});
	return Object.keys(tags);
};

})();
