/*\
title: $:/core/modules/filters/is/current.js
type: application/javascript
module-type: isfilteroperator

Filter function for [is[current]]

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.current = function(source,prefix,options) {
	var results = [];
	if(prefix === "!") {
		source(function(tiddler,title) {
			if(title !== options.currTiddlerTitle) {
				results.push(title);
			}
		});
	} else {
		source(function(tiddler,title) {
			if(title === options.currTiddlerTitle) {
				results.push(title);
			}
		});
	}
	return results;
};

})();
