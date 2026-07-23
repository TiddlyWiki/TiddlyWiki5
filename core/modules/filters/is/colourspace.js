/*\
title: $:/core/modules/filters/is/colourspace.js
type: application/javascript
module-type: isfilteroperator

Filter function for [is[colourspace]] and [is[colorspace]]

\*/

"use strict";

/*
Export our filter function
*/
exports.colourspace = function(source,prefix,options) {
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

exports.colorspace = exports.colourspace;
