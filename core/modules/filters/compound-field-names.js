/*\
title: $:/core/modules/filters/compound-field-names.js
type: application/javascript
module-type: filteroperator

Returns the sub-entry titles of a compound tiddler in their original order

\*/

"use strict";

exports["compound-field-names"] = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		if(tiddler && (tiddler.fields.type === "text/vnd.tiddlywiki-multiple" || tiddler.fields.type === "text/vnd.tiddlywiki-multiple+fields") && tiddler.fields.text) {
			var rawEntries = tiddler.fields.text.split(/\r?\n\+\r?\n/);
			for(var t = 0; t < rawEntries.length; t++) {
				var split = rawEntries[t].split(/\r?\n\r?\n/mg);
				if(split.length >= 1) {
					var entryFields = $tw.utils.parseFields(split[0]);
					if(entryFields.title && results.indexOf(entryFields.title) === -1) {
						results.push(entryFields.title);
					}
				}
			}
		}
	});
	return results;
};
