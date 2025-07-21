/*\
title: $:/core/modules/filters/subtiddlerfields.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the names of the fields on the selected subtiddlers of the plugin named in the operand

\*/

"use strict";

/*
Export our filter function
*/
exports.subtiddlerfields = function(source,operator,options) {
	const results = [];
	source((tiddler,title) => {
		const subtiddler = options.wiki.getSubTiddler(operator.operand,title);
		if(subtiddler) {
			for(const fieldName in subtiddler.fields) {
				$tw.utils.pushTop(results,fieldName);
			}
		}
	});
	return results;
};
