/*\
title: $:/core/tiddler.js
type: application/javascript
module-type: tiddlermethod

Extension methods for the $tw.Tiddler object

\*/
(function(){

/*jslint node: true */
"use strict";

exports.hasTag = function(tag) {
	return this.fields.tags && this.fields.tags.indexOf(tag) !== -1;
};

exports.getFieldString = function(field) {
	var value = this.fields[field];
	// Check for a missing field
	if(value === undefined) {
		return undefined;
	}
	// Parse the field with the associated plugin (if any)
	var fieldPlugin = $tw.Tiddler.fieldPlugins[field];
	if(fieldPlugin) {
		return fieldPlugin.stringify.call(this,value);
	} else {
		return value.toString();
	}
};

})();
