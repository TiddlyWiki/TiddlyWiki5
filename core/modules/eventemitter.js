/*\
title: $:/core/modules/eventemitter.js
type: application/javascript
module-type: global

Adds an EventEmitter class which may be used on both the server and client

\*/

(function () {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function EventEmitter() {
  this.eventListeners = Object.create(null);
}


// Copy the three functions from wiki.js

EventEmitter.prototype.addEventListener = function(type,listener) {
	this.eventListeners = this.eventListeners || {};
	this.eventListeners[type] = this.eventListeners[type]  || [];
	this.eventListeners[type].push(listener);	
};

EventEmitter.prototype.removeEventListener = function(type,listener) {
	var listeners = this.eventListeners[type];
	if(listeners) {
		var p = listeners.indexOf(listener);
		if(p !== -1) {
			listeners.splice(p,1);
		}
	}
};

EventEmitter.prototype.dispatchEvent = function(type /*, args */) {
	var args = Array.prototype.slice.call(arguments,1),
		listeners = this.eventListeners[type];
	if(listeners) {
		for(var p=0; p<listeners.length; p++) {
			var listener = listeners[p];
			listener.apply(listener,args);
		}
	}
};

// Add the lovely shorthand method names for these three

EventEmitter.prototype.on = WikiMethod.addEventListener;
EventEmitter.prototype.off = WikiMethod.removeEventListener;
EventEmitter.prototype.emit = WikiMethod.dispatchEvent;

exports.EventEmitter = EventEmitter;

})();
