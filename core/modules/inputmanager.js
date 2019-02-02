/*\
title: $:/core/modules/inputmanager.js
type: application/javascript
module-type: global

Input handling utilities

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function InputManager(options) {
	options = options || "";
	this.inputs = [];
}

InputManager.prototype.findInputById = function(identifier) {
	var result;
	for(var i=0; i<this.inputs.length; i++) {
		var object = this.inputs[i];
		if(object["id"] === identifier) {
			result = object;
			break;
		}
	}
	return result;
};

InputManager.prototype.shouldFocusAgain = function(identifier) {
	var object = this.findInputById(identifier);
	if(object && object.shouldFocusAgain && $tw.wiki.getTiddlerText("$:/state/current-focus") === identifier) {
		return true;
	} else {
		return false;
	}
};

InputManager.prototype.setValue = function(identifier,name,value) {
	var object = this.findInputById(identifier);
	if(object) {
		object[name] = value;
	} else {
		var options = {
			id: identifier
		};
		options[name] = value;
		this.inputs.push(options);
	}
};

InputManager.prototype.getSelections = function(identifier) {
	var object = this.findInputById(identifier);
	if(object) {
		var selStart = object.selectionStart;
		var selEnd = object.selectionEnd;
		if(selStart && selEnd) {
			return {
				selectionStart: selStart,
				selectionEnd: selEnd
			};
		} else {
			return null;
		}
	}
};

exports.InputManager = InputManager;

})();
