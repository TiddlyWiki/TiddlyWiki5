/*\
title: $:/core/modules/filters/all.js
type: application/javascript
module-type: filteroperator

Filter operator for selecting tiddlers

[all[shadows+tiddlers]]

\*/

"use strict";

var allFilterOperators;

function getAllFilterOperators() {
	if(!allFilterOperators) {
		allFilterOperators = {};
		$tw.modules.applyMethods("allfilteroperator",allFilterOperators);
	}
	return allFilterOperators;
}

/*
Export our filter function
*/
exports.all = function(source,operator,options) {
	// Check for common optimisations
	var subops = operator.operand.split("+");
	if(subops.length === 1 && subops[0] === "") {
		return source;
	} else if(subops.length === 1 && subops[0] === "tiddlers") {
		return options.wiki.each;
	} else if(subops.length === 1 && subops[0] === "shadows") {
		return options.wiki.eachShadow;
	} else if(subops.length === 2 && subops[0] === "tiddlers" && subops[1] === "shadows") {
		return options.wiki.eachTiddlerPlusShadows;
	} else if(subops.length === 2 && subops[0] === "shadows" && subops[1] === "tiddlers") {
		return options.wiki.eachShadowPlusTiddlers;
	}
	// Do it the hard way
	// Get our suboperators
	var allFilterOperators = getAllFilterOperators();
	// Cycle through the suboperators accumulating their results
	var results = new $tw.utils.LinkedList();
	for(var t=0; t<subops.length; t++) {
		var subop = allFilterOperators[subops[t]];
		if(subop) {
			results.pushTop(subop(source,operator.prefix,options));
		}
	}
	return results.makeTiddlerIterator(options.wiki);
};
