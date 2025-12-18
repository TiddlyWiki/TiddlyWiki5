/*\
title: $:/core/modules/filters/addsuffix.js
type: application/javascript
module-type: filteroperator

Filter operator for adding a suffix to each title in the list. This is
especially useful in contexts where only a filter expression is allowed
and macro substitution isn't available.

\*/

"use strict";

/*
Export our filter function
*/
exports.addsuffix = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push(title + operator.operand);
	});
	return results;
};
