/*\
title: $:/core/modules/filters/listops.js
type: application/javascript
module-type: filteroperator

Filter operators for manipulating the current selection list

\*/

"use strict";

/*
	Fetch titles from the current list
*/
const prepare_results = (source) => {
	const results = [];
	source((tiddler,title) => results.push(title));
	return results;
};

/*
Order a list
*/
exports.order = function(source,operator,options) {
	const results = prepare_results(source);
	return operator.operand.toLowerCase() === "reverse" ?
		results.reverse() :
		results;
};

/*
Reverse list
*/
exports.reverse = function(source,operator,options) {
	return prepare_results(source).reverse();
};

/*
First entry/entries in list
*/
exports.first = function(source,operator,options) {
	const count = $tw.utils.getInt(operator.operand,1);
	return prepare_results(source).slice(0,count);
};

/*
Last entry/entries in list
*/
exports.last = function(source,operator,options) {
	const count = $tw.utils.getInt(operator.operand,1);
	return count === 0 ?
		[] :
		prepare_results(source).slice(-count);
};

/*
All but the first entry/entries of the list
*/
exports.rest = function(source,operator,options) {
	const count = $tw.utils.getInt(operator.operand,1);
	return prepare_results(source).slice(count);
};
exports.butfirst = exports.rest;
exports.bf = exports.rest;

/*
All but the last entry/entries of the list
*/
exports.butlast = function(source,operator,options) {
	const count = $tw.utils.getInt(operator.operand,1),
		results = prepare_results(source),
		index = count === 0 ? results.length : -count;
	return results.slice(0,index);
};
exports.bl = exports.butlast;

/*
The nth member of the list
*/
exports.nth = function(source,operator,options) {
	const count = $tw.utils.getInt(operator.operand,1);
	return prepare_results(source).slice(count - 1,count);
};

/*
The zero based nth member of the list
*/
exports.zth = function(source,operator,options) {
	const count = $tw.utils.getInt(operator.operand,0);
	return prepare_results(source).slice(count,count + 1);
};