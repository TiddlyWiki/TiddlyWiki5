/*\
title: $:/core/modules/keyboard.js
type: application/javascript
module-type: global

Keyboard handling utilities

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var namedKeys = {
	"cancel": 3,
	"help": 6,
	"backspace": 8,
	"tab": 9,
	"clear": 12,
	"return": 13,
	"enter": 13,
	"pause": 19,
	"escape": 27,
	"space": 32,
	"page_up": 33,
	"page_down": 34,
	"end": 35,
	"home": 36,
	"left": 37,
	"up": 38,
	"right": 39,
	"down": 40,
	"printscreen": 44,
	"insert": 45,
	"delete": 46,
	"0": 48,
	"1": 49,
	"2": 50,
	"3": 51,
	"4": 52,
	"5": 53,
	"6": 54,
	"7": 55,
	"8": 56,
	"9": 57,
	"firefoxsemicolon": 59,
	"firefoxequals": 61,
	"a": 65,
	"b": 66,
	"c": 67,
	"d": 68,
	"e": 69,
	"f": 70,
	"g": 71,
	"h": 72,
	"i": 73,
	"j": 74,
	"k": 75,
	"l": 76,
	"m": 77,
	"n": 78,
	"o": 79,
	"p": 80,
	"q": 81,
	"r": 82,
	"s": 83,
	"t": 84,
	"u": 85,
	"v": 86,
	"w": 87,
	"x": 88,
	"y": 89,
	"z": 90,
	"numpad0": 96,
	"numpad1": 97,
	"numpad2": 98,
	"numpad3": 99,
	"numpad4": 100,
	"numpad5": 101,
	"numpad6": 102,
	"numpad7": 103,
	"numpad8": 104,
	"numpad9": 105,
	"multiply": 106,
	"add": 107,
	"separator": 108,
	"subtract": 109,
	"decimal": 110,
	"divide": 111,
	"f1": 112,
	"f2": 113,
	"f3": 114,
	"f4": 115,
	"f5": 116,
	"f6": 117,
	"f7": 118,
	"f8": 119,
	"f9": 120,
	"f10": 121,
	"f11": 122,
	"f12": 123,
	"f13": 124,
	"f14": 125,
	"f15": 126,
	"f16": 127,
	"f17": 128,
	"f18": 129,
	"f19": 130,
	"f20": 131,
	"f21": 132,
	"f22": 133,
	"f23": 134,
	"f24": 135,
	"firefoxminus": 173,
	"semicolon": 186,
	"equals": 187,
	"comma": 188,
	"dash": 189,
	"period": 190,
	"slash": 191,
	"backquote": 192,
	"openbracket": 219,
	"backslash": 220,
	"closebracket": 221,
	"quote": 222
};

function KeyboardManager(options) {
	var self = this;
	options = options || "";
	// Save the named key hashmap
	this.namedKeys = namedKeys;
	// Create a reverse mapping of code to keyname
	this.keyNames = [];
	$tw.utils.each(namedKeys,function(keyCode,name) {
		self.keyNames[keyCode] = name.substr(0,1).toUpperCase() + name.substr(1);
	});
	// Save the platform-specific name of the "meta" key
	this.metaKeyName = $tw.platform.isMac ? "cmd-" : "win-";
}

/*
Return an array of keycodes for the modifier keys ctrl, shift, alt, meta
*/
KeyboardManager.prototype.getModifierKeys = function() {
	return [
		16, // Shift
		17, // Ctrl
		18, // Alt
		20, // CAPS LOCK
		91, // Meta (left)
		93, // Meta (right)
		224 // Meta (Firefox)
	]
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
KeyboardManager.prototype.parseKeyDescriptor = function(keyDescriptor) {
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
		if(this.namedKeys[s]) {
			info.keyCode = this.namedKeys[s];
		}
	}
	if(info.keyCode) {
		return info;
	} else {
		return null;
	}
};

/*
Parse a list of key descriptors into an array of keyInfo objects. The key descriptors can be passed as an array of strings or a space separated string
*/
KeyboardManager.prototype.parseKeyDescriptors = function(keyDescriptors,options) {
	var self = this;
	options = options || {};
	options.stack = options.stack || [];
	var wiki = options.wiki || $tw.wiki;
	if(typeof keyDescriptors === "string" && keyDescriptors === "") {
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
							result.push.apply(result,self.parseKeyDescriptors(keyDescriptors,options));
						}
					};
				lookupName("shortcuts");
				lookupName($tw.platform.isMac ? "shortcuts-mac" : "shortcuts-not-mac");
				lookupName($tw.platform.isWindows ? "shortcuts-windows" : "shortcuts-not-windows");
				lookupName($tw.platform.isLinux ? "shortcuts-linux" : "shortcuts-not-linux");
			}
		} else {
			result.push(self.parseKeyDescriptor(keyDescriptor));
		}
	});
	return result;
};

KeyboardManager.prototype.getPrintableShortcuts = function(keyInfoArray) {
	var self = this,
		result = [];
	$tw.utils.each(keyInfoArray,function(keyInfo) {
		if(keyInfo) {
			result.push((keyInfo.ctrlKey ? "ctrl-" : "") + 
				   (keyInfo.shiftKey ? "shift-" : "") + 
				   (keyInfo.altKey ? "alt-" : "") + 
				   (keyInfo.metaKey ? self.metaKeyName : "") + 
				   (self.keyNames[keyInfo.keyCode]));
		}
	});
	return result;
}

KeyboardManager.prototype.checkKeyDescriptor = function(event,keyInfo) {
	return keyInfo &&
			event.keyCode === keyInfo.keyCode && 
			event.shiftKey === keyInfo.shiftKey && 
			event.altKey === keyInfo.altKey && 
			event.ctrlKey === keyInfo.ctrlKey && 
			event.metaKey === keyInfo.metaKey;
};

KeyboardManager.prototype.checkKeyDescriptors = function(event,keyInfoArray) {
	for(var t=0; t<keyInfoArray.length; t++) {
		if(this.checkKeyDescriptor(event,keyInfoArray[t])) {
			return true;
		}
	}
	return false;
};

exports.KeyboardManager = KeyboardManager;

})();
