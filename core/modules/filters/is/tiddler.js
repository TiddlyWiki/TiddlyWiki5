/*\
title: $:/core/modules/filters/is/tiddler.js
type: application/javascript
module-type: isfilteroperator
\*/

"use strict";

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
