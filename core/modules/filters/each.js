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
		field = operator.operand || "title",
		add = function(v) {
			if(!$tw.utils.hop(values,v)) {
				values[v] = true;
				results.push(v);
			}
		};
	if("list" !== operator.suffix) {
		source(function(tiddler,title) {
			if(tiddler) {
				add("title" === field ? title : tiddler.getFieldString(operator.operand));
			}
		});		
	} else {
		source(function(tiddler,title) {
			if(tiddler) {
				$tw.utils.each(
					options.wiki.getTiddlerList(title,field),
					function(value) {
						add(value);
					}
				);
			}
		});
	}
	return results;
};

})();
