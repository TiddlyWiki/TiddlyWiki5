/*\
title: $:/core/modules/filters/moduletypes.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the names of the module types in this wiki

\*/

"use strict";

/*
Export our filter function
*/
exports.moduletypes = function(source,operator,options) {
	const results = [];
	$tw.utils.each($tw.modules.types,(moduleInfo,type) => {
		results.push(type);
	});
	results.sort();
	return results;
};
