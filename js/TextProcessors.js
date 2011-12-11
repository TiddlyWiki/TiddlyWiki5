/*jslint node: true */
"use strict";

var util = require("util");

var TextProcessors = function() {
	this.processors = {};
};

TextProcessors.prototype.registerTextProcessor = function(type,processor) {
	this.processors[type] = processor;
};

TextProcessors.prototype.parse = function(type,text) {
	var processor = this.processors[type];
	if(!processor) {
		processor = this.processors["text/x-tiddlywiki"];
	}
	if(processor) {
		return processor.parse(text);
	} else {
		return null;
	}
};

exports.TextProcessors = TextProcessors;
