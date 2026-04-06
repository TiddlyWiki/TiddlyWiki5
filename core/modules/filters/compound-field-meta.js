/*\
title: $:/core/modules/filters/compound-field-meta.js
type: application/javascript
module-type: filteroperator

Returns a metadata property of a sub-entry in a compound tiddler.
Operand format: fieldName::propertyName (e.g. "role::roles")

\*/

"use strict";

exports["compound-field-meta"] = function(source,operator,options) {
	var results = [];
	var parts = (operator.operand || "").split("::");
	var fieldName = parts[0];
	var propertyName = parts[1];
	if(!fieldName || !propertyName) {
		return results;
	}
	source(function(tiddler,title) {
		if(tiddler && (tiddler.fields.type === "text/vnd.tiddlywiki-multiple" || tiddler.fields.type === "text/vnd.tiddlywiki-multiple+fields")) {
			var data = options.wiki.getTiddlerData(tiddler);
			if(data && $tw.utils.hop(data,fieldName)) {
				var entry = data[fieldName];
				if(entry !== null && typeof entry === "object" && $tw.utils.hop(entry,propertyName)) {
					results.push(entry[propertyName]);
				}
			}
		}
	});
	return results;
};
