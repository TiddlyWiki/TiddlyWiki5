/*\
title: $:/core/modules/savers/dat.js
type: application/javascript
module-type: saver

Saves wiki using the Dat protocol (https://datproject.org/)

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Select the appropriate saver module and set it up
*/
var DatSaver = function(wiki) {
	this.wiki = wiki;
};

DatSaver.prototype.save = function(text,method,callback) {
console.log("Saving Dat")
	dat.writeFile(document.location.protocol + "//" + document.location.hostname + ":" + document.location.port + document.location.pathname,text,"utf8").then(function(value) {
		callback(null);
	},function(reason) {
		callback("Dat Saver Error: " + reason);
	});
	return true;
};

/*
Information about this saver
*/
DatSaver.prototype.info = {
	name: "dat",
	priority: 3000,
	capabilities: ["save", "autosave"]
};

/*
Static method that returns true if this saver is capable of working
*/
exports.canSave = function(wiki) {
	return !!window.dat;
};

/*
Create an instance of this saver
*/
exports.create = function(wiki) {
	return new DatSaver(wiki);
};

})();
