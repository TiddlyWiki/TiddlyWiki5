/*\
title: $:/core/modules/macros/view/viewers/text.js
type: application/javascript
module-type: fieldviewer

A viewer for viewing tiddler fields as plain text

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var TextViewer = function(viewMacro,tiddler,field,value) {
	this.viewMacro = viewMacro;
	this.tiddler = tiddler;
	this.field = field;
	this.value = value;
};

TextViewer.prototype.render = function() {
	// Get the value as a string
	if(this.field !== "text" && this.tiddler) {
		this.value = this.tiddler.getFieldString(this.field);
	}
	// Return the text
	if(this.value === undefined || this.value === null) {
		return $tw.Tree.Text("");
	} else {
		return $tw.Tree.Text(this.value);
	}
};

exports.text = TextViewer;

})();
