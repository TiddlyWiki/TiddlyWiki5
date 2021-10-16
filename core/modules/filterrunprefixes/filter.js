/*\
title: $:/core/modules/filterrunprefixes/filter.js
type: application/javascript
module-type: filterrunprefix

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.filter = function(operationSubFunction,options) {
	return function(results,source,widget) {
		if(results.length > 0) {
			var resultsToRemove = [];
			results.each(function(title) {
				var filtered = operationSubFunction(options.wiki.makeTiddlerIterator([title]),{
					getVariable: function(name) {
						switch(name) {
							case "currentTiddler":
								return "" + title;
							case "..currentTiddler":
								return widget.getVariable("currentTiddler");
							default:
								return widget.getVariable(name);
						}
					}
				});
				if(filtered.length === 0) {
					resultsToRemove.push(title);
				}
			});
			results.remove(resultsToRemove);
		}
	}
};

})();
