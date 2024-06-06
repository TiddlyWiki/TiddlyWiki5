/*\
title: $:/core/modules/filters/x-listops.js
type: application/javascript
module-type: filteroperator

Extended filter operators to manipulate the current list.

\*/
(function () {

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";

	/*
	Fetch titles from the current list
	*/
	var prepare_results = function (source) {
	var results = [];
		source(function (tiddler, title) {
			results.push(title);
		});
		return results;
	};

	/*
	Moves a number of items from the tail of the current list before the item named in the operand
	*/
	exports.putbefore = function (source, operator) {
		var results = prepare_results(source),
			index = results.indexOf(operator.operand),
			count = $tw.utils.getInt(operator.suffix,1);
		return (index === -1) ?
			results.slice(0, -1) :
			results.slice(0, index).concat(results.slice(-count)).concat(results.slice(index, -count));
	};

	/*
	Moves a number of items from the tail of the current list after the item named in the operand
	*/
	exports.putafter = function (source, operator) {
		var results = prepare_results(source),
			index = results.indexOf(operator.operand),
			count = $tw.utils.getInt(operator.suffix,1);
		return (index === -1) ?
			results.slice(0, -1) :
			results.slice(0, index + 1).concat(results.slice(-count)).concat(results.slice(index + 1, -count));
	};

	/*
	Replaces the item named in the operand with a number of items from the tail of the current list
	*/
	exports.replace = function (source, operator) {
		var results = prepare_results(source),
			index = results.indexOf(operator.operand),
			count = $tw.utils.getInt(operator.suffix,1);
		return (index === -1) ?
			results.slice(0, -count) :
			results.slice(0, index).concat(results.slice(-count)).concat(results.slice(index + 1, -count));
	};

	/*
	Moves a number of items from the tail of the current list to the head of the list
	*/
	exports.putfirst = function (source, operator) {
		var results = prepare_results(source),
			count = $tw.utils.getInt(operator.suffix,1);
		return results.slice(-count).concat(results.slice(0, -count));
	};

	/*
	Moves a number of items from the head of the current list to the tail of the list
	*/
	exports.putlast = function (source, operator) {
		var results = prepare_results(source),
			count = $tw.utils.getInt(operator.suffix,1);
		return results.slice(count).concat(results.slice(0, count));
	};

	/*
	Moves the item named in the operand a number of places forward or backward in the list
	*/
	exports.move = function (source, operator) {
		var results = prepare_results(source),
			index = results.indexOf(operator.operand),
			count = $tw.utils.getInt(operator.suffix,1),
			marker = results.splice(index, 1),
			offset =  (index + count) > 0 ? index + count : 0;
		return results.slice(0, offset).concat(marker).concat(results.slice(offset));
	};

	/*
	Returns the items from the current list that are after the item named in the operand
	*/
	exports.allafter = function (source, operator) {
		var results = prepare_results(source),
			index = results.indexOf(operator.operand);
		return (index === -1) ? [] :
			(operator.suffix) ? results.slice(index) :
			results.slice(index + 1);
	};

	/*
	Returns the items from the current list that are before the item named in the operand
	*/
	exports.allbefore = function (source, operator) {
		var results = prepare_results(source),
			index = results.indexOf(operator.operand);
		return (index === -1) ? [] :
			(operator.suffix) ? results.slice(0, index + 1) :
			results.slice(0, index);
	};

	/*
	Appends the items listed in the operand array to the tail of the current list
	*/
	exports.append = function (source, operator) {
		var append = $tw.utils.parseStringArray(operator.operand, "true"),
			results = prepare_results(source),
			count = parseInt(operator.suffix) || append.length;
		return (append.length === 0) ? results :
			(operator.prefix) ? results.concat(append.slice(-count)) :
			results.concat(append.slice(0, count));
	};

	/*
	Prepends the items listed in the operand array to the head of the current list
	*/
	exports.prepend = function (source, operator) {
		var prepend = $tw.utils.parseStringArray(operator.operand, "true"),
			results = prepare_results(source),
			count = $tw.utils.getInt(operator.suffix,prepend.length);
		return (prepend.length === 0) ? results :
			(operator.prefix) ? prepend.slice(-count).concat(results) :
			prepend.slice(0, count).concat(results);
	};

	/*
	Returns all items from the current list except the items listed in the operand array
	*/
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

	/*
	Returns all items from the current list sorted in the order of the items in the operand array
	*/
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

	/*
	Removes all duplicate items from the current list
	*/
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

	/*
	Toggles an item in the current list.
	*/
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

})();
