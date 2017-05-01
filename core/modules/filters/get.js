/*\
title: $:/core/modules/filters/get.js
type: application/javascript
module-type: filteroperator

Filter operator for replacing tiddler titles by the value of the field specified in the operand.
With suffix **data**, extracts data for a given key instead.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.get = function(source,operator,options) {
	var value,results = []
	if("data" !== operator.suffix){
		source(function(tiddler,title) {
			if(tiddler) {
				value = tiddler.getFieldString(operator.operand);
				if(value) {
					results.push(value);
				}
			}
		});
	} else {
		source(function(tiddler,title) {
			if(tiddler) {
				value = options.wiki.extractTiddlerDataItem(tiddler,operator.operand,"");
				if(undefined !== value) {
					results.push(value);
				}
			}
		});
	}
	return results;
};

})();
