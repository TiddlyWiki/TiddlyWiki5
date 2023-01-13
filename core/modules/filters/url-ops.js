/*\
title: $:/core/modules/filters/url-ops.js
type: application/javascript
module-type: filteroperator

Filter operators for URL operations

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["setquerystring"] = function(source,operator,options) {
	var name = operator.operands.length >= 1 ? operator.operands[0] : null,
		value = operator.operands.length >= 2 ? operator.operands[1] : "",
		results = [];
	source(function(tiddler,title) {
		results.push($tw.utils.setQueryStringParameter(title,name,value));
	});
	return results;
};

})();
