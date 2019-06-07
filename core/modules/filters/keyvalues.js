/*\
title: $:/core/modules/filters/keyvalues.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the keys and values of a data tiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.keyvalues = function(source,operator,options) {
	var results = [],
		fieldList = [],
		sep = ":",
		p1 = "key",
		p2 = "value",
		v1, v2;

	if(operator.suffixes && operator.suffixes[0].length > 0) {
		fieldList = operator.suffixes[0];
		p1 = fieldList[0] || "";
		p2 = fieldList[1] || "";

	}
	if(operator.suffixes && operator.suffixes[1]) {
		sep = operator.suffixes[1][0] || ":";
	}
	source(function(tiddler,title) {
		var data = options.wiki.getTiddlerDataCached(title);
		if(data) {
			for (var [key, value] of Object.entries(data)) {
				v1 = (p1 === "key") ? key : (p1 === "value") ? value : "";
				v2 = (p2 === "key") ? key : (p2 === "value") ? value : "";
				// remove separator if there is no v2 element
				sep = (v2) ? sep : "";
				results.push(v1+sep+v2);
			}
		}
	});
//	results.sort();
	return results;
};
})();
