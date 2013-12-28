/*\
title: $:/core/modules/filters/sort.js
type: application/javascript
module-type: filteroperator

Filter operator for sorting

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.sort = function(source,operator,options) {
	var results = prepare_results(source);
	options.wiki.sortTiddlers(results,operator.operand,operator.prefix === "!",false,false);
	return results;
};

exports.nsort = function(source,operator,options) {
	var results = prepare_results(source);
	options.wiki.sortTiddlers(results,operator.operand,operator.prefix === "!",false,true);
	return results;
};

exports.sortcs = function(source,operator,options) {
	var results = prepare_results(source);
	options.wiki.sortTiddlers(results,operator.operand,operator.prefix === "!",true,false);
	return results;
};

exports.nsortcs = function(source,operator,options) {
	var results = prepare_results(source);
	options.wiki.sortTiddlers(results,operator.operand,operator.prefix === "!",true,true);
	return results;
};

var prepare_results = function (source) {
	var results;
	if($tw.utils.isArray(source)) {
		results = source;
	} else {
		results = [];
		$tw.utils.each(source,function(element,title) {
			results.push(title);
		});
	}
	return results;
}

})();
