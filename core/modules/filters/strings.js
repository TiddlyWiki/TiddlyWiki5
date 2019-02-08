/*\
title: $:/core/modules/filters/strings.js
type: application/javascript
module-type: filteroperator

Filter operators for strings. Unary/binary operators work on each item in turn, and return a new item list.

Sum/product/maxall/minall operate on the entire list, returning a single item.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.length = makeStringBinaryOperator(
	function(a) {return ["" + ("" + a).length];}
);

exports.uppercase = makeStringBinaryOperator(
	function(a) {return [("" + a).toUpperCase()];}
);

exports.lowercase = makeStringBinaryOperator(
	function(a) {return [("" + a).toLowerCase()];}
);

exports.trim = makeStringBinaryOperator(
	function(a) {return [$tw.utils.trim(a)];}
);

exports.concat = makeStringBinaryOperator(
	function(a,b) {return ["" + a + b];}
);

exports.split = makeStringBinaryOperator(
	function(a,b) {return ("" + a).split(b).filter(function(str) {return !!str;});}
);

exports.join = makeStringArrayOperator(
	function(accumulator,value,operand) {
		return "" + (accumulator ? accumulator + (operand || "") + value : value);
	}
);

function makeStringBinaryOperator(fnCalc) {
	return function(source,operator,options) {
		var result = [];
		source(function(tiddler,title) {
			Array.prototype.push.apply(result,fnCalc(title,operator.operand || ""));
		});
		return result;
	};
}

function makeStringArrayOperator(fnCalc,initialValue) {
	initialValue = initialValue || "";
	return function(source,operator,options) {
		var result = [];
		source(function(tiddler,title) {
			result.push(title);
		});
		return [result.reduce(function(accumulator,currentValue) {
			return fnCalc(accumulator,currentValue,operator.operand || "");
		},initialValue)];
	};
}

})();
