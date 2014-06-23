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
};

exports.isDraft = function() {
	return this.hasField("draft.of");
};

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

/*
Compare two tiddlers for equality
tiddler: the tiddler to compare
excludeFields: array of field names to exclude from the comparison
*/
exports.isEqual = function(tiddler,excludeFields) {
	excludeFields = excludeFields || [];
	var self = this,
		differences = []; // Fields that have differences
	// Add to the differences array
	function addDifference(fieldName) {
		// Check for this field being excluded
		if(excludeFields.indexOf(fieldName) === -1) {
			// Save the field as a difference
			$tw.utils.pushTop(differences,fieldName);
		}
	}
	// Returns true if the two values of this field are equal
	function isFieldValueEqual(fieldName) {
		var valueA = self.fields[fieldName],
			valueB = tiddler.fields[fieldName];
		// Check for identical string values
		if(typeof(valueA) === "string" && typeof(valueB) === "string" && valueA === valueB) {
			return true;
		}
		// Check for identical array values
		if($tw.utils.isArray(valueA) && $tw.utils.isArray(valueB) && $tw.utils.isArrayEqual(valueA,valueB)) {
			return true;
		}
		// Otherwise the fields must be different
		return false;
	}
	// Compare our fields
	for(var fieldName in this.fields) {
		if(!isFieldValueEqual(fieldName)) {
			addDifference(fieldName);
		}
	}
	// There's a difference for every field in the other tiddler that we don't have
	for(fieldName in tiddler.fields) {
		if(!(fieldName in this.fields)) {
			addDifference(fieldName);
		}
	}
	// Return whether there were any differences
	return differences.length === 0;
};

})();
