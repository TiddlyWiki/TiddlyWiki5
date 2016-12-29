/*\
title: $:/core/modules/savers/beaker.js
type: application/javascript
module-type: saver

Saves files using the Beaker browser's (https://beakerbrowser.com) Dat protocol (https://datproject.org/)

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
	var url = (location.toString()).split("#")[0];
	dat.stat(url).then(function(value) {
		if(value.type === "directory") {
			url = url + "/index.html";
		}
		dat.writeFile(url,text,"utf8").then(function(value) {
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
	return !!window.dat;
};

/*
Create an instance of this saver
*/
exports.create = function(wiki) {
	return new BeakerSaver(wiki);
};

})();
