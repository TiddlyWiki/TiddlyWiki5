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
	const results = [];
	if(prefix === "!") {
		source((tiddler,title) => {
			if(!options.wiki.isShadowTiddler(title)) {
				results.push(title);
			}
		});
	} else {
		source((tiddler,title) => {
			if(options.wiki.isShadowTiddler(title)) {
				results.push(title);
			}
		});
	}
	return results;
};
