/*\
title: $:/core/modules/savers/hyperdrive.js
type: application/javascript
module-type: saver

Saves files using the Hyperdrive Protocol (https://hypercore-protocol.org/#hyperdrive) Beaker browser beta-1.0 and later (https://beakerbrowser.com)
Compatible with beaker >= V1.0.0

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Set up the saver
*/
var HyperdriveSaver = function(wiki) {
	this.wiki = wiki;
};

HyperdriveSaver.prototype.save = function(text,method,callback) {
	var dat = beaker.hyperdrive.drive("" + window.location),
		pathname = ("" + window.location.pathname).split("#")[0];
	dat.stat(pathname).then(function(value) {
		if(value.isDirectory()) {
			pathname = pathname + "/index.html";
		}
		dat.writeFile(pathname,text,"utf8").then(function(value) {
			callback(null);
		},function(reason) {
			callback("Hyperdrive Saver Write Error: " + reason);
		});
	},function(reason) {
		callback("Hyperdrive Saver Stat Error: " + reason);
	});
	return true;
};

/*
Information about this saver
*/
HyperdriveSaver.prototype.info = {
	name: "beaker-1.x",
	priority: 3000,
	capabilities: ["save", "autosave"]
};

/*
Static method that returns true if this saver is capable of working
*/
exports.canSave = function(wiki) {
	return !!window.beaker && !!beaker.hyperdrive && location.protocol==="hyper:";
};

/*
Create an instance of this saver
*/
exports.create = function(wiki) {
	return new HyperdriveSaver(wiki);
};

})();
