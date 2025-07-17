/*\
title: $:/core/modules/filters/editiondescription.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the descriptions of the specified edition names

\*/

"use strict";

/*
Export our filter function
*/
exports.editiondescription = function(source,operator,options) {
	const results = [];
	if($tw.node) {
		const editionInfo = $tw.utils.getEditionInfo();
		if(editionInfo) {
			source((tiddler,title) => {
				if($tw.utils.hop(editionInfo,title)) {
					results.push(editionInfo[title].description || "");
				}
			});
		}
	}
	return results;
};
