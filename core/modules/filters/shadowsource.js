/*\
title: $:/core/modules/filters/shadowsource.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.shadowsource = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		var source = options.wiki.getShadowSource(title);
		if(source) {
			$tw.utils.pushTop(results,source);
		}
	});
	results.sort();
	return results;
};
