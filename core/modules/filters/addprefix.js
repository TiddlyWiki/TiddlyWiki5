/*\
title: $:/core/modules/filters/addprefix.js
type: application/javascript
module-type: filteroperator

Filter operator for adding a prefix to each title in the list. This is
especially useful in contexts where only a filter expression is allowed
and macro substitution isn't available.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.addprefix = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push(operator.operand + title);
	});
	return results;
};

})();
