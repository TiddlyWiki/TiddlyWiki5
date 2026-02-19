/*\
title: $:/core/modules/filters/links.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.links = function(source,operator,options) {
	var results = new $tw.utils.LinkedList();
	source(function(tiddler,title) {
		results.pushTop(options.wiki.getTiddlerLinks(title));
	});
	return results.makeTiddlerIterator(options.wiki);
};
