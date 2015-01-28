/*\
title: $:/core/modules/filters/limit.js
type: application/javascript
module-type: filteroperator

Filter operator for chopping the results to a specified maximum number of entries

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.limit = function(source,operator,options) {
	var results,t,tiddlers = [],
		offset = parseInt(operator.suffix,10) || 0,
		limit = parseInt(operator.operand,10) || 0;
	// Convert to an array
	source(function(tiddler,title) {
		tiddlers.push(title);
	});
	if(offset === 0) {
		results = tiddlers;
	} else {
		results = offset > 0 ? tiddlers.slice(offset) : tiddlers.slice(0,offset);
	}
	if(0 !== limit) {
		results = limit > 0 ? results.slice(0,limit) : results.slice(limit);
	}
	if(operator.prefix === "!") {
		for(t=0; t<results.length; t++){
			tiddlers.splice(tiddlers.indexOf(results[t]),1);
		}
		results = tiddlers;
	}
	return results;
};

})();
