/*\
title: $:/core/modules/filters/enlist.js
type: application/javascript
module-type: filteroperator

Filter operator returning its operand parsed as a list

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.enlist = function(source,operator,options) {
	var list = $tw.utils.parseStringArray(operator.operand);
	if(operator.prefix === "!") {
		var results = [];
		source(function(tiddler,title) {
			if(list.indexOf(title) === -1) {
				results.push(title);
			}
		});
		return results;
	} else {
		return list;
	}
};

})();
