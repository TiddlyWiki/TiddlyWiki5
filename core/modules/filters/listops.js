/*\
title: $:/core/modules/filters/listops.js
type: application/javascript
module-type: filteroperator

Filter operator for manipulating lists

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.reverse = function(source,operator,options) {
	var results = [];
	// Iterate through the source tiddlers
	if($tw.utils.isArray(source)) {
		$tw.utils.each(source,function(title) {
			results.unshift(title);
		});
	} else {
		$tw.utils.each(source,function(element,title) {
			results.unshift(title);
		});
	}
	return results;
};

exports.first = function(source,operator,options) {
	var results = [];
	var count = operator.operand || 1;
	// Iterate through the source tiddlers
	if($tw.utils.isArray(source)) {
		results = source.slice(0, Math.min(count, source.length));
	} else {
		for(var title in source) {
			if(count-- < 1) break;
			results.push(title);
		};
	}
	return results;
};

exports.last = function(source,operator,options) {
	var results = [];
	var count = operator.operand || 1;
	// Iterate through the source tiddlers
	if($tw.utils.isArray(source)) {
		results = source.slice(-count);
	} else {
		for(var title in source) {
			results.push(title);
		};
		results = results.slice(-count);
	}
	return results;
};

exports.rest = function(source,operator,options) {
	var results = [];
	var count = operator.operand || 1;
	// Iterate through the source tiddlers
	if($tw.utils.isArray(source)) {
		results = source.slice(count);
	} else {
		for(var title in source) {
			if(--count < 0) {
				results.push(title);
			}
		};
	}
	return results;
};

})();
