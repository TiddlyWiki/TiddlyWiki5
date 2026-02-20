/*\
title: $:/core/modules/utils/deprecated.js
type: application/javascript
module-type: utils

Deprecated util functions

\*/

exports.logTable = (data) => console.table(data);

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

exports.hopArray = (object,array) => array.some((element) => $tw.utils.hop(object,element));

exports.sign = Math.sign;

exports.strEndsWith = (str,ending,position) => str.endsWith(ending,position);

exports.stringifyNumber = (num) => num.toString();

exports.tagToCssSelector = function(tagName) {
	return "tc-tagged-" + encodeURIComponent(tagName).replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^`{\|}~,]/mg,function(c) {
		return "\\" + c;
	});
};

exports.domContains = (a,b) => a.compareDocumentPosition(b) & 16;

exports.domMatchesSelector = (node,selector) => node.matches(selector);

exports.hasClass = (el,className) => el.classList && el.classList.contains(className);

exports.addClass = function(el,className) {
	el.classList && className && el.classList.add(className);
};

exports.removeClass = function(el,className) {
	el.classList && className && el.classList.remove(className);
};

exports.toggleClass = function(el,className,status) {
	el.classList && className && el.classList.toggle(className, status);
};

exports.getLocationPath = () => window.location.origin + window.location.pathname;