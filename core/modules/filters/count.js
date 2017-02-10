/*\
title: $:/core/modules/filters/count.js
type: application/javascript
module-type: filteroperator

Filter operator returning the number of entries in the current list.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.count = function(source,operator,options) {
	var count = 0;
	source(function(tiddler,title) {
		count++;
	});
	return [count + ""];
};

})();
