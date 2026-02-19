/*\
title: $:/core/modules/filters/transcludes.js
type: application/javascript
module-type: filteroperator
\*/
"use strict";

exports.transcludes = function(source,operator,options) {
	var results = new $tw.utils.LinkedList();
	source(function(tiddler,title) {
		results.pushTop(options.wiki.getTiddlerTranscludes(title));
	});
	return results.makeTiddlerIterator(options.wiki);
};
