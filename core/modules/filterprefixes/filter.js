/*\
title: $:/core/modules/filterprefixes/filter.js
type: application/javascript
module-type: filterprefix

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.filter = function(results,source,widget) {
	return function(results,source,widget) {
		if(results.length > 0) {
			var toRemove = [];
			$tw.utils.each(results,function(result) {
				var filtered = operationSubFunction(self.makeTiddlerIterator([result]),widget);
				if(filtered.length === 0) {
					toRemove.push(result);
				}
			});
			$tw.utils.removeArrayEntries(results,toRemove);
		}
	}
};

})();
