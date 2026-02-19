/*\
title: $:/core/modules/filters/x-listops.js
type: application/javascript
module-type: filteroperator
\*/

	"use strict";

	var prepare_results = function (source) {
	var results = [];
		source(function (tiddler, title) {
			results.push(title);
		});
		return results;
	};

	exports.putbefore = function (source, operator) {
		var results = prepare_results(source),
			index = results.indexOf(operator.operand),
			count = $tw.utils.getInt(operator.suffix,1);
		return (index === -1) ?
			results.slice(0, -1) :
			results.slice(0, index).concat(results.slice(-count)).concat(results.slice(index, -count));
	};

	exports.putafter = function (source, operator) {
		var results = prepare_results(source),
			index = results.indexOf(operator.operand),
			count = $tw.utils.getInt(operator.suffix,1);
		return (index === -1) ?
			results.slice(0, -1) :
			results.slice(0, index + 1).concat(results.slice(-count)).concat(results.slice(index + 1, -count));
	};

	exports.replace = function (source, operator) {
		var results = prepare_results(source),
			index = results.indexOf(operator.operand),
			count = $tw.utils.getInt(operator.suffix,1);
		return (index === -1) ?
			results.slice(0, -count) :
			results.slice(0, index).concat(results.slice(-count)).concat(results.slice(index + 1, -count));
	};

	exports.putfirst = function (source, operator) {
		var results = prepare_results(source),
			count = $tw.utils.getInt(operator.suffix,1);
		return results.slice(-count).concat(results.slice(0, -count));
	};

	exports.putlast = function (source, operator) {
		var results = prepare_results(source),
			count = $tw.utils.getInt(operator.suffix,1);
		return results.slice(count).concat(results.slice(0, count));
	};

	exports.move = function (source, operator) {
		var results = prepare_results(source),
			index = results.indexOf(operator.operand),
			count = $tw.utils.getInt(operator.suffix,1),
			marker = results.splice(index, 1),
			offset =  (index + count) > 0 ? index + count : 0;
		return results.slice(0, offset).concat(marker).concat(results.slice(offset));
	};

	exports.allafter = function (source, operator) {
		var results = prepare_results(source),
			index = results.indexOf(operator.operand);
		return (index === -1) ? [] :
			(operator.suffix) ? results.slice(index) :
			results.slice(index + 1);
	};

	exports.allbefore = function (source, operator) {
		var results = prepare_results(source),
			index = results.indexOf(operator.operand);
		return (index === -1) ? [] :
			(operator.suffix) ? results.slice(0, index + 1) :
			results.slice(0, index);
	};

	exports.append = function (source, operator) {
		var append = $tw.utils.parseStringArray(operator.operand, "true"),
			results = prepare_results(source),
			count = parseInt(operator.suffix) || append.length;
		return (append.length === 0) ? results :
			(operator.prefix) ? results.concat(append.slice(-count)) :
			results.concat(append.slice(0, count));
	};

	exports.prepend = function (source, operator) {
		var prepend = $tw.utils.parseStringArray(operator.operand, "true"),
			results = prepare_results(source),
			count = $tw.utils.getInt(operator.suffix,prepend.length);
		return (prepend.length === 0) ? results :
			(operator.prefix) ? prepend.slice(-count).concat(results) :
			prepend.slice(0, count).concat(results);
	};

	exports.remove = function (source, operator) {
		var array = $tw.utils.parseStringArray(operator.operand, "true"),
			results = prepare_results(source),
			count = parseInt(operator.suffix) || array.length,
			p,
			len,
			index;
		len = array.length - 1;
		for (p = 0; p < count; ++p) {
			if (operator.prefix) {
				index = results.indexOf(array[len - p]);
			} else {
				index = results.indexOf(array[p]);
			}
			if (index !== -1) {
				results.splice(index, 1);
			}
		}
		return results;
	};

	exports.sortby = function (source, operator) {
		var results = prepare_results(source);
		if (!results || results.length < 2) {
			return results;
		}
		var lookup = $tw.utils.parseStringArray(operator.operand, "true");
		results.sort(function (a, b) {
			return lookup.indexOf(a) - lookup.indexOf(b);
		});
		return results;
	};

	exports.unique = function (source, operator) {
		var results = prepare_results(source);
		var set = results.reduce(function (a, b) {
			if (a.indexOf(b) < 0) {
				a.push(b);
			}
			return a;
		}, []);
		return set;
	};

	var cycleValueInArray = function(results,operands,stepSize) {
		var resultsIndex,
			step = stepSize || 1,
			i = 0,
			opLength = operands.length,
			nextOperandIndex;
		for(i; i < opLength; i++) {
			resultsIndex = results.indexOf(operands[i]);
			if(resultsIndex !== -1) {
				break;
			}
		}
		if(resultsIndex !== -1) {
			i = i + step;
			nextOperandIndex = (i < opLength ? i : i % opLength);
			if(operands.length > 1) {
				results.splice(resultsIndex,1,operands[nextOperandIndex]);
			} else {
				results.splice(resultsIndex,1);
			}
		} else {
			results.push(operands[0]);
		}
		return results;
	}

	exports.toggle = function(source,operator) {
		return cycleValueInArray(prepare_results(source),operator.operands);
	}

	exports.cycle = function(source,operator) {
		var results = prepare_results(source),
			operands = (operator.operand.length ? $tw.utils.parseStringArray(operator.operand, "true") : [""]),
			step = $tw.utils.getInt(operator.operands[1]||"",1);
		if(step < 0) {
			operands.reverse();
			step = Math.abs(step);
		}
		return cycleValueInArray(results,operands,step);
	}
