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

"use strict";

exports.negate = makeNumericBinaryOperator(
	(a) => {return -a;}
);

exports.abs = makeNumericBinaryOperator(
	(a) => {return Math.abs(a);}
);

exports.ceil = makeNumericBinaryOperator(
	(a) => {return Math.ceil(a);}
);

exports.floor = makeNumericBinaryOperator(
	(a) => {return Math.floor(a);}
);

exports.round = makeNumericBinaryOperator(
	(a) => {return Math.round(a);}
);

exports.trunc = makeNumericBinaryOperator(
	(a) => {return Math.trunc(a);}
);

exports.untrunc = makeNumericBinaryOperator(
	(a) => {return Math.ceil(Math.abs(a)) * Math.sign(a);}
);

exports.sign = makeNumericBinaryOperator(
	(a) => {return Math.sign(a);}
);

exports.add = makeNumericBinaryOperator(
	(a,b) => {return a + b;}
);

exports.subtract = makeNumericBinaryOperator(
	(a,b) => {return a - b;}
);

exports.multiply = makeNumericBinaryOperator(
	(a,b) => {return a * b;}
);

exports.divide = makeNumericBinaryOperator(
	(a,b) => {return a / b;}
);

exports.remainder = makeNumericBinaryOperator(
	(a,b) => {return a % b;}
);

exports.max = makeNumericBinaryOperator(
	(a,b) => {return Math.max(a,b);}
);

exports.min = makeNumericBinaryOperator(
	(a,b) => {return Math.min(a,b);}
);

exports.fixed = makeNumericBinaryOperator(
	(a,b) => {return Number.prototype.toFixed.call(a,Math.min(Math.max(b,0),100));}
);

exports.precision = makeNumericBinaryOperator(
	(a,b) => {return Number.prototype.toPrecision.call(a,Math.min(Math.max(b,1),100));}
);

exports.exponential = makeNumericBinaryOperator(
	(a,b) => {return Number.prototype.toExponential.call(a,Math.min(Math.max(b,0),100));}
);

exports.power = makeNumericBinaryOperator(
	(a,b) => {return a ** b;}
);

exports.log = makeNumericBinaryOperator(
	(a,b) => {
		if(b) {
			return Math.log(a) / Math.log(b);
		} else {
			return Math.log(a);
		}
	}
);

exports.sum = makeNumericReducingOperator(
	(accumulator,value) => {return accumulator + value;},
	0 // Initial value
);

exports.product = makeNumericReducingOperator(
	(accumulator,value) => {return accumulator * value;},
	1 // Initial value
);

exports.maxall = makeNumericReducingOperator(
	(accumulator,value) => {return Math.max(accumulator,value);},
	-Infinity // Initial value
);

exports.minall = makeNumericReducingOperator(
	(accumulator,value) => {return Math.min(accumulator,value);},
	Infinity // Initial value
);

exports.median = makeNumericArrayOperator(
	(values) => {
		const len = values.length; let median;
		values.sort((a,b) => {return a - b;});
		if(len % 2) {
			// Odd, return the middle number
			median = values[(len - 1) / 2];
		} else {
			// Even, return average of two middle numbers
			median = (values[len / 2 - 1] + values[len / 2]) / 2;
		}
		return [median];
	}
);

exports.average = makeNumericReducingOperator(
	(accumulator,value) => {return accumulator + value;},
	0, // Initial value
	(finalValue,numberOfValues) => {
		return finalValue / numberOfValues;
	}
);

exports.variance = makeNumericReducingOperator(
	(accumulator,value) => {return accumulator + value;},
	0,
	(finalValue,numberOfValues,originalValues) => {
		return getVarianceFromArray(originalValues,finalValue / numberOfValues);
	}
);

exports["standard-deviation"] = makeNumericReducingOperator(
	(accumulator,value) => {return accumulator + value;},
	0,
	(finalValue,numberOfValues,originalValues) => {
		const variance = getVarianceFromArray(originalValues,finalValue / numberOfValues);
		return Math.sqrt(variance);
	}
);

//trigonometry
exports.cos = makeNumericBinaryOperator(
	(a) => {return Math.cos(a);}
);

exports.sin = makeNumericBinaryOperator(
	(a) => {return Math.sin(a);}
);

exports.tan = makeNumericBinaryOperator(
	(a) => {return Math.tan(a);}
);

exports.acos = makeNumericBinaryOperator(
	(a) => {return Math.acos(a);}
);

exports.asin = makeNumericBinaryOperator(
	(a) => {return Math.asin(a);}
);

exports.atan = makeNumericBinaryOperator(
	(a) => {return Math.atan(a);}
);

exports.atan2 = makeNumericBinaryOperator(
	(a,b) => {return Math.atan2(a,b);}
);

//Calculate the variance of a population of numbers in an array given its mean
function getVarianceFromArray(values,mean) {
	const deviationTotal = values.reduce((accumulator,value) => {
		return accumulator + (value - mean) ** 2;
	},0);
	return deviationTotal / values.length;
};

function makeNumericBinaryOperator(fnCalc) {
	return function(source,operator,options) {
		const result = [];
		const numOperand = $tw.utils.parseNumber(operator.operand);
		source((tiddler,title) => {
			result.push($tw.utils.stringifyNumber(fnCalc($tw.utils.parseNumber(title),numOperand)));
		});
		return result;
	};
};

function makeNumericReducingOperator(fnCalc,initialValue,fnFinal) {
	initialValue = initialValue || 0;
	return function(source,operator,options) {
		const result = [];
		source((tiddler,title) => {
			result.push($tw.utils.parseNumber(title));
		});
		let value = result.reduce((accumulator,currentValue) => {
			return fnCalc(accumulator,currentValue);
		},initialValue);
		if(fnFinal) {
			value = fnFinal(value,result.length,result);
		}
		return [$tw.utils.stringifyNumber(value)];
	};
};

function makeNumericArrayOperator(fnCalc) {
	return function(source,operator,options) {
		let results = [];
		source((tiddler,title) => {
			results.push($tw.utils.parseNumber(title));
		});
		results = fnCalc(results);
		$tw.utils.each(results,(value,index) => {
			results[index] = $tw.utils.stringifyNumber(value);
		});
		return results;
	};
};
