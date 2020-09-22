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

exports.sentencecase = makeStringBinaryOperator(
	function(a) {return [$tw.utils.toSentenceCase(a)];}
);

exports.titlecase = makeStringBinaryOperator(
	function(a) {return [$tw.utils.toTitleCase(a)];}
);

exports.trim = makeStringBinaryOperator(
	function(a) {return [$tw.utils.trim(a)];}
);

exports.split = makeStringBinaryOperator(
	function(a,b) {return ("" + a).split(b);}
);

exports.join = makeStringReducingOperator(
	function(accumulator,value,operand) {
		if(accumulator === null) {
			return value;
		} else {
			return accumulator + operand + value;
		}
	},null
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

function makeStringReducingOperator(fnCalc,initialValue) {
	return function(source,operator,options) {
		var result = [];
		source(function(tiddler,title) {
			result.push(title);
		});
		return [result.reduce(function(accumulator,currentValue) {
			return fnCalc(accumulator,currentValue,operator.operand || "");
		},initialValue) || ""];
	};
}

exports.splitregexp = function(source,operator,options) {
	var result = [],
		suffix = operator.suffix || "",
		flags = (suffix.indexOf("m") !== -1 ? "m" : "") + (suffix.indexOf("i") !== -1 ? "i" : ""),
		regExp;
	try {
		regExp = new RegExp(operator.operand || "",flags);		
	} catch(ex) {
		return ["RegExp error: " + ex];
	}
	source(function(tiddler,title) {
		Array.prototype.push.apply(result,title.split(regExp));
	});		
	return result;
};

})();
