/*\
title: $:/core/modules/filters/tags.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.tags = function(source,operator,options) {
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
