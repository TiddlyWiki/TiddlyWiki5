/*\
title: $:/core/modules/filters/deserializers.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the names of the deserializers in this wiki

\*/

"use strict";

/*
Export our filter function
*/
exports.deserializers = function(source,operator,options) {
	var results = [];
	$tw.utils.each($tw.Wiki.tiddlerDeserializerModules,function(deserializer,type) {
		results.push(type);
	});
	results.sort();
	return results;
};
