/*\
title: $:/core/modules/filters/editiondescription.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the descriptions of the specified edition names

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
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

})();
