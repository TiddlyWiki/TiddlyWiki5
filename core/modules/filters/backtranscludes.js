/*\
title: $:/core/modules/filters/backtranscludes.js
type: application/javascript
module-type: filteroperator
\*/
"use strict";

exports.backtranscludes = function(source,operator,options) {
	var results = new $tw.utils.LinkedList();
	source(function(tiddler,title) {
		results.pushTop(options.wiki.getTiddlerBacktranscludes(title));
	});
	return results.makeTiddlerIterator(options.wiki);
};
