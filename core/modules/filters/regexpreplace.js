/*\
title: $:/core/modules/filters/regexpreplace.js
type: application/javascript
module-type: filteroperator

Filter operator for regexp matching

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.regexpreplace = function(source,operator,options) {
	var results = [],
		regexpString, replaceVariable, regexp, flags = "", match;
	// Process flags and construct regexp
	regexpString = operator.operand,
	replaceVariable = operator.suffix;
	var replaceString = operator.suffix ? options.widget.getVariable(replaceVariable) || "" : "";
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
	// Process the incoming tiddlers
	source(function(tiddler,title) {
		if(title !== null) {
			if(!!regexp.exec(title)) {
				results.push(title.replace(regexp,replaceString));
			}
		}
	});
	return results;
};

})();
