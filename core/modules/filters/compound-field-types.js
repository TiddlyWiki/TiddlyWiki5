/*\
title: $:/core/modules/filters/compound-field-types.js
type: application/javascript
module-type: filteroperator

Returns all unique sub-entry types from a compound tiddler.
Includes types from the inherit-compound template.

\*/

"use strict";

function collectTypes(wiki,tiddler,results) {
	var data = wiki.getTiddlerData(tiddler);
	if(data) {
		for(var name in data) {
			var entry = data[name];
			if(entry !== null && typeof entry === "object" && $tw.utils.hop(entry,"type")) {
				if(results.indexOf(entry.type) === -1) {
					results.push(entry.type);
				}
			}
		}
	}
}

exports["compound-field-types"] = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		if(tiddler && (tiddler.fields.type === "text/vnd.tiddlywiki-multiple" ||
			tiddler.fields.type === "text/vnd.tiddlywiki-multiple+fields"))
		{
			// Collect from template first
			if(tiddler.fields["inherit-compound"]) {
				var templateTiddler = options.wiki.getTiddler(tiddler.fields["inherit-compound"]);
				if(templateTiddler) {
					collectTypes(options.wiki,templateTiddler,results);
				}
			}
			// Then from the tiddler itself
			collectTypes(options.wiki,tiddler,results);
		}
	});
	return results;
};
