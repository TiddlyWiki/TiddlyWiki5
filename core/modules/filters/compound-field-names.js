/*\
title: $:/core/modules/filters/compound-field-names.js
type: application/javascript
module-type: filteroperator

Returns the sub-entry titles of a compound tiddler in their original order.
If the tiddler has an inherit-compound field, template fields come first,
then any additional fields from the tiddler itself.

\*/

"use strict";

function extractFieldNames(text) {
	var names = [];
	if(!text) return names;
	var rawEntries = text.split(/\r?\n\+\r?\n/);
	for(var t = 0; t < rawEntries.length; t++) {
		var split = rawEntries[t].split(/\r?\n\r?\n/mg);
		if(split.length >= 1) {
			var entryFields = $tw.utils.parseFields(split[0]);
			if(entryFields.title && names.indexOf(entryFields.title) === -1) {
				names.push(entryFields.title);
			}
		}
	}
	return names;
}

exports["compound-field-names"] = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		if(tiddler && (tiddler.fields.type === "text/vnd.tiddlywiki-multiple" || tiddler.fields.type === "text/vnd.tiddlywiki-multiple+fields")) {
			// Get template field names first if inherit-compound is set
			if(tiddler.fields["inherit-compound"]) {
				var templateTiddler = options.wiki.getTiddler(tiddler.fields["inherit-compound"]);
				if(templateTiddler && templateTiddler.fields.text) {
					var templateNames = extractFieldNames(templateTiddler.fields.text);
					for(var i = 0; i < templateNames.length; i++) {
						if(results.indexOf(templateNames[i]) === -1) {
							results.push(templateNames[i]);
						}
					}
				}
			}
			// Then add any additional fields from the tiddler itself
			var tiddlerNames = extractFieldNames(tiddler.fields.text);
			for(var j = 0; j < tiddlerNames.length; j++) {
				if(results.indexOf(tiddlerNames[j]) === -1) {
					results.push(tiddlerNames[j]);
				}
			}
		}
	});
	return results;
};
