/*\
title: $:/core/modules/filters/editions.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the names of the available editions in this wiki

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
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

})();
