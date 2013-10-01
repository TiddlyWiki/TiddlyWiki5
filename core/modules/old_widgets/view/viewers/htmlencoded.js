/*\
title: $:/core/modules/widgets/view/viewers/htmlencoded.js
type: application/javascript
module-type: fieldviewer

A viewer for viewing tiddler fields as HTML encoded text

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var HtmlEncodedViewer = function(viewWidget,tiddler,field,value) {
	this.viewWidget = viewWidget;
	this.tiddler = tiddler;
	this.field = field;
	this.value = value;
};

HtmlEncodedViewer.prototype.render = function() {
	// Get the value as a string
	if(this.field !== "text" && this.tiddler) {
		this.value = this.tiddler.getFieldString(this.field);
	}
	var value = "";
	if(this.value !== undefined && this.value !== null) {
		value = this.value;
	}
	// Set the element details
	this.viewWidget.tag = "span";
	this.viewWidget.attributes = {
		"class": "tw-view-htmlencoded"
	};
	this.viewWidget.children = this.viewWidget.renderer.renderTree.createRenderers(this.viewWidget.renderer,[{
		type: "text",
		text: $tw.utils.htmlEncode(value)
	}]);
};

exports.htmlencoded = HtmlEncodedViewer;

})();
