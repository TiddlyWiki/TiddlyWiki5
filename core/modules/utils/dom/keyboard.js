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
	metaKey: boolean
}
Key descriptors have the following format:
	ctrl+enter
	ctrl+shift+alt+A
*/
exports.parseKeyDescriptor = function(keyDescriptor) {
	var components = keyDescriptor.split(/\+|\-/),
		info = {
			keyCode: 0,
			shiftKey: false,
			altKey: false,
			ctrlKey: false,
			metaKey: false
		};
	for(var t=0; t<components.length; t++) {
		var s = components[t].toLowerCase(),
			c = s.charCodeAt(0);
		// Look for modifier keys
		if(s === "ctrl") {
			info.ctrlKey = true;
		} else if(s === "shift") {
			info.shiftKey = true;
		} else if(s === "alt") {
			info.altKey = true;
		} else if(s === "meta" || s === "cmd" || s === "win") {
			info.metaKey = true;
		}
		// Replace named keys with their code
		if(namedKeys[s]) {
			info.keyCode = namedKeys[s];
		}
		// Replace letters with their code
		if(s.length === 1 && c >= 97 && c <= 122) { // a...z
			info.keyCode = c - 32;
		}
		// Replace digits with their code
		if(s.length === 1 && c >= 48 && c <= 57) { // 0...9
			info.keyCode = c;
		}
	}
	return info;
};

/*
Parse a list of key descriptors into an array of keyInfo objects. The key descriptors can be passed as an array of strings or a space separated string
*/
exports.parseKeyDescriptors = function(keyDescriptors,options) {
	options = options || {};
	options.stack = options.stack || [];
	var wiki = options.wiki || $tw.wiki;
	if(keyDescriptors === "") {
		return [];
	}
	if(!$tw.utils.isArray(keyDescriptors)) {
		keyDescriptors = keyDescriptors.split(" ");
	}
	var result = [];
	$tw.utils.each(keyDescriptors,function(keyDescriptor) {
		// Look for a named shortcut
		if(keyDescriptor.substr(0,2) === "((" && keyDescriptor.substr(-2,2) === "))") {
			if(options.stack.indexOf(keyDescriptor) === -1) {
				options.stack.push(keyDescriptor);
				var name = keyDescriptor.substring(2,keyDescriptor.length - 2),
					lookupName = function(configName) {
						var keyDescriptors = wiki.getTiddlerText("$:/config/" + configName + "/" + name);
						if(keyDescriptors) {
							result.push.apply(result,$tw.utils.parseKeyDescriptors(keyDescriptors,options));
						}
					};
				lookupName("shortcuts");
				lookupName($tw.platform.isMac ? "shortcuts-mac" : "shortcuts-not-mac");
				lookupName($tw.platform.isWindows ? "shortcuts-windows" : "shortcuts-not-windows");
				lookupName($tw.platform.isLinux ? "shortcuts-linux" : "shortcuts-not-linux");
			}
		} else {
			result.push($tw.utils.parseKeyDescriptor(keyDescriptor));
		}
	});
	return result;
};

exports.getPrintableShortcuts = function(keyInfoArray) {
	var result = [],
		metaKeyName = $tw.platform.isMac ? "cmd-" : "win-";
	$tw.utils.each(keyInfoArray,function(keyInfo) {
		result.push((keyInfo.ctrlKey ? "ctrl-" : "") + 
			   (keyInfo.shiftKey ? "shift-" : "") + 
			   (keyInfo.altKey ? "alt-" : "") + 
			   (keyInfo.metaKey ? metaKeyName : "") + 
			   (String.fromCharCode(keyInfo.keyCode)));
	});
	return result;
}

exports.checkKeyDescriptor = function(event,keyInfo) {
	return event.keyCode === keyInfo.keyCode && 
			event.shiftKey === keyInfo.shiftKey && 
			event.altKey === keyInfo.altKey && 
			event.ctrlKey === keyInfo.ctrlKey && 
			event.metaKey === keyInfo.metaKey;
};

exports.checkKeyDescriptors = function(event,keyInfoArray) {
	for(var t=0; t<keyInfoArray.length; t++) {
		if($tw.utils.checkKeyDescriptor(event,keyInfoArray[t])) {
			return true;
		}
	}
	return false;
};

})();
