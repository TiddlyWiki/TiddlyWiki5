/*\
title: $:/core/modules/filters/commands.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the names of the commands available in this wiki

\*/

"use strict";

/*
Export our filter function
*/
exports.commands = function(source,operator,options) {
	const results = [];
	$tw.utils.each($tw.commands,(commandInfo,name) => {
		results.push(name);
	});
	results.sort();
	return results;
};
