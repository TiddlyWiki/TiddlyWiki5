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
	var results = [],
		currTiddlerTitle = options.widget && options.widget.getVariable("currentTiddler");
	if(prefix === "!") {
		source(function(tiddler,title) {
			if(title !== currTiddlerTitle) {
				results.push(title);
			}
		});
	} else {
		source(function(tiddler,title) {
			if(title === currTiddlerTitle) {
				results.push(title);
			}
		});
	}
	return results;
};

})();
