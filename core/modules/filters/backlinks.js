/*\
title: $:/core/modules/filters/backlinks.js
type: application/javascript
module-type: filteroperator

Filter operator for returning all the backlinks from a tiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.backlinks = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		$tw.utils.pushTop(results,options.wiki.getTiddlerBacklinks(title));
	});
	return results;
};

})();
