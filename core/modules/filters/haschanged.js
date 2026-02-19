/*\
title: $:/core/modules/filters/haschanged.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.haschanged = function(source,operator,options) {
	var results = [];
	if(operator.prefix === "!") {
		source(function(tiddler,title) {
			if(options.wiki.getChangeCount(title) === 0) {
				results.push(title);
			}
		});
	} else {
		source(function(tiddler,title) {
			if(options.wiki.getChangeCount(title) > 0) {
				results.push(title);
			}
		});
	}
	return results;
};
