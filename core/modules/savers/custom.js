/*\
title: $:/core/modules/savers/custom.js
type: application/javascript
module-type: saver

Looks for `window.$tw.customSaver` first on the current window, then
on the parent window (of an iframe). If present, the saver must define
	save: function(text,method,callback) { ... }
and the saver may define
	priority: number
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var findSaver = function(window) {
	try {
		return window && window.$tw && window.$tw.customSaver;
	} catch (err) {
		// Catching the exception is the most reliable way to detect cross-origin iframe errors.
		// For example, instead of saying that `window.parent.$tw` is undefined, Firefox will throw
		//   Uncaught DOMException: Permission denied to access property "$tw" on cross-origin object
		console.log({ msg: "custom saver is disabled", reason: err });
		return null;
	}
}
var saver = findSaver(window) || findSaver(window.parent) || {};

var CustomSaver = function(wiki) {
};

CustomSaver.prototype.save = function(text,method,callback) {
	return saver.save(text, method, callback);
};

/*
Information about this saver
*/
CustomSaver.prototype.info = {
	name: "custom",
	priority: saver.priority || 4000,
	capabilities: ["save","autosave"]
};

/*
Static method that returns true if this saver is capable of working
*/
exports.canSave = function(wiki) {
	return !!(saver.save);
};

/*
Create an instance of this saver
*/
exports.create = function(wiki) {
	return new CustomSaver(wiki);
};
})();
