/*\
title: $:/core/modules/savers/tiddloid.js
type: application/javascript
module-type: saver
Handles saving changes via the Tiddloid Android app
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false, netscape: false, Components: false */
"use strict";

var Tiddloid = function(wiki) {
};

Tiddloid.prototype.save = function(text,method,callback) {
  if (method === "download") window.twi.saveDownload(text);
	else window.twi.saveWiki(text);
	callback(null);
	return true;
};

/*
Information about this saver
*/
Tiddloid.prototype.info = {
	name: "tiddloid",
	priority: 1800,
	capabilities: ["save", "autosave", "download"]
};

/*
Static method that returns true if this saver is capable of working
*/
exports.canSave = function(wiki) {
	return !!window.twi && !!window.twi.saveWiki;
};

/*
Create an instance of this saver
*/
exports.create = function(wiki) {
	return new Tiddloid(wiki);
};

})();
