/*\
title: $:/core/modules/filters/is/system.js
type: application/javascript
module-type: isfilteroperator

Filter function for [is[system]]

\*/

"use strict";

/*
Export our filter function
*/
exports.system = function(source,prefix,options) {
	var results = [];
	if(prefix === "!") {
		source(function(tiddler,title) {
			if(!options.wiki.isSystemTiddler(title)) {
				results.push(title);
			}
		});
	} else {
		source(function(tiddler,title) {
			if(options.wiki.isSystemTiddler(title)) {
				results.push(title);
			}
		});
	}
	return results;
};
