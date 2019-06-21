/*\
title: $:/core/modules/filters/is/blank.js
type: application/javascript
module-type: isfilteroperator

Filter function for [is[blank]]

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.blank = function(source,prefix,options) {
	var results = [];
	if(prefix === "!") {
		source(function(tiddler,title) {
			if(title) {
				results.push(title);
			}
		});
	} else {
		source(function(tiddler,title) {
			if(!title) {
				results.push(title);
			}
		});
	}
	return results;
};

})();
