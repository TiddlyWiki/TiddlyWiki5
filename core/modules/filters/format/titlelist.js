/*\
title: $:/core/modules/filters/format/titlelist.js
type: application/javascript
module-type: formatfilteroperator
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.titlelist = function(source,operand,options) {
	var results = [];
	source(function(tiddler,title) {
		if(title && title.length) {
			results.push($tw.utils.stringifyList([title]));
		}
	});
	return results;
};

})();
