/*\
title: $:/core/modules/filters/tags.js
type: application/javascript
module-type: filteroperator

Filter operator returning all the tags of the selected tiddlers

\*/

"use strict";

/*
Export our filter function
*/
exports.tags = function(source,operator,options) {
	// Fast path: cache result when iterating all tiddlers
	if(source === options.wiki.each) {
		return options.wiki.getGlobalCache("filter-tags-all-tiddlers",function() {
			var tags = {};
			source(function(tiddler,title) {
				var t, length;
				if(tiddler && tiddler.fields.tags) {
					for(t=0, length=tiddler.fields.tags.length; t<length; t++) {
						tags[tiddler.fields.tags[t]] = true;
					}
				}
			});
			return Object.keys(tags);
		});
	}
	var tags = {};
	source(function(tiddler,title) {
		var t, length;
		if(tiddler && tiddler.fields.tags) {
			for(t=0, length=tiddler.fields.tags.length; t<length; t++) {
				tags[tiddler.fields.tags[t]] = true;
			}
		}
	});
	return Object.keys(tags);
};
