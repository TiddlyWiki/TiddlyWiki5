/*\
title: $:/core/modules/filters/backlinks.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.backlinks = function(source,operator,options) {
	var results = new $tw.utils.LinkedList();
	source(function(tiddler,title) {
		results.pushTop(options.wiki.getTiddlerBacklinks(title));
	});
	return results.makeTiddlerIterator(options.wiki);
};
