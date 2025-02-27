/*\
title: $:/core/modules/filters/is/plugin.js
type: application/javascript
module-type: isfilteroperator

Filter function for [is[plugin]]

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.plugin = function(source,prefix,options) {
	var results = [];
	if(prefix === "!") {
		source(function(tiddler,title) {
			if(!tiddler.isPlugin()) {
				results.push(title);
			}
		});
	} else {
		source(function(tiddler,title) {
			if(tiddler.isPlugin()) {
				results.push(title);
			}
		});
	}
	return results;
};

})();
