/*\
title: $:/core/modules/filters/has.js
type: application/javascript
module-type: filteroperator

Filter operator for checking if a tiddler has the specified field or index

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.has = function(source,operator,options) {
	var results = [],
		invert = operator.prefix === "!";

	if(operator.suffix === "field") {
		if(invert) {
			source(function(tiddler,title) {
				if(!tiddler || (tiddler && (!$tw.utils.hop(tiddler.fields,operator.operand)))) {
					results.push(title);
				}
			});
		} else {
			source(function(tiddler,title) {
				if(tiddler && $tw.utils.hop(tiddler.fields,operator.operand)) {
					results.push(title);
				}
			});
		}
	}
	else if(operator.suffix === "index") {
		if(invert) {
			source(function(tiddler,title) {
				if(!tiddler || (tiddler && (!$tw.utils.hop(options.wiki.getTiddlerDataCached(tiddler,Object.create(null)),operator.operand)))) {
					results.push(title);
				}
			});
		} else {
			source(function(tiddler,title) {
				if(tiddler && $tw.utils.hop(options.wiki.getTiddlerDataCached(tiddler,Object.create(null)),operator.operand)) {
					results.push(title);
				}
			});
		}
	}
	else {
		if(invert) {
			source(function(tiddler,title) {
				if(!tiddler || !$tw.utils.hop(tiddler.fields,operator.operand) || (tiddler.fields[operator.operand].length === 0)) {
					results.push(title);
				}
			});
		} else {
			source(function(tiddler,title) {
				if(tiddler && $tw.utils.hop(tiddler.fields,operator.operand) && (tiddler.fields[operator.operand].length !== 0)) {
					results.push(title);
				}
			});
		}
	}
	return results;
};

})();
