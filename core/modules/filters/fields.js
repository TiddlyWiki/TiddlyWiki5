/*\
title: $:/core/modules/filters/fields.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the names of the fields on the selected tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.fields = function(source,operator,options) {
	var results = [],
		fieldName,
		suffixes = (operator.suffixes || [])[0] || [],
		operand = $tw.utils.parseStringArray(operator.operand);

	source(function(tiddler,title) {
		if(tiddler) {
			if(suffixes.indexOf("include") !== -1) {
				for(fieldName in tiddler.fields) {
					(operand.indexOf(fieldName) !== -1) ? $tw.utils.pushTop(results,fieldName) : "";
				}
			} else if (suffixes.indexOf("exclude") !== -1) {
				for(fieldName in tiddler.fields) {
					(operand.indexOf(fieldName) !== -1) ? "" : $tw.utils.pushTop(results,fieldName);
				}
			} // else if
			else {
				for(fieldName in tiddler.fields) {
					$tw.utils.pushTop(results,fieldName);
				}
			} // else
		} // if (tiddler)
	});
	return results;
};

})();
