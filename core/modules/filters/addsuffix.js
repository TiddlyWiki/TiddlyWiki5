/*\
title: $:/core/modules/filters/addsuffix.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.addsuffix = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push(title + operator.operand);
	});
	return results;
};
