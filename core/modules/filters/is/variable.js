/*\
title: $:/core/modules/filters/is/variable.js
type: application/javascript
module-type: isfilteroperator
\*/

"use strict";

exports.variable = function(source,prefix,options) {
	var results = [];
	if(prefix === "!") {
		source(function(tiddler,title) {
			if(options.widget.getVariable(title) === undefined) {
				results.push(title);
			}
		});
	} else {
		source(function(tiddler,title) {
			if(options.widget.getVariable(title) !== undefined) {
				results.push(title);
			}
		});
	}
	return results;
};
