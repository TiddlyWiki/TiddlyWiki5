/*\
title: $:/core/modules/filters/getindex.js
type: application/javascript
module-type: filteroperator

returns the value at a given index of datatiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.getindex = function(source,operator,options) {
	var iter;
	if(operator.operand) {
		iter = source();
		return options.wiki.makeTiddlerIterator(function() {
			var next, data;
			while((next = iter.next()).done == false) {
				var tiddler = options.wiki.getTiddler(next.value);
				data = options.wiki.extractTiddlerDataItem(tiddler,operator.operand);
				if (data) {
					return data;
				}
			}
			return undefined;
		});
	}
	return [];
};

/*
exports.getindex = function(source,operator,options) {
	var iter;
	if(operator.operand) {
		return options.wiki.makeTiddlerIteratorFromGenerator(function*() {
			for (var title of source()) {
				var tiddler = options.wiki.getTiddler(title),
					data = options.wiki.extractTiddlerDataItem(tiddler,operator.operand);
				if (data) {
					yield data;
				}
			}
		});
	}
	return [];
};
*/

})();
