/*\
title: $:/core/modules/filters/crypto.js
type: application/javascript
module-type: filteroperator

Filter operators for cryptography, using the Stanford JavaScript library

\*/

"use strict";

exports.sha256 = function(source,operator,options) {
	const results = [];
	const length = parseInt(operator.operand,10) || 20;
	source((tiddler,title) => {
		results.push($tw.utils.sha256(title,{length}));
	});
	return results;
};
