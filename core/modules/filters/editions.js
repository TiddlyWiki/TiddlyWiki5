/*\
title: $:/core/modules/filters/editions.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the names of the available editions in this wiki

\*/

"use strict";

/*
Export our filter function
*/
exports.editions = function(source,operator,options) {
	const results = [];
	if($tw.node) {
		const editionInfo = $tw.utils.getEditionInfo();
		if(editionInfo) {
			$tw.utils.each(editionInfo,(info,name) => {
				results.push(name);
			});
		}
		results.sort();
	}
	return results;
};
