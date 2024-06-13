/*\
title: $:/core/modules/filters/backtranscludes.js
type: application/javascript
module-type: filteroperator

Filter operator for returning all the backtranscludes from a tiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.backtranscludes = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		$tw.utils.pushTop(results,options.wiki.getTiddlerBacktranscludes(title));
	});
	return results;
};

})();
