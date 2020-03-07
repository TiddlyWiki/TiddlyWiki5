/*\
title: $:/core/modules/filters/indexed.js
type: application/javascript
module-type: filteroperator

Filter operator returning the input titles with their index in the array

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.indexed = function(source,operator,options) {
	var count = 0;
	var results = [];
	source(function(tiddler,title) {
		count++;
		results.push(title + "-" + count);
	});
	return results;
};

})();
