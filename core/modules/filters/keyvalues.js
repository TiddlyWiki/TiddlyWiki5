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
		useKey = true,
		useValue = false,
		v1, v2, flags, pass, match, data,
		regexp, regexpString;

	// Process key, value parameters
	if(operator.suffixes && operator.suffixes[0].length > 0) {
		fieldList = operator.suffixes[0];
		p1 = fieldList[0] || "";
		p2 = fieldList[1] || "";
	}
	// Process <separator>
	if(operator.suffixes && operator.suffixes[1]) {
		sep = operator.suffixes[1][0] || ":";
	}
	// Process usekey or usevalue flags
	if(operator.suffixes && operator.suffixes[2] && operator.suffixes[2][0]) {
		useKey = (operator.suffixes[2][0].toLowerCase() === "usekey");
		useValue = (operator.suffixes[2][0].toLowerCase() === "usevalue");
	}
	// Process regexp operand if available
	regexpString = operator.operand;
	if (regexpString) {
		match = /^\(\?([gim]+)\)/.exec(regexpString);
		if(match) {
			flags = match[1];
			regexpString = regexpString.substr(match[0].length);
		} else {
			match = /\(\?([gim]+)\)$/.exec(regexpString);
			if(match) {
				flags = match[1];
				regexpString = regexpString.substr(0,regexpString.length - match[0].length);
			}
		}
		try {
			regexp = new RegExp(regexpString,flags);
		} catch(e) {
			return ["" + e];
		}
	}
	// Process incoming values
	source(function(tiddler,title) {
		data = options.wiki.getTiddlerDataCached(title);
		if(data) {
			// remove separator if there is no v2 element
			sep = (p2) ? sep : "";
			for (var [key, value] of Object.entries(data)) {
				v1 = (p1 === "key") ? key : (p1 === "value") ? value : "";
				v2 = (p2 === "key") ? key : (p2 === "value") ? value : "";

				if (regexpString) {
					pass = (useKey) ? regexp.exec(key) : (useValue) ? regexp.exec(value) : false;
					if (pass) {
						results.push(v1+sep+v2);
					}
				} else {
					results.push(v1+sep+v2);
				} // if regexpstring
			} // for
		} // if data
	});
	return results;
};
})();
