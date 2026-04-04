/*\
title: $:/core/modules/filters/compound-field-type.js
type: application/javascript
module-type: filteroperator

Returns the type metadata of a sub-entry in a text/vnd.tiddlywiki-fields tiddler

\*/

"use strict";

/*
Export our filter function
*/
exports["compound-field-type"] = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		if(tiddler && tiddler.fields.type === "text/vnd.tiddlywiki-fields") {
			var data = options.wiki.getTiddlerData(tiddler);
			if(data && operator.operand && $tw.utils.hop(data,operator.operand)) {
				var entry = data[operator.operand];
				if(entry !== null && typeof entry === "object" && $tw.utils.hop(entry,"type")) {
					results.push(entry.type);
				}
			}
		}
	});
	return results;
};
