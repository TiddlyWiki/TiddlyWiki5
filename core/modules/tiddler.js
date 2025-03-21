/*\
title: $:/core/modules/tiddler.js
type: application/javascript
module-type: tiddlermethod

Extension methods for the $tw.Tiddler object (constructor and methods required at boot time are in boot/boot.js)

\*/

"use strict";

exports.hasTag = function(tag) {
	return this.fields.tags && this.fields.tags.indexOf(tag) !== -1;
};

exports.isPlugin = function() {
	return this.fields.type === "application/json" && this.hasField("plugin-type");
};

exports.isDraft = function() {
	return this.hasField("draft.of");
};

exports.getFieldString = function(field,defaultValue) {
	var value = this.fields[field];
	// Check for a missing field
	if(value === undefined || value === null) {
		return defaultValue || "";
	}
	// Stringify the field with the associated tiddler field module (if any)
	var fieldModule = $tw.Tiddler.fieldModules[field];
	if(fieldModule && fieldModule.stringify) {
		return fieldModule.stringify.call(this,value);
	} else {
		return value.toString();
	}
};

/*
Get the value of a field as an array / list
*/
exports.getFieldList = function(field) {
	var value = this.getFieldString(field,null);
	// Check for a missing field
	if(value === undefined || value === null) {
		return [];
	}
	return $tw.utils.parseStringArray(value);
};

/*
Get all the fields as a hashmap of strings. Options:
	exclude: an array of field names to exclude
*/
exports.getFieldStrings = function(options) {
	options = options || {};
	var exclude = options.exclude || [];
	var fields = {};
	for(var field in this.fields) {
		if($tw.utils.hop(this.fields,field)) {
			if(exclude.indexOf(field) === -1) {
				fields[field] = this.getFieldString(field);
			}
		}
	}
	return fields;
};

/*
Get all the fields as a name:value block. Options:
	exclude: an array of field names to exclude
*/
exports.getFieldStringBlock = function(options) {
	options = options || {};
	var exclude = options.exclude || [],
		fields = Object.keys(this.fields).sort(),
		result = [];
	for(var t=0; t<fields.length; t++) {
		var field = fields[t];
		if(exclude.indexOf(field) === -1) {
			result.push(field + ": " + this.getFieldString(field));
		}
	}
	return result.join("\n");
};

exports.getFieldDay = function(field) {
	if(this.cache && this.cache.day && $tw.utils.hop(this.cache.day,field) ) {
		return this.cache.day[field];
	}
	var day = "";
	if(this.fields[field]) {
		day = (new Date($tw.utils.parseDate(this.fields[field]))).setHours(0,0,0,0);
	}
	this.cache.day = this.cache.day || {};
	this.cache.day[field] = day;
	return day;
};
