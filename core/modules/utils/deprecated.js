/*\
title: $:/core/modules/utils/deprecated.js
type: application/javascript
module-type: utils

Deprecated util functions. These preserve the pre-5.4.0 signatures and
behaviour for backwards compatibility with plugins and external scripts.
Prefer modern alternatives in new code (Array.prototype methods, classList,
Math.sign, String.prototype.repeat, etc.).

\*/

exports.logTable = (data) => console.table(data);

/*
Repeats a string
*/
exports.repeat = function(str,count) {
	var result = "";
	for(var t=0;t<count;t++) {
		result += str;
	}
	return result;
};

/*
Check if a string starts with another string
*/
exports.startsWith = function(str,search) {
	return str.substring(0, search.length) === search;
};

/*
Check if a string ends with another string
*/
exports.endsWith = function(str,search) {
	return str.substring(str.length - search.length) === search;
};

/*
Trim whitespace from the start and end of a string
*/
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

exports.stringifyNumber = function(num) {
	return num + "";
};

/*
Useful for finding out the fully escaped CSS selector equivalent to a given tag. For example:
$tw.utils.tagToCssSelector("$:/tags/Stylesheet") --> tc-tagged-\%24\%3A\%2Ftags\%2FStylesheet
*/
exports.tagToCssSelector = function(tagName) {
	return "tc-tagged-" + encodeURIComponent(tagName).replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^`{\|}~,]/mg,function(c) {
		return "\\" + c;
	});
};

/*
Determines whether element 'a' contains element 'b'.
Returns false when a === b (matches the original John Resig semantics).
*/
exports.domContains = function(a,b) {
	return a !== b && a.contains(b);
};

exports.domMatchesSelector = (node,selector) => node.matches(selector);

exports.hasClass = function(el,className) {
	return !!(el && el.classList && el.classList.contains(className));
};

// addClass/removeClass/toggleClass use classList with whitespace-token support,
// matching the behaviour of the original setAttribute("class", ...) code which
// accepted multi-token class strings like "foo bar". See
// https://github.com/TiddlyWiki/TiddlyWiki5/pull/9251 regression fix.
function splitClasses(className) {
	return (typeof className === "string" && className.match(/\S+/g)) || [];
}

exports.addClass = function(el,className) {
	if(!el.classList) return;
	splitClasses(className).forEach(function(c) { el.classList.add(c); });
};

exports.removeClass = function(el,className) {
	if(!el.classList) return;
	splitClasses(className).forEach(function(c) { el.classList.remove(c); });
};

exports.toggleClass = function(el,className,status) {
	if(!el.classList) return;
	splitClasses(className).forEach(function(c) { el.classList.toggle(c,status); });
};

exports.getLocationPath = function() {
	return window.location.toString().split("#")[0];
};
