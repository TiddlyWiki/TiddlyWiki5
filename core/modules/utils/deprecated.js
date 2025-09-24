/*\
title: $:/core/modules/utils/deprecated.js
type: application/javascript
module-type: utils

Deprecated util functions

\*/

exports.logTable = data => console.table(data);

exports.repeat = (str,count) => str.repeat(count);

exports.startsWith = (str,search) => str.startsWith(search);

exports.endsWith = (str,search) => str.endsWith(search);

exports.trim = function(str) {
	if(typeof str === "string") {
		return str.trim();
	} else {
		return str;
	}
};

exports.sign = Math.sign;

exports.strEndsWith = (str,ending,position) => str.endsWith(ending,position);

exports.stringifyNumber = num => num.toString();

exports.domContains = (a,b) => a.compareDocumentPosition(b) & 16;

// Use matches instead
exports.domMatchesSelector = (node,selector) => node.matches(selector);

// Use element.classList.contains instead
exports.hasClass = (el,className) => el.classList && el.classList.contains(className);

// Use element.classList.add instead
exports.addClass = function(el,className) {
	el.classList && el.classList.add(className);
};

// Use element.classList.remove instead
exports.removeClass = function(el,className) {
	el.classList && el.classList.remove(className);
};

// Use element.classList.toggle instead
exports.toggleClass = function(el,className,status) {
	if(status === undefined) {
		el.classList && el.classList.toggle(className);
	} else {
		el.classList && el.classList.toggle(className, status);
	}
};