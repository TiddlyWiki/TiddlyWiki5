/*\
title: $:/core/modules/filters/editions.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.editions = function(source,operator,options) {
	var results = [];
	if($tw.node) {
		var editionInfo = $tw.utils.getEditionInfo();
		if(editionInfo) {
			$tw.utils.each(editionInfo,function(info,name) {
				results.push(name);
			});
		}
		results.sort();
	}
	return results;
};
