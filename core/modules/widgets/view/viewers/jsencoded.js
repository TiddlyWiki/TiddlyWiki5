/*\
title: $:/core/modules/widgets/view/viewers/jsencoded.js
type: application/javascript
module-type: fieldviewer

A viewer for viewing tiddler fields as JavaScript stringified text

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var JsEncodedViewer = function(viewWidget,tiddler,field,value) {
	this.viewWidget = viewWidget;
	this.tiddler = tiddler;
	this.field = field;
	this.value = value;
};

JsEncodedViewer.prototype.render = function() {
	// Get the value as a string
	if(this.field !== "text" && this.tiddler) {
		this.value = this.tiddler.getFieldString(this.field);
	}
	var value = "";
	if(this.value !== undefined && this.value !== null) {
		value = this.value;
	}
	// Set the element details
	this.viewWidget.tag = "pre";
	this.viewWidget.attributes = {
		"class": "tw-view-jsencoded"
	};
	this.viewWidget.children = this.viewWidget.renderer.renderTree.createRenderers(this.viewWidget.renderer,[{
			type: "text",
			text: $tw.utils.stringify(value)
		}]);
};

exports.jsencoded = JsEncodedViewer;

})();
