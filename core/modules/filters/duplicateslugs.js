/*\
title: $:/core/modules/filters/duplicateslugs.js
type: application/javascript
module-type: filteroperator

Filter function for [duplicateslugs[]]

\*/

"use strict";

/*
Export our filter function
*/
exports.duplicateslugs = function(source,operator,options) {
	var slugs = Object.create(null), // Hashmap by slug of title, replaced with "true" if the duplicate title has already been output
		results = [];
	source(function(tiddler,title) {
		var slug = options.wiki.slugify(title);
		if(slug in slugs) {
			if(slugs[slug] !== true) {
				results.push(slugs[slug]);
				slugs[slug] = true;
			}
			results.push(title);
		} else {
			slugs[slug] = title;
		}
	});
	return results;
};
