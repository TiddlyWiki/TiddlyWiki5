/*\
title: $:/core/modules/filters/getvariable.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.getvariable = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push(options.widget.getVariable(title) || "");
	});
	return results;
};
