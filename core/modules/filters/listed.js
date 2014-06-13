/*\
title: $:/core/modules/filters/listed.js
type: application/javascript
module-type: filteroperator

Filter operator returning all tiddlers that have the selected tiddlers in a list

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.listed = function(source,operator,options) {
	var field = operator.operand || "list",
		results = [];
	source(function(tiddler,title) {
		$tw.utils.pushTop(results,options.wiki.findListingsOfTiddler(title,field));
	});
	return results;
};

})();
