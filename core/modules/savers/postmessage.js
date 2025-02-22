/*\
title: $:/core/modules/savers/postmessage.js
type: application/javascript
module-type: saver

Handles saving changes via window.postMessage() to the window.parent

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Select the appropriate saver module and set it up
*/
var PostMessageSaver = function(wiki) {
	this.publisher = new $tw.utils.BrowserMessagingPublisher({type: "SAVE"});
};

PostMessageSaver.prototype.save = function(text,method,callback,options) {
	// Fail if the publisher hasn't been fully initialised
	if(!this.publisher.canSend()) {
		return false;
	}
	// Send the save request
	this.publisher.send({
		verb: "SAVE",
		body: text
	},function(err) {
		if(err) {
			callback("PostMessageSaver Error: " + err);
		} else {
			callback(null);
		}
	});
	// Indicate that we handled the save
	return true;
};

/*
Information about this saver
*/
PostMessageSaver.prototype.info = {
	name: "postmessage",
	capabilities: ["save", "autosave"],
	priority: 100
};

/*
Static method that returns true if this saver is capable of working
*/
exports.canSave = function(wiki) {
	// Provisionally say that we can save
	return true;
};

/*
Create an instance of this saver
*/
exports.create = function(wiki) {
	return new PostMessageSaver(wiki);
};

})();
