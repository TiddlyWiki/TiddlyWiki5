/*\
title: $:/core/modules/filters/contains.js
type: application/javascript
module-type: filteroperator

Filter operator for finding values in array fields

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.contains = function(source,operator,options) {
	var results = [],
		fieldname = operator.suffix || "list";
	if(operator.prefix === "!") {
		source(function(tiddler,title) {
			if(tiddler) {
				var list = tiddler.getFieldList(fieldname);
				if(list.indexOf(operator.operand) === -1) {
					results.push(title);
				}
			} else {
				results.push(title);
			}
		});
	} else {
		source(function(tiddler,title) {
			if(tiddler) {
				var list = tiddler.getFieldList(fieldname);
				if(list.indexOf(operator.operand) !== -1) {
					results.push(title);
				}
			}
		});
	}
	return results;
};

})();
