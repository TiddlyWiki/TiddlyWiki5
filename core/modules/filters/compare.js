/*\
title: $:/core/modules/filters/compare.js
type: application/javascript
module-type: filteroperator

General purpose comparison operator

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.compare = function(source,operator,options) {
	var suffixes = operator.suffixes || [],
		type = (suffixes[0] || [])[0],
		mode = (suffixes[1] || [])[0],
		typeFn = $tw.utils.makeCompareFunction(type,{defaultType: "number"}),
		modeFn = modes[mode] || modes.eq,
		invert = operator.prefix === "!",
		results = [];
	source(function(tiddler,title) {
		if(modeFn(typeFn(title,operator.operand)) !== invert) {
			results.push(title);
		}
	});
	return results;
};

var modes = {
	"eq": function(value) {return value === 0;},
	"ne": function(value) {return value !== 0;},
	"gteq": function(value) {return value >= 0;},
	"gt": function(value) {return value > 0;},
	"lteq": function(value) {return value <= 0;},
	"lt": function(value) {return value < 0;}
}

})();
