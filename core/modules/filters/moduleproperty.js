/*\
title: $:/core/modules/filters/moduleproperty.js
type: application/javascript
module-type: filteroperator

Filter [[module-name]moduleproperty[name]] retrieve a module property

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.moduleproperty = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		try {
			var value = require(title)[operator.operand || ""];
			if(value !== undefined) {
				if(typeof value !== "string") {
					value = JSON.stringify(value);
				}
				results.push(value);
			}
		} catch(e) {
			// Do nothing. It probably wasn't a module.
		}
	});
	results.sort();
	return results;
};

})();
