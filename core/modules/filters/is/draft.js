/*\
title: $:/core/modules/filters/is/draft.js
type: application/javascript
module-type: isfilteroperator
\*/

"use strict";

exports.draft = function(source,prefix,options) {
	var results = [];
	if(prefix === "!") {
		source(function(tiddler,title) {
			if(!tiddler || !tiddler.isDraft()) {
				results.push(title);
			}
		});
	} else {
		source(function(tiddler,title) {
			if(tiddler && tiddler.isDraft()) {
				results.push(title);
			}
		});
	}
	return results;
};
