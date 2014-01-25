/*\
title: $:/core/modules/filters/listops.js
type: application/javascript
module-type: filteroperator

Filter operators for manipulating the current selection list

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Reverse list
*/
exports.reverse = function(source,operator,options) {
	var results = [];
	if(!$tw.utils.isArray(source)) {
		source = Object.keys(source).sort();
	}
	$tw.utils.each(source,function(title) {
		results.unshift(title);
	});
	return results;
};

/*
First entry/entries in list
*/
exports.first = function(source,operator,options) {
	var count = parseInt(operator.operand) || 1;
	if(!$tw.utils.isArray(source)) {
		source = Object.keys(source).sort();
	}
	return source.slice(0,Math.min(count,source.length));
};

/*
Last entry/entries in list
*/
exports.last = function(source,operator,options) {
	var count = parseInt(operator.operand) || 1;
	if(!$tw.utils.isArray(source)) {
		source = Object.keys(source).sort();
	}
	return source.slice(-count);
};

/*
All but the first entry/entries of the list
*/
exports.rest = function(source,operator,options) {
	var count = parseInt(operator.operand) || 1;
	if(!$tw.utils.isArray(source)) {
		source = Object.keys(source).sort();
	}
	return source.slice(count);
};
exports.butfirst = exports.rest;
exports.bf = exports.rest;

/*
All but the last entry/entries of the list
*/
exports.butlast = function(source,operator,options) {
	var count = parseInt(operator.operand) || 1;
	if(!$tw.utils.isArray(source)) {
		source = Object.keys(source).sort();
	}
	return source.slice(0,-count);
};
exports.bl = exports.butlast;

/*
The nth member of the list
*/
exports.nth = function(source,operator,options) {
	var count = parseInt(operator.operand) || 1;
	if(!$tw.utils.isArray(source)) {
		source = Object.keys(source).sort();
	}
	return source.slice(count-1,count);
};

})();
