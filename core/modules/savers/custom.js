/*\
title: $:/core/modules/savers/custom.js
type: application/javascript
module-type: saver
\*/

"use strict";

var findSaver = function(window) {
	try {
		return window && window.$tw && window.$tw.customSaver;
	} catch (err) {
		// Catching the exception is the most reliable way to detect cross-origin iframe errors.

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

CustomSaver.prototype.info = {
	name: "custom",
	priority: saver.priority || 4000,
	capabilities: ["save","autosave"]
};

exports.canSave = function(wiki) {
	return !!(saver.save);
};

exports.create = function(wiki) {
	return new CustomSaver(wiki);
};
