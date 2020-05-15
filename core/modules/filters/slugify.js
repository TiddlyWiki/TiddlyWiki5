/*\
title: $:/core/modules/filters/slugify.js
type: application/javascript
module-type: filteroperator

Filter operator for slugifying a tiddler title

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.slugify = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push(options.wiki.slugify(title));
	});
	return results;
};

})();
