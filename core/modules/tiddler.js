/*\
title: $:/core/modules/tiddler.js
type: application/javascript
module-type: tiddlermethod

Extension methods for the $tw.Tiddler object (constructor and methods required at boot time are in boot/boot.js)

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.hasTag = function(tag) {
	return this.fields.tags && this.fields.tags.indexOf(tag) !== -1;
};

exports.isPlugin = function() {
	return this.fields.type === "application/json" && this.hasField("plugin-type");
}

exports.getFieldString = function(field) {
	var value = this.fields[field];
	// Check for a missing field
	if(value === undefined || value === null) {
		return "";
	}
	// Parse the field with the associated module (if any)
	var fieldModule = $tw.Tiddler.fieldModules[field];
	if(fieldModule && fieldModule.stringify) {
		return fieldModule.stringify.call(this,value);
	} else {
		return value.toString();
	}
};

/*
Get all the fields as a name:value block. Options:
	exclude: an array of field names to exclude
*/
exports.getFieldStringBlock = function(options) {
	options = options || {};
	var exclude = options.exclude || [];
	var fields = [];
	for(var field in this.fields) {
		if($tw.utils.hop(this.fields,field)) {
			if(exclude.indexOf(field) === -1) {
				fields.push(field + ": " + this.getFieldString(field));
			}
		}
	}
	return fields.join("\n");
};

})();
