/*\
title: $:/core/modules/filters/is/tiddler.js
type: application/javascript
module-type: isfilteroperator

Filter function for [is[tiddler]]

\*/

"use strict";

/*
Export our filter function
*/
exports.tiddler = function(source,prefix,options) {
	var results = [];
	if(prefix === "!") {
		source(function(tiddler,title) {
			if(!options.wiki.tiddlerExists(title)) {
				results.push(title);
			}
		});
	} else {
		source(function(tiddler,title) {
			if(options.wiki.tiddlerExists(title)) {
				results.push(title);
			}
		});
	}
	return results;
};
