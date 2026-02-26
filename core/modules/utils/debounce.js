/*\
title: $:/core/modules/utils/debounce.js
type: application/javascript
module-type: utils

\*/

/*
Creates a debounced function that delays invoking func until after wait milliseconds 
have elapsed since the last time the debounced function was invoked.

func: function to debounce
wait: milliseconds to wait before invoking func
immediate: if true, trigger function on the leading edge instead of trailing
*/
exports.debounce = (func, wait, immediate) => {
	let timeout;
	let lastContext;
	let lastArgs;
	const debounced = function() {
		lastContext = this;
		lastArgs = arguments;
		const callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			timeout = null;
			if(!immediate) {
				func.apply(lastContext, lastArgs);
			}
		}, wait);
		if(callNow) {
			func.apply(lastContext, lastArgs);
		}
	};
	/*
	Immediately execute the pending debounced call (if any) and clear the timer.
	Safe to call even when nothing is pending.
	*/
	debounced.flush = function() {
		if(timeout) {
			clearTimeout(timeout);
			timeout = null;
			func.apply(lastContext, lastArgs);
		}
	};
	/*
	Cancel the pending debounced call without executing it.
	*/
	debounced.cancel = function() {
		clearTimeout(timeout);
		timeout = null;
	};
	return debounced;
};
