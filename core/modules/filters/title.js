/*\
title: $:/core/modules/filters/title.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.title = function(source,operator,options) {
	var results = [];
	if(operator.prefix === "!") {
		source(function(tiddler,title) {
			var titleList = operator.multiValueOperands[0] || [];
			if(tiddler && titleList.indexOf(tiddler.fields.title) === -1) {
				results.push(title);
			}
		});
	} else {
		Array.prototype.push.apply(results,operator.multiValueOperands[0]);
	}
	return results;
};
