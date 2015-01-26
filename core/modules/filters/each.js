/*\
title: $:/core/modules/filters/each.js
type: application/javascript
module-type: filteroperator

Filter operator that selects one tiddler for each unique value of the specified field.
With suffix "list", selects all tiddlers that are values in a specified list field.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.each = function(source,operator,options) {
	var results = [],
		values = {},
		list = "list" === operator.suffix;
	source(function(tiddler,title) {
		if(tiddler) {
			var field = operator.operand || "title",
				items = list ?
					options.wiki.getTiddlerList(title,field) :
					[ "title" === field ? title : tiddler.getFieldString(operator.operand)];
			$tw.utils.each(items,function(value){
				if(!$tw.utils.hop(values,value)) {
					values[value] = true;
					results.push(list ? value : title);
				}
			});
		}
	});
	return results;
};

})();
