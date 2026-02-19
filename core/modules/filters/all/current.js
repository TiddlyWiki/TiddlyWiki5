/*\
title: $:/core/modules/filters/all/current.js
type: application/javascript
module-type: allfilteroperator
\*/

"use strict";

exports.current = function(source,prefix,options) {
	var currTiddlerTitle = options.widget && options.widget.getVariable("currentTiddler");
	if(currTiddlerTitle) {
		return [currTiddlerTitle];
	} else {
		return [];
	}
};
