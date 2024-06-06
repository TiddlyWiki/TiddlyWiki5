/*\
title: $:/plugins/tiddlywiki/aws/encodings.js
type: application/javascript
module-type: filteroperator

Filter operator for applying encodeuricomponent() to each item, with the addition of converting single quotes to %27, as required by AWS

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter functions
*/

exports["aws-encodeuricomponent"] = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push(encodeURIComponent(title).replace(/'/g,"%27"));
	});
	return results;
};

})();
