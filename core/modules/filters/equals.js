/*\
title: $:/core/modules/filters/equals.js
type: application/javascript
module-type: filteroperator

Filter operator for comparing text for equality

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.equals = function(source,operator,options) {
	var results = [] ;
	if(operator.prefix === "!") {
		if(operator.regexp) {
			source(function(tiddler,title) {

				var text = title ;
					if(text !== null && !operator.regexp.exec(text)) {
						results.push(title);
					}
			});
		} else {
			source(function(tiddler,title) {

				var text = title ;
					if(text !== null && text !== operator.operand) {
						results.push(title);
					}
			});
		}
	} else {
		if(operator.regexp) {
			source(function(tiddler,title) {
				
				var text = title ;
				if(text !== null && !!operator.regexp.exec(text)) {
					results.push(title);
				}
				
			});
		} else {
			source(function(tiddler,title) {
				
				var text = title ;
				if(text !== null && text === operator.operand) {
					results.push(title);
				}
				
			});
		}
	}
	return results;
};

})();
