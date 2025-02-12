/*\
title: $:/core/modules/filterrunprefixes/apply.js
type: application/javascript
module-type: filterrunprefix

Filter run prefix to make input titles available as variables when evaluating the filter run

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.apply = function(operationSubFunction) {
	return function(results,source,widget) {
		source = widget.wiki.makeTiddlerIterator([]);
		var variables = {},
			counter = 1;
		results.each(function(title) {
			variables["$" + counter] = title;
			counter++;
		});
		results.clear();
		results.pushTop(operationSubFunction(source,widget.makeFakeWidgetWithVariables(variables)));
	};
};

})();
