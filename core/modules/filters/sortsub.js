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
	// Collect the input titles
	var inputTitles = [];
	source(function(tiddler,title) {
		inputTitles.push(title);
	});
	// Pass them through the subfilter to get the sort keys
	var sortKeys = options.wiki.filterTiddlers(operator.operand,options.widget,options.wiki.makeTiddlerIterator(inputTitles));
	// Rather than sorting the titles array, we'll sort the indexes so that we can consult both arrays
	var indexes = [];
	while(inputTitles.length > indexes.length) {
		indexes.push(indexes.length);
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
