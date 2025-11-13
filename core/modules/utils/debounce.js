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
	return function() {
		const context = this;
		const args = arguments;
		const later = () => {
			timeout = null;
			if(!immediate) {
				func.apply(context, args);
			}
		};
		const callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if(callNow) {
			func.apply(context, args);
		}
	};
};
