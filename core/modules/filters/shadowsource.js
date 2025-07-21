/*\
title: $:/core/modules/filters/shadowsource.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the source plugins for shadow tiddlers

\*/

"use strict";

/*
Export our filter function
*/
exports.shadowsource = function(source,operator,options) {
	const results = [];
	source((tiddler,title) => {
		const source = options.wiki.getShadowSource(title);
		if(source) {
			$tw.utils.pushTop(results,source);
		}
	});
	results.sort();
	return results;
};
