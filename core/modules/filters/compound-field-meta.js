/*\
title: $:/core/modules/filters/compound-field-meta.js
type: application/javascript
module-type: filteroperator

Returns a metadata property of a sub-entry in a compound tiddler.
Operand format: fieldName::propertyName (e.g. "role::roles")
Falls back to the inherit-compound template if the tiddler doesn't define it.

\*/

"use strict";

function getEntryMeta(wiki,tiddler,fieldName,propertyName) {
	var data = wiki.getTiddlerData(tiddler);
	if(data && $tw.utils.hop(data,fieldName)) {
		var entry = data[fieldName];
		if(entry !== null && typeof entry === "object" && $tw.utils.hop(entry,propertyName)) {
			return entry[propertyName];
		}
	}
	return null;
}

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
			var value = getEntryMeta(options.wiki,tiddler,fieldName,propertyName);
			// Fall back to template
			if(value === null && tiddler.fields["inherit-compound"]) {
				var templateTiddler = options.wiki.getTiddler(tiddler.fields["inherit-compound"]);
				if(templateTiddler) {
					value = getEntryMeta(options.wiki,templateTiddler,fieldName,propertyName);
				}
			}
			if(value !== null) {
				results.push(value);
			}
		}
	});
	return results;
};
