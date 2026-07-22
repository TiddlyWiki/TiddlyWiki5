/*\
title: $:/core/modules/filters/compound-field-type.js
type: application/javascript
module-type: filteroperator

Returns the type metadata of a sub-entry in a compound tiddler.
Falls back to the inherit-compound template if the tiddler doesn't define it.

\*/

"use strict";

function getEntryType(wiki,tiddler,fieldName) {
	var data = wiki.getTiddlerData(tiddler);
	if(data && $tw.utils.hop(data,fieldName)) {
		var entry = data[fieldName];
		if(entry !== null && typeof entry === "object" && $tw.utils.hop(entry,"type")) {
			return entry.type;
		}
	}
	return null;
}

exports["compound-field-type"] = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		if(tiddler && (tiddler.fields.type === "text/vnd.tiddlywiki-multiple" ||
			tiddler.fields.type === "text/vnd.tiddlywiki-multiple+fields"))
		{
			var type = getEntryType(options.wiki,tiddler,operator.operand);
			// Fall back to template
			if(!type && tiddler.fields["inherit-compound"]) {
				var templateTiddler = options.wiki.getTiddler(tiddler.fields["inherit-compound"]);
				if(templateTiddler) {
					type = getEntryType(options.wiki,templateTiddler,operator.operand);
				}
			}
			if(type) {
				results.push(type);
			}
		}
	});
	return results;
};
