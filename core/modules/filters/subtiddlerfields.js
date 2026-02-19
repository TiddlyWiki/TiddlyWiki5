/*\
title: $:/core/modules/filters/subtiddlerfields.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.subtiddlerfields = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		var subtiddler = options.wiki.getSubTiddler(operator.operand,title);
		if(subtiddler) {
			for(var fieldName in subtiddler.fields) {
				$tw.utils.pushTop(results,fieldName);
			}
		}
	});
	return results;
};
