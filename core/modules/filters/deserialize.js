/*\
title: $:/core/modules/filters/deserialize.js
type: application/javascript
module-type: filteroperator
Filter operator for deserializing string data into JSON representing tiddlers
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["deserialize"] = function(source,operator,options) {
	var results = [],
		deserializer;
	if(operator.operand) {
		// Get the deserializer identified by the operand
		deserializer = $tw.Wiki.tiddlerDeserializerModules[operator.operand];
		if(deserializer) {
			source(function(tiddler,title) {
				var tiddlers;
				try {
					tiddlers = deserializer(title);
				} catch(e) {
					// Return an empty array if we could not extract any tiddlers
					tiddlers = [];
				}
				results.push(JSON.stringify(tiddlers));
			});
		} else {
			return [$tw.language.getString("Error/DeserializeOperator/UnknownDeserializer")];
		}
	} else {
		return [$tw.language.getString("Error/DeserializeOperator/MissingOperand")];
	}
	return results;
}

})();