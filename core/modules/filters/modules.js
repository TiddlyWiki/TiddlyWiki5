/*\
title: $:/core/modules/filters/modules.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the titles of the modules of a given type in this wiki

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.modules = function(source,operator,options) {
	var results = [],
		pushModules = function(type) {
			$tw.utils.each($tw.modules.types[type],function(moduleInfo,moduleName) {
				results.push(moduleName);
			});
		};
	// Iterate through the source tiddlers
	if($tw.utils.isArray(source)) {
		$tw.utils.each(source,function(title) {
			pushModules(title);
		});
	} else {
		$tw.utils.each(source,function(element,title) {
			pushModules(title);
		});
	}
	results.sort();
	return results;
};

})();
