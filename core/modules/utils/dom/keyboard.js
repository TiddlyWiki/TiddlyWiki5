/*\
title: $:/core/modules/utils/dom/keyboard.js
type: application/javascript
module-type: utils

Keyboard utilities

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var namedKeys = {
	"backspace": 8,
	"tab": 9,
	"enter": 13,
	"escape": 27
};

/*
Parses a key descriptor into the structure:
{
	keyCode: numeric keycode
	shiftKey: boolean
	altKey: boolean
	ctrlKey: boolean
}
Key descriptors have the following format:
	ctrl+enter
	ctrl+shift+alt+A
*/
exports.parseKeyDescriptor = function(keyDescriptor) {
	var components = keyDescriptor.split("+"),
		info = {
			keyCode: 0,
			shiftKey: false,
			altKey: false,
			ctrlKey: false
		};
	for(var t=0; t<components.length; t++) {
		var s = components[t].toLowerCase();
		// Look for modifier keys
		if(s === "ctrl") {
			info.ctrlKey = true;
		} else if(s === "shift") {
			info.shiftKey = true;
		} else if(s === "alt") {
			info.altKey = true;
		} else if(s === "meta") {
			info.metaKey = true;
		}
		// Replace named keys with their code
		if(namedKeys[s]) {
			info.keyCode = namedKeys[s];
		}
	}
	return info;
};

exports.checkKeyDescriptor = function(event,keyInfo) {
	return event.keyCode === keyInfo.keyCode && 
			event.shiftKey === keyInfo.shiftKey && 
			event.altKey === keyInfo.altKey && 
			event.ctrlKey === keyInfo.ctrlKey && 
			event.metaKey === keyInfo.metaKey;	
};

})();
