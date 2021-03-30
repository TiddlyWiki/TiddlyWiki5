/*\
title: $:/core/modules/filters/math.js
type: application/javascript
module-type: filteroperator

Filter operators for math. Unary/binary operators work on each item in turn, and return a new item list.

Sum/product/maxall/minall operate on the entire list, returning a single item.

Note that strings are converted to numbers automatically. Trailing non-digits are ignored.

* "" converts to 0
* "12kk" converts to 12

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.negate = makeNumericBinaryOperator(
	function(a) {return -a}
);

exports.abs = makeNumericBinaryOperator(
	function(a) {return Math.abs(a)}
);

exports.ceil = makeNumericBinaryOperator(
	function(a) {return Math.ceil(a)}
);

exports.floor = makeNumericBinaryOperator(
	function(a) {return Math.floor(a)}
);

exports.round = makeNumericBinaryOperator(
	function(a) {return Math.round(a)}
);

exports.trunc = makeNumericBinaryOperator(
	function(a) {return Math.trunc(a)}
);

exports.untrunc = makeNumericBinaryOperator(
	function(a) {return Math.ceil(Math.abs(a)) * Math.sign(a)}
);

exports.sign = makeNumericBinaryOperator(
	function(a) {return Math.sign(a)}
);

exports.add = makeNumericBinaryOperator(
	function(a,b) {return a + b;}
);

exports.subtract = makeNumericBinaryOperator(
	function(a,b) {return a - b;}
);

exports.multiply = makeNumericBinaryOperator(
	function(a,b) {return a * b;}
);

exports.divide = makeNumericBinaryOperator(
	function(a,b) {return a / b;}
);

exports.remainder = makeNumericBinaryOperator(
	function(a,b) {return a % b;}
);

exports.max = makeNumericBinaryOperator(
	function(a,b) {return Math.max(a,b);}
);

exports.min = makeNumericBinaryOperator(
	function(a,b) {return Math.min(a,b);}
);

exports.fixed = makeNumericBinaryOperator(
	function(a,b) {return Number.prototype.toFixed.call(a,Math.min(Math.max(b,0),100));}
);

exports.precision = makeNumericBinaryOperator(
	function(a,b) {return Number.prototype.toPrecision.call(a,Math.min(Math.max(b,1),100));}
);

exports.exponential = makeNumericBinaryOperator(
	function(a,b) {return Number.prototype.toExponential.call(a,Math.min(Math.max(b,0),100));}
);

exports.power = makeNumericBinaryOperator(
	function(a,b) {return Math.pow(a,b);}
);

exports.log = makeNumericBinaryOperator(
	function(a,b) {
		if(b) {
			return Math.log(a)/Math.log(b);
		} else {
			return Math.log(a);
		}
	}
);

exports.sum = makeNumericReducingOperator(
	function(accumulator,value) {return accumulator + value},
	0 // Initial value
);

exports.product = makeNumericReducingOperator(
	function(accumulator,value) {return accumulator * value},
	1 // Initial value
);

exports.maxall = makeNumericReducingOperator(
	function(accumulator,value) {return Math.max(accumulator,value)},
	-Infinity // Initial value
);

exports.minall = makeNumericReducingOperator(
	function(accumulator,value) {return Math.min(accumulator,value)},
	Infinity // Initial value
);

function makeNumericBinaryOperator(fnCalc) {
	return function(source,operator,options) {
		var result = [],
			numOperand = $tw.utils.parseNumber(operator.operand);
		source(function(tiddler,title) {
			result.push($tw.utils.stringifyNumber(fnCalc($tw.utils.parseNumber(title),numOperand)));
		});
		return result;
	};
}

function makeNumericReducingOperator(fnCalc,initialValue) {
	initialValue = initialValue || 0;
	return function(source,operator,options) {
		var result = [];
		source(function(tiddler,title) {
			result.push(title);
		});
		return [$tw.utils.stringifyNumber(result.reduce(function(accumulator,currentValue) {
			return fnCalc(accumulator,$tw.utils.parseNumber(currentValue));
		},initialValue))];
	};
}

})();
