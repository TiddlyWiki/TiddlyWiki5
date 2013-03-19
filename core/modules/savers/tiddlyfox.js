/*\
title: $:/core/modules/savers/tiddlyfox.js
type: application/javascript
module-type: saver

Handles saving changes via the TiddlyFox file extension

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false, netscape: false, Components: false */
"use strict";

var TiddlyFoxSaver = function(wiki) {
};

TiddlyFoxSaver.prototype.save = function(text) {
	var messageBox = document.getElementById("tiddlyfox-message-box");
	if(messageBox) {
		// Create the message element and put it in the message box
		var message = document.createElement("div");
		message.setAttribute("data-tiddlyfox-path",decodeURIComponent(document.location.pathname));
		message.setAttribute("data-tiddlyfox-content",text);
		messageBox.appendChild(message);
		// Create and dispatch the custom event to the extension
		var event = document.createEvent("Events");
		event.initEvent("tiddlyfox-save-file",true,false);
		message.dispatchEvent(event);
		return true;
	} else {
		return false;
	}
};

/*
Information about this saver
*/
TiddlyFoxSaver.prototype.info = {
	name: "tiddlyfox",
	priority: 1500
};

/*
Static method that returns true if this saver is capable of working
*/
exports.canSave = function(wiki) {
	return (window.location.protocol === "file:");
};

/*
Create an instance of this saver
*/
exports.create = function(wiki) {
	return new TiddlyFoxSaver(wiki);
};

})();
