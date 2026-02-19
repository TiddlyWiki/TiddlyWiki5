/*\
title: $:/core/modules/filters/addprefix.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.addprefix = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push(operator.operand + title);
	});
	return results;
};
