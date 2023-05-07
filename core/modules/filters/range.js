/*\
title: $:/core/modules/filters/range.js
type: application/javascript
module-type: filteroperator

Filter operator for generating a numeric range.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.range = function(source,operator,options) {
	var results = [];
	// For backwards compatibility, if there is only one operand, try to split it using one of the delimiters
	var parts = operator.operands || [];
	if(parts.length === 1) {
		parts = operator.operand.split(/[,:;]/g);
	}
	// Process the parts
	var beg, end, inc, i, fixed = 0;
	for (i=0; i<parts.length; i++) {
		// Validate real number
		if(!/^\s*[+-]?((\d+(\.\d*)?)|(\.\d+))\s*$/.test(parts[i])) {
			return ["range: bad number \"" + parts[i] + "\""];
		}
		// Count digits; the most precise number determines decimal places in output.
		var frac = /\.\d+/.exec(parts[i]);
		if(frac) {
			fixed = Math.max(fixed,frac[0].length-1);
		}
		parts[i] = parseFloat(parts[i]);
	}
	switch(parts.length) {
		case 1:
			end = parts[0];
			if (end >= 1) {
				beg = 1;
			}
			else if (end <= -1) {
				beg = -1;
			}
			else {
				return [];
			}
			inc = 1;
			break;
		case 2:
			beg = parts[0];
			end = parts[1];
			inc = 1;
			break;
		case 3:
			beg = parts[0];
			end = parts[1];
			inc = Math.abs(parts[2]);
			break;
	}
	if(inc === 0) {
		return ["range: increment 0 causes infinite loop"];
	}
	// May need to count backwards
	var direction = ((end < beg) ? -1 : 1);
	inc *= direction;
	// Estimate number of resulting elements
	if((end - beg) / inc > 10000) {
		return ["range: too many steps (over 10K)"];
	}
	// Avoid rounding error on last step
	end += direction * 0.5 * Math.pow(0.1,fixed);
	var safety = 10010;
	// Enumerate the range
	if (end<beg) {
		for(i=beg; i>end; i+=inc) {
			results.push(i.toFixed(fixed));
			if(--safety<0) {
				break;
			}
		}
	} else {
		for(i=beg; i<end; i+=inc) {
			results.push(i.toFixed(fixed));
			if(--safety<0) {
				break;
			}
		}
	}
	if(safety<0) {
		return ["range: unexpectedly large output"];
	}
	// Reverse?
	if(operator.prefix === "!") {
		results.reverse();
	}
	return results;
};

})();
