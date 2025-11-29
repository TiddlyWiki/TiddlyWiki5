/*\
title: $:/core/modules/utils/messaging.js
type: application/javascript
module-type: utils-browser

Messaging utilities for use with window.postMessage() etc.

This module intentionally has no dependencies so that it can be included in non-TiddlyWiki projects

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var RESPONSE_TIMEOUT = 2 * 1000;

/*
Class to handle subscribing to publishers

target: Target window (eg iframe.contentWindow)
type: String indicating type of item for which subscriptions are being provided (eg "SAVING")
onsubscribe: Function to be invoked with err parameter when the subscription is established, or there is a timeout
onmessage: Function to be invoked when a new message arrives, invoked with (data,callback). The callback is invoked with the argument (response)
*/
function BrowserMessagingSubscriber(options) {
	var self = this;
	this.target = options.target;
	this.type = options.type;
	this.onsubscribe = options.onsubscribe || function() {};
	this.onmessage = options.onmessage;
	this.hasConfirmed = false;
	this.channel = new MessageChannel();
	this.channel.port1.addEventListener("message",function(event) {
		if(this.timerID) {
			clearTimeout(this.timerID);
			this.timerID = null;		
		}
		if(event.data) {
			if(event.data.verb === "SUBSCRIBED") {
				self.hasConfirmed = true;
				self.onsubscribe(null);
			} else if(event.data.verb === self.type) {
				self.onmessage(event.data,function(response) {
					// Send the response back on the supplied port, and then close it
					event.ports[0].postMessage(response);
					event.ports[0].close();
				});
			}
		}
	});
	// Set a timer so that if we don't hear from the iframe before a timeout we alert the user
	this.timerID = setTimeout(function() {
		if(!self.hasConfirmed) {
			self.onsubscribe("NO_RESPONSE");				
		}
	},RESPONSE_TIMEOUT);
	this.channel.port1.start();
	this.target.postMessage({verb: "SUBSCRIBE",to: self.type},"*",[this.channel.port2]);
}

exports.BrowserMessagingSubscriber = BrowserMessagingSubscriber;

/*
Class to handle publishing subscriptions

type: String indicating type of item for which subscriptions are being provided (eg "SAVING")
onsubscribe: Function to be invoked when a subscription occurs
*/
function BrowserMessagingPublisher(options) {
	var self = this;
	this.type = options.type;
	this.hostIsListening = false;
	this.port = null;
	// Listen to connection requests from the host
	window.addEventListener("message",function(event) {
		if(event.data && event.data.verb === "SUBSCRIBE" && event.data.to === self.type) {
			self.hostIsListening = true;
			// Acknowledge
			self.port = event.ports[0];
			self.port.postMessage({verb: "SUBSCRIBED", to: self.type});
			if(options.onsubscribe) {
				options.onsubscribe(event.data);
			}
		}
	});
}

BrowserMessagingPublisher.prototype.canSend = function() {
	return !!this.hostIsListening && !!this.port;
};

BrowserMessagingPublisher.prototype.send = function(data,callback) {
	var self = this;
	callback = callback || function() {};
	// Check that we've been initialised by the host
	if(!this.hostIsListening || !this.port) {
		return false;
	}
	// Create a channel for the confirmation
	var channel = new MessageChannel();
	channel.port1.addEventListener("message",function(event) {
		if(event.data && event.data.verb === "OK") {
			callback(null);
		} else {
			callback("BrowserMessagingPublisher for " +  self.type + " error: " + (event.data || {}).verb);
		}
		channel.port1.close();
	});
	channel.port1.start();
	// Send the save request with the port for the response
	this.port.postMessage(data,[channel.port2]);
};

BrowserMessagingPublisher.prototype.close = function() {
	if(this.port) {
		this.port.close();
		this.hostIsListening = false;
		this.port = null;		
	}
};

exports.BrowserMessagingPublisher = BrowserMessagingPublisher;

})();
