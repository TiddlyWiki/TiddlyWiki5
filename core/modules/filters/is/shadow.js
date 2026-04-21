/*\
title: $:/core/modules/filters/is/shadow.js
type: application/javascript
module-type: isfilteroperator

Filter function for [is[shadow]]

\*/

"use strict";

/*
Export our filter function
*/
exports.shadow = function(source,prefix,options) {
	// Fast path: when source is wiki.each (all real tiddlers), use shadow title list
	if(source === options.wiki.each && prefix !== "!") {
		// Return real tiddlers that are also shadow tiddlers (overridden shadows)
		var results = [],
			shadowTitles = options.wiki.allShadowTitles();
		for(var i = 0, len = shadowTitles.length; i < len; i++) {
			if(options.wiki.tiddlerExists(shadowTitles[i])) {
				results.push(shadowTitles[i]);
			}
		}
		return results;
	}
	var results = [];
	if(prefix === "!") {
		source(function(tiddler,title) {
			if(!options.wiki.isShadowTiddler(title)) {
				results.push(title);
			}
		});
	} else {
		source(function(tiddler,title) {
			if(options.wiki.isShadowTiddler(title)) {
				results.push(title);
			}
		});
	}
	return results;
};
