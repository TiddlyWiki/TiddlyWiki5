/*\
title: $:/core/modules/filters/subfilter.js
type: application/javascript
module-type: filteroperator

Filter operator returning its operand evaluated as a filter

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.subfilter = function(source,operator,options) {
	var list = [], tiddlers = [],
	suffix = (operator.suffixes || [])[0] || [""];
	if (suffix.includes("title")) {
		tiddlers[0] = operator.operand;
	} 
	if (suffix.includes("tag")) {
		tiddlers = tiddlers.concat(options.wiki.getTiddlersWithTag(operator.operand));
	}
	if (suffix.includes("title") || suffix.includes("tag")) {
		tiddlers.forEach(function(title) {
			var tiddler = options.wiki.getTiddler(title);
			list = list.concat(options.wiki.filterTiddlers(tiddler.fields.text,options.widget,source));
		});
	} else {
		list = options.wiki.filterTiddlers(operator.operand,options.widget,source);
	}	
	if(operator.prefix === "!") {
		var results = [];
		source(function(tiddler,title) {
			if(list.indexOf(title) === -1) {
				results.push(title);
			}
		});
		return results;
	} else {
		return list;
	}
};

})();
