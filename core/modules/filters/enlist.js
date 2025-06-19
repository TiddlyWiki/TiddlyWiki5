/*\
title: $:/core/modules/filters/enlist.js
type: application/javascript
module-type: filteroperator

Filter operator returning its operand parsed as a list

\*/

"use strict";

/*
Export our filter function
*/
exports.enlist = function(source,operator,options) {
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
