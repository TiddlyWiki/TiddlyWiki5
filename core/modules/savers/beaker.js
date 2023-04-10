/*\
title: $:/core/modules/savers/beaker.js
type: application/javascript
module-type: saver

Saves files using the Beaker browser's (https://beakerbrowser.com) Dat protocol (https://datproject.org/)
Compatible with beaker >= V0.7.2

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Set up the saver
*/
var BeakerSaver = function(wiki) {
	this.wiki = wiki;
};

BeakerSaver.prototype.save = function(text,method,callback) {
	var dat = new DatArchive("" + window.location),
		pathname = ("" + window.location.pathname).split("#")[0];
	dat.stat(pathname).then(function(value) {
		if(value.isDirectory()) {
			pathname = pathname + "/index.html";
		}
		dat.writeFile(pathname,text,"utf8").then(function(value) {
			callback(null);
		},function(reason) {
			callback("Beaker Saver Write Error: " + reason);
		});
	},function(reason) {
		callback("Beaker Saver Stat Error: " + reason);
	});
	return true;
};

/*
Information about this saver
*/
BeakerSaver.prototype.info = {
	name: "beaker",
	priority: 3000,
	capabilities: ["save", "autosave"]
};

/*
Static method that returns true if this saver is capable of working
*/
exports.canSave = function(wiki) {
	return !!window.DatArchive && location.protocol==="dat:";
};

/*
Create an instance of this saver
*/
exports.create = function(wiki) {
	return new BeakerSaver(wiki);
};

})();
