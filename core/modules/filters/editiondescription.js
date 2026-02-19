/*\
title: $:/core/modules/filters/editiondescription.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.editiondescription = function(source,operator,options) {
	var results = [];
	if($tw.node) {
		var editionInfo = $tw.utils.getEditionInfo();
		if(editionInfo) {
			source(function(tiddler,title) {
				if($tw.utils.hop(editionInfo,title)) {
					results.push(editionInfo[title].description || "");
				}
			});
		}
	}
	return results;
};
