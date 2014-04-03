/*\
title: $:/core/modules/filters/all/tiddlers.js
type: application/javascript
module-type: allfilteroperator

Filter function for [all[tiddlers]]

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.tiddlers = function(source,prefix,options) {
	var results = [];
	options.wiki.each(function(tiddler,title) {
		results.push(title);
	});
	return results;
};

})();
