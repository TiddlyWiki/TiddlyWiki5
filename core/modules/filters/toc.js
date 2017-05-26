/*\
title: $:/core/modules/filters/toc.js
type: application/javascript
module-type: filteroperator

Returns a flat list for a table of contents, e.g. for paging,
down to a given level, level 1 is directly tagging to operand

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export filter
*/
exports.toc = function(source,operator,options) {
	var results = [],
		downTo = parseInt(operator.suffix),
		tag = operator.operand || options.widget.getVariable("currentTiddler"),
		getChildren = function(tag,level) {
			level++;
			$tw.utils.each(
				$tw.wiki.filterTiddlers("[[" + tag + "]tagging[]]"),
				function(tiddler) {
					results.push(tiddler);
					if(null == downTo || level < downTo) {
						getChildren(tiddler);
					}
				}
			)
		};

	if(isNaN(downTo)) {
		downTo = null;
	}
	getChildren(tag,0);
	return results;
};

})();