/*\
title: $:/core/modules/deserializers.js
type: application/javascript
module-type: tiddlerdeserializer

Represents the dependencies of a tiddler or a parser node as these fields:

	tiddlers: A hashmap of explicitly tiddler titles, with the value `false` if the dependency is skinny, and `true` if it is fat
	dependentAll: True if there is an implicit skinny dependency on all available tiddlers
	dependentOnContextTiddler: True if the node has a fat dependency on the current context tiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["text/plain"] = function(text,fields) {
	return [$tw.utils.extendDeepCopy(fields,{
		text: text,
		type: "text/plain"
	})];
};

exports["text/html"] = function(text,fields) {
	return [$tw.utils.extendDeepCopy(fields,{
		text: text,
		type: "text/html"
	})];
};

})();
