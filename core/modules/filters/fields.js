/*\
title: $:/core/modules/filters/fields.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the names of the fields on the selected tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.fields = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		if(tiddler) {
			for(var fieldName in tiddler.fields) {
				$tw.utils.pushTop(results,fieldName);
			}
		}
	});
	return results;
};

})();
