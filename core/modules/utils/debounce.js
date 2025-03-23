/*\
title: $:/core/modules/utils/debounce.js
type: application/javascript
module-type: utils

Debounce function execution.

Usage:

- func: function to be debounced
- wait: time to wait before executing the function
- immediate: if true, the function is executed immediately

\*/

"use strict";

function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if(!immediate) {
				func.apply(context, args);
			}
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if(callNow) {
			func.apply(context, args);
		}
	};
};

exports.debounce = debounce;
