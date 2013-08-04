/*\
title: $:/plugins/tiddlywiki/classictools/stripcomments.js
type: application/javascript
module-type: fieldviewer

Special viewer for cooking old versions of TiddlyWiki. It removes JavaScript comments formatted as `//#`

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var stripComments = function(text) {
	var lines = text.split("\n"),
		out = [];
	for(var line=0; line<lines.length; line++) {
		var text = lines[line];
		if(!/^\s*\/\/#/.test(text)) {
			out.push(text);
		}
	}
	return out.join("\n");
};

var StripCommentsViewer = function(viewWidget,tiddler,field,value) {
	this.viewWidget = viewWidget;
	this.tiddler = tiddler;
	this.field = field;
	this.value = value;
};

StripCommentsViewer.prototype.render = function() {
	// Get the value as a string
	if(this.field !== "text" && this.tiddler) {
		this.value = this.tiddler.getFieldString(this.field);
	}
	var value = "";
	if(this.value !== undefined && this.value !== null) {
		value = stripComments(this.value);
	}
	// Set the element details
	this.viewWidget.tag = "span";
	this.viewWidget.attributes = {};
	this.viewWidget.children = this.viewWidget.renderer.renderTree.createRenderers(this.viewWidget.renderer,[{
		type: "text",
		text: value
	}]);
};

exports.stripcomments = StripCommentsViewer;

})();
