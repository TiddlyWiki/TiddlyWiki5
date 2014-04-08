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
	var results = [];
	source(function(tiddler,title) {
		$tw.utils.each($tw.modules.types[title],function(moduleInfo,moduleName) {
			results.push(moduleName);
		});
	});
	results.sort();
	return results;
};

})();
