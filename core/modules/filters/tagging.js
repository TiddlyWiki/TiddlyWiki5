/*\
title: $:/core/modules/filters/tagging.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.tagging = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		$tw.utils.pushTop(results,options.wiki.getTiddlersWithTag(title));
	});
	return results;
};
