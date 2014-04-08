/*\
title: $:/core/modules/filters/links.js
type: application/javascript
module-type: filteroperator

Filter operator for returning all the links from a tiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.links = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		$tw.utils.pushTop(results,options.wiki.getTiddlerLinks(title));
	});
	return results;
};

})();
