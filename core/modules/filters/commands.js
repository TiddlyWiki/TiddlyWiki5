/*\
title: $:/core/modules/filters/commands.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.commands = function(source,operator,options) {
	var results = [];
	$tw.utils.each($tw.commands,function(commandInfo,name) {
		results.push(name);
	});
	results.sort();
	return results;
};
