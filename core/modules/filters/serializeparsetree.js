/*\
title: $:/core/modules/filters/serializeparsetree.js
type: application/javascript
module-type: filteroperator

Filter operator for serializing JSON string of Abstract Syntax Tree (AST) of Wiki parse tree to a raw WikiText string.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.serializeparsetree = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		var parseTreeObject = $tw.utils.parseJSONSafe(title);
		if(parseTreeObject) {
			results.push($tw.utils.serializeParseTree(parseTreeObject));
		}
	});
	return results;
};

})();
