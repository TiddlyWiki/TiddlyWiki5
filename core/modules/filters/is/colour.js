/*\
title: $:/core/modules/filters/is/colours.js
type: application/javascript
module-type: isfilteroperator

Filter function for [is[colour]] and [is[color]]

\*/

"use strict";

/*
Export our filter function
*/
exports.colour = function(source,prefix,options) {
	var results = [];
	if(prefix === "!") {
		source(function(tiddler,title) {
			if(!$tw.utils.parseCSSColorObject(title)) {
				results.push(title);
			}
		});
	} else {
		source(function(tiddler,title) {
			if($tw.utils.parseCSSColorObject(title)) {
				results.push(title);
			}
		});
	}
	return results;
};

exports.color = exports.colour;
