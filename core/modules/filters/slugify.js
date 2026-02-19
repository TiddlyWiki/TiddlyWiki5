/*\
title: $:/core/modules/filters/slugify.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.slugify = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push(options.wiki.slugify(title));
	});
	return results;
};
