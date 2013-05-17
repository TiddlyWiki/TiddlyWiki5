/*\
title: $:/core/modules/widgets/datauri.js
type: application/javascript
module-type: widget

The datauri widget displays the contents of a tiddler as a data URI.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var DataUriWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generate();
};

DataUriWidget.prototype.generate = function() {
	// Get parameters from our attributes
	this.tiddlerTitle = this.renderer.getAttribute("tiddler",this.renderer.tiddlerTitle);
	// Compose the data URI
	var tiddler = this.renderer.renderTree.wiki.getTiddler(this.tiddlerTitle),
		uri = "";
	if(tiddler) {
		var type = tiddler.fields.type || "text/vnd.tiddlywiki",
			typeInfo = $tw.config.contentTypeInfo[type],
			isBase64 = typeInfo && typeInfo.encoding === "base64";
		uri = "data:" + type + (isBase64 ? ";base64" : "") + "," + tiddler.fields.text;
	}
	// Set the element
	this.tag = "pre";
	this.attributes = {
		"class": "tw-data-uri"
	};
	// Create the renderers for the wrapper and the children
	this.children = this.renderer.renderTree.createRenderers(this.renderer,[{
		type: "text",
		text: uri
	}]);
};

exports.datauri = DataUriWidget;

})();
