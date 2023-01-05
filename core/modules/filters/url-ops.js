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
	var URL = $tw.browser ? window.URL : require("url").URL,
		URLSearchParams = $tw.browser ? window.URLSearchParams : require("url").URLSearchParams,
		name = operator.operands.length >= 1 ? operator.operands[0] : null,
		value = operator.operands.length >= 2 ? operator.operands[1] : "",
		results = [];
	source(function(tiddler,title) {
		var url;
		try {
			url = new URL(title);
		} catch(e) {
		}
		if(url) {
			var params = new URLSearchParams(url.search);
			if(name) {
				params.set(name,value);
			}
			url.search = params.toString();
			results.push(url.toString());
		}
	});
	return results;
};

})();
