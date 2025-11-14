/*\
title: $:/core/modules/filters/sort.js
type: application/javascript
module-type: filteroperator

Filter operator for sorting

\*/

"use strict";

/*
Export our filter function
*/
exports.sort = function(source,operator,options) {
	var results = prepare_results(source);
	options.wiki.sortTiddlers(results,operator.operands[0] || "title",operator.prefix === "!",false,false,undefined,operator.operands[1]);
	return results;
};

exports.nsort = function(source,operator,options) {
	var results = prepare_results(source);
	options.wiki.sortTiddlers(results,operator.operands[0] || "title",operator.prefix === "!",false,true,undefined,operator.operands[1]);
	return results;
};

exports.sortan = function(source, operator, options) {
	var results = prepare_results(source);
	options.wiki.sortTiddlers(results, operator.operands[0] || "title", operator.prefix === "!",false,false,true,operator.operands[1]);
	return results;
};

exports.sortcs = function(source,operator,options) {
	var results = prepare_results(source);
	options.wiki.sortTiddlers(results,operator.operands[0] || "title",operator.prefix === "!",true,false,undefined,operator.operands[1]);
	return results;
};

exports.nsortcs = function(source,operator,options) {
	var results = prepare_results(source);
	options.wiki.sortTiddlers(results,operator.operands[0] || "title",operator.prefix === "!",true,true,undefined,operator.operands[1]);
	return results;
};

var prepare_results = function (source) {
	var results = [];
	source(function(tiddler,title) {
		results.push(title);
	});
	return results;
};
