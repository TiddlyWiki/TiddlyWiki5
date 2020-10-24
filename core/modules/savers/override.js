/*\
title: $:/core/modules/savers/override.js
type: application/javascript
module-type: saver

Looks for `window.tiddlyWikiOverrides.saver` first on the current window, then
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
		return window && window.tiddlyWikiOverrides && window.tiddlyWikiOverrides.saver;
	} catch (err) {
		// Probably an iframe on a different domain than its parent.
		console.log({ msg: "override saver is disabled", reason: err });
		return null;
	}
}
var saver = findSaver(window) || findSaver(window.parent) || {};

var OverrideSaver = function(wiki) {
};

OverrideSaver.prototype.save = function(text,method,callback) {
	return saver.save(text, method, callback);
};

/*
Information about this saver
*/
OverrideSaver.prototype.info = {
	name: "override",
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
	return new OverrideSaver(wiki);
};
})();
