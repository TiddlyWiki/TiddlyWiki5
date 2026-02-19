/*\
title: $:/core/modules/filters/listed.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.listed = function(source,operator,options) {
	var field = operator.operand || "list",
		results = [];
	source(function(tiddler,title) {
		$tw.utils.pushTop(results,options.wiki.findListingsOfTiddler(title,field));
	});
	return results;
};
