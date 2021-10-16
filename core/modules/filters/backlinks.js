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
	var results = new $tw.utils.LinkedList();
	source(function(tiddler,title) {
		results.pushTop(options.wiki.getTiddlerBacklinks(title));
	});
	return results.makeTiddlerIterator(options.wiki);
};

})();
