/*\
title: $:/core/modules/filters/deserializers.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.deserializers = function(source,operator,options) {
	var results = [];
	$tw.utils.each($tw.Wiki.tiddlerDeserializerModules,function(deserializer,type) {
		results.push(type);
	});
	results.sort();
	return results;
};
