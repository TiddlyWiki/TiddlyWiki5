/*\
title: $:/core/modules/filterrunprefixes/map.js
type: application/javascript
module-type: filterrunprefix
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter prefix function
*/
exports.map = function(operationSubFunction,options) {
	return function(results,source,widget) {
		if(results.length > 0) {
			var inputTitles = results.toArray();
			results.clear();
			$tw.utils.each(inputTitles,function(title) {
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
				results.push(filtered[0] || "");
			});
		}
	}
};

})();