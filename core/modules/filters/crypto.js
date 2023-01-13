/*\
title: $:/core/modules/filters/crypto.js
type: application/javascript
module-type: filteroperator

Filter operators for cryptography, using the Stanford JavaScript library

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.sha256 = function(source,operator,options) {
	var results = [],
		length = parseInt(operator.operand,10) || 20,
		sha256 = function(text) {
			return sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(text)).substr(0,length);
		};
	source(function(tiddler,title) {
		results.push(sha256(title));
	});
	return results;
};

})();
