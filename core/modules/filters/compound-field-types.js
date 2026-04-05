/*\
title: $:/core/modules/filters/compound-field-types.js
type: application/javascript
module-type: filteroperator

Returns all unique sub-entry types from a text/vnd.tiddlywiki-fields tiddler

\*/

"use strict";

exports["compound-field-types"] = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		if(tiddler && tiddler.fields.type === "text/vnd.tiddlywiki-fields") {
			var data = options.wiki.getTiddlerData(tiddler);
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
	});
	return results;
};
