/*\
title: $:/core/modules/filters/slugify.js
type: application/javascript
module-type: filteroperator

Filter operator for slugifying a tiddler title

\*/

"use strict";

exports.slugify = function(source,operator,options) {
	const results = [];
	source((tiddler,title) => {
		results.push(options.wiki.slugify(title));
	});
	return results;
};
