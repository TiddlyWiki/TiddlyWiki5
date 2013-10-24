/*\
title: $:/core/modules/filters/moduletypes.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the names of the module types in this wiki

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.moduletypes = function(source,operator,options) {
	var results = [];
	$tw.utils.each($tw.modules.types,function(moduleInfo,type) {
		results.push(type);
	});
	results.sort();
	return results;
};

})();
