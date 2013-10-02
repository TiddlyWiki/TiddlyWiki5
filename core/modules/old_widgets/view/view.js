/*\
title: $:/core/modules/old_widgets/view.js
type: application/javascript
module-type: widget

The view widget displays a tiddler field.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Define the "text" viewer here so that it is always available
*/
var TextViewer = function(viewWidget,tiddler,field,value) {
	this.viewWidget = viewWidget;
	this.tiddler = tiddler;
	this.field = field;
	this.value = value;
};

TextViewer.prototype.render = function() {
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
	this.viewWidget.attributes = {};
	this.viewWidget.children = this.viewWidget.renderer.renderTree.createRenderers(this.viewWidget.renderer.renderContext,[{
		type: "text",
		text: value
	}]);
};

var ViewWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Initialise the field viewers if they've not been done already
	if(!this.fieldViewers) {
		ViewWidget.prototype.fieldViewers = {text: TextViewer}; // Start with the built-in text viewer
		$tw.modules.applyMethods("fieldviewer",this.fieldViewers);
	}
	// Generate child nodes
	this.generate();
};

ViewWidget.prototype.generate = function() {
	// Get parameters from our attributes
	this.tiddlerTitle = this.renderer.getAttribute("tiddler",this.renderer.tiddlerTitle);
	this.fieldName = this.renderer.getAttribute("field","text");
	this.format = this.renderer.getAttribute("format","text");
	// Get the value to display
	var tiddler = this.renderer.renderTree.wiki.getTiddler(this.tiddlerTitle),
		value;
	if(tiddler) {
		if(this.fieldName === "text") {
			// Calling getTiddlerText() triggers lazy loading of skinny tiddlers
			value = this.renderer.renderTree.wiki.getTiddlerText(this.tiddlerTitle);
		} else {
			value = tiddler.fields[this.fieldName];
		}
	} else { // Use a special value if the tiddler is missing
		switch(this.fieldName) {
			case "title":
				value = this.tiddlerTitle;
				break;
			case "modified":
			case "created":
				value = new Date();
				break;
			default:
				value = "";
				break;
		}
	}
	// Choose the viewer to use
	var Viewer = this.fieldViewers.text;
	if($tw.utils.hop(this.fieldViewers,this.format)) {
		Viewer = this.fieldViewers[this.format];
	}
	this.viewer = new Viewer(this,tiddler,this.fieldName,value);
	// Ask the viewer to create the widget element
	this.viewer.render();
};

ViewWidget.prototype.refreshInDom = function(changedAttributes,changedTiddlers) {
	// Check if any of our attributes have changed, or if a tiddler we're interested in has changed
	if(changedAttributes.tiddler || changedAttributes.field || changedAttributes.format || (this.tiddlerTitle && changedTiddlers[this.tiddlerTitle])) {
		// Regenerate and rerender the widget and replace the existing DOM node
		this.generate();
		var oldDomNode = this.renderer.domNode,
			newDomNode = this.renderer.renderInDom();
		oldDomNode.parentNode.replaceChild(newDomNode,oldDomNode);
	} else {
		// We don't need to refresh ourselves, so just refresh any child nodes
		$tw.utils.each(this.children,function(node) {
			if(node.refreshInDom) {
				node.refreshInDom(changedTiddlers);
			}
		});
	}
};

ViewWidget.prototype.postRenderInDom = function() {
	if(this.viewer && this.viewer.postRenderInDom) {
		this.viewer.postRenderInDom();
	}
};

exports.view = ViewWidget;

})();
