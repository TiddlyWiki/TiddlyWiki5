/*\
title: $:/core/modules/filters/is/shadow.js
type: application/javascript
module-type: isfilteroperator
\*/

"use strict";

exports.shadow = function(source,prefix,options) {
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
