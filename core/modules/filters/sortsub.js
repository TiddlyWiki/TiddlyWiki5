/*\
title: $:/core/modules/filters/sortsub.js
type: application/javascript
module-type: filteroperator

Filter operator for sorting by a subfilter

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.sortsub = function(source,operator,options) {
	// Compile the subfilter
	var filterFn = options.wiki.compileFilter(operator.operand);
	// Collect the input titles and the corresponding sort keys
	var inputTitles = [],
		sortKeys = [];
	source(function(tiddler,title) {
		inputTitles.push(title);
		var r = filterFn.call(options.wiki,function(iterator) {
			iterator(options.wiki.getTiddler(title),title);
		},{
			getVariable: function(name,opts) {
				opts = opts || {};
				switch(name) {
					case "currentTiddler":
						return "" + title;
					case "..currentTiddler":
						return options.widget.getVariable("currentTiddler");
					default:
						return options.widget.getVariable(name,opts);
				}
			}
		});
		sortKeys.push(r[0] || "");
	});
	// Rather than sorting the titles array, we'll sort the indexes so that we can consult both arrays
	var indexes = new Array(inputTitles.length);
	for(var t=0; t<inputTitles.length; t++) {
		indexes[t] = t;
	}
	// Sort the indexes
	var compareFn = $tw.utils.makeCompareFunction(operator.suffix,{defaultType: "string",invert: operator.prefix === "!"});
	indexes = indexes.sort(function(a,b) {
		return compareFn(sortKeys[a],sortKeys[b]);
	});
	// Make the results array in order
	var results = [];
	$tw.utils.each(indexes,function(index) {
		results.push(inputTitles[index]);
	});
	return results;
};

})();
