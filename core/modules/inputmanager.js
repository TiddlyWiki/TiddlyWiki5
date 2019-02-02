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

var STATE_CURRENT_FOCUS = "$:/state/current-focus";

function InputManager(options) {
	options = options || {};
	this.wiki = options.wiki || $tw.wiki;
	this.inputs = [];
}

InputManager.prototype.findInputById = function(identifier) {
	var result;
	for(var i=0; i<this.inputs.length; i++) {
		var inputInfo = this.inputs[i];
		if(inputInfo["id"] === identifier) {
			result = inputInfo;
			break;
		}
	}
	return result;
};

InputManager.prototype.shouldFocusAgain = function(identifier) {
	var inputInfo = this.findInputById(identifier);
	if(inputInfo && inputInfo.shouldFocusAgain && (this.wiki.getTiddlerText(STATE_CURRENT_FOCUS) === identifier)) {
		return true;
	} else {
		return false;
	}
};

InputManager.prototype.setValue = function(identifier,name,value) {
	var inputInfo = this.findInputById(identifier);
	if(inputInfo) {
		inputInfo[name] = value;
	} else {
		var newInputInfo = {
			id: identifier
		};
		newInputInfo[name] = value;
		this.inputs.push(newInputInfo);
	}
};

InputManager.prototype.getSelections = function(identifier) {
	var inputInfo = this.findInputById(identifier),
	    result;
	if(inputInfo) {
		var selStart = inputInfo.selectionStart,
		    selEnd = inputInfo.selectionEnd;
		if(selStart && selEnd) {
			result = {
				selectionStart: selStart,
				selectionEnd: selEnd
			};
		}
	}
	return result;
};

InputManager.prototype.updateFocusInput = function(identifier) {
	for(var i=0; i<this.inputs.length; i++) {
		var inputInfo = this.inputs[i];
		if(inputInfo["id"] === identifier) {
			inputInfo.shouldFocusAgain = true;
		} else {
			inputInfo.shouldFocusAgain = false;
		}
	}
};

exports.InputManager = InputManager;

})();
