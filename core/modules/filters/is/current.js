/*\
title: $:/core/modules/filters/is/current.js
type: application/javascript
module-type: isfilteroperator
\*/

"use strict";

exports.current = function(source,prefix,options) {
	var results = [],
		currTiddlerTitle = options.widget && options.widget.getVariable("currentTiddler");
	if(prefix === "!") {
		source(function(tiddler,title) {
			if(title !== currTiddlerTitle) {
				results.push(title);
			}
		});
	} else {
		source(function(tiddler,title) {
			if(title === currTiddlerTitle) {
				results.push(title);
			}
		});
	}
	return results;
};
