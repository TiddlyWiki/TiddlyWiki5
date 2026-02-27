/*\
title: $:/core/modules/filters/crypto.js
type: application/javascript
module-type: filteroperator

Filter operators for cryptography, using the Stanford JavaScript library

\*/

"use strict";

exports.sha256 = function(source,operator,options) {
	var results = [],
		length = parseInt(operator.operand,10) || 20;
	source(function(tiddler,title) {
		results.push($tw.utils.sha256(title,{length: length}));
	});
	return results;
};
