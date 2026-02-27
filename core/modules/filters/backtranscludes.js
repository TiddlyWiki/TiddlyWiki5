/*\
title: $:/core/modules/filters/backtranscludes.js
type: application/javascript
module-type: filteroperator

Filter operator for returning all the backtranscludes from a tiddler

\*/
"use strict";

/*
Export our filter function
*/
exports.backtranscludes = function(source,operator,options) {
	var results = new $tw.utils.LinkedList();
	source(function(tiddler,title) {
		results.pushTop(options.wiki.getTiddlerBacktranscludes(title));
	});
	return results.makeTiddlerIterator(options.wiki);
};
