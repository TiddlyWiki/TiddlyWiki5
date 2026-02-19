/*\
title: $:/core/modules/filters/count.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.count = function(source,operator,options) {
	var count = 0;
	source(function(tiddler,title) {
		count++;
	});
	return [count + ""];
};
