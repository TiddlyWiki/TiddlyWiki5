/*\
title: $:/core/modules/filters/listops.js
type: application/javascript
module-type: filteroperator

Filter operators for manipulating the current selection list

\*/

"use strict";

/*
Order a list
*/
exports.order = function(source,operator,options) {
	var results = [];
	if(operator.operand.toLowerCase() === "reverse") {
		source(function(tiddler,title) {
			results.unshift(title);
		});
	} else {
		source(function(tiddler,title) {
			results.push(title);
		});
	}
	return results;
};

/*
Reverse list
*/
exports.reverse = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.unshift(title);
	});
	return results;
};

/*
First entry/entries in list
*/
exports.first = function(source,operator,options) {
	var count = $tw.utils.getInt(operator.operand,1),
		results = [];
	source(function(tiddler,title) {
		results.push(title);
	});
	return results.slice(0,count);
};

/*
Last entry/entries in list
*/
exports.last = function(source,operator,options) {
	var count = $tw.utils.getInt(operator.operand,1),
		results = [];
	if(count === 0) return results;
	source(function(tiddler,title) {
		results.push(title);
	});
	return results.slice(-count);
};

/*
All but the first entry/entries of the list
*/
exports.rest = function(source,operator,options) {
	var count = $tw.utils.getInt(operator.operand,1),
		results = [];
	source(function(tiddler,title) {
		results.push(title);
	});
	return results.slice(count);
};
exports.butfirst = exports.rest;
exports.bf = exports.rest;

/*
All but the last entry/entries of the list
*/
exports.butlast = function(source,operator,options) {
	var count = $tw.utils.getInt(operator.operand,1),
		results = [];
	source(function(tiddler,title) {
		results.push(title);
	});
	var index = count === 0 ? results.length : -count;
	return results.slice(0,index);
};
exports.bl = exports.butlast;

/*
The nth member of the list
*/
exports.nth = function(source,operator,options) {
	var count = $tw.utils.getInt(operator.operand,1),
		results = [];
	source(function(tiddler,title) {
		results.push(title);
	});
	return results.slice(count - 1,count);
};

/*
The zero based nth member of the list
*/
exports.zth = function(source,operator,options) {
	var count = $tw.utils.getInt(operator.operand,0),
		results = [];
	source(function(tiddler,title) {
		results.push(title);
	});
	return results.slice(count,count + 1);
};
