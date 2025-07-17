/*\
title: $:/core/modules/filters/is/current.js
type: application/javascript
module-type: isfilteroperator

Filter function for [is[current]]

\*/

"use strict";

/*
Export our filter function
*/
exports.current = function(source,prefix,options) {
	const results = [];
	const currTiddlerTitle = options.widget && options.widget.getVariable("currentTiddler");
	if(prefix === "!") {
		source((tiddler,title) => {
			if(title !== currTiddlerTitle) {
				results.push(title);
			}
		});
	} else {
		source((tiddler,title) => {
			if(title === currTiddlerTitle) {
				results.push(title);
			}
		});
	}
	return results;
};
