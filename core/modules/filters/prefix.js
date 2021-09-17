/*\
title: $:/core/modules/filters/prefix.js
type: application/javascript
module-type: filteroperator

Filter operator for checking if a title starts with a prefix

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.prefix = function(source,operator,options) {
	var expected = (operator.prefix === "!"),
		iter = source();
	return options.wiki.makeTiddlerIterator(function() {
		var pair;
		while ((pair = iter.next()).done == false) {
			if((pair.value.substr(0,operator.operand.length) !== operator.operand) === expected) {
				return pair.value;
			}
		}
		return undefined;
	});
};

})();
