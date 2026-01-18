/*\
title: $:/core/modules/filters/enlist.js
type: application/javascript
module-type: filteroperator

Filter operator returning its operand parsed as a list

\*/

"use strict";

var titleOperator = require("$:/core/modules/filters/title.js").title;

/*
Export our filter function
*/
exports.enlist = function(source,operator,options) {
	// We delegate to the title filter if we have a multi-value operand (only for compatibility, may be removed in future)
	if(operator.multiValueOperands.length !== 1) {
		return titleOperator(source,operator,options);
	}
	
	var allowDuplicates = false;
	switch(operator.suffix) {
		case "raw":
			allowDuplicates = true;
			break;
		case "dedupe":
			allowDuplicates = false;
			break;
	}
	var list = $tw.utils.parseStringArray(operator.operand,allowDuplicates);
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
