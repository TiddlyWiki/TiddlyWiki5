/*\
title: $:/core/modules/filters/moduletypes.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.moduletypes = function(source,operator,options) {
	var results = [];
	$tw.utils.each($tw.modules.types,function(moduleInfo,type) {
		results.push(type);
	});
	results.sort();
	return results;
};
