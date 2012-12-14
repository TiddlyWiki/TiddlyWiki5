/*\
title: $:/core/modules/widgets/view.js
type: application/javascript
module-type: widget

The view widget displays a tiddler field.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "view";

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
	return this.viewWidget.renderer.renderTree.createRenderers(this.viewWidget.renderer.renderContext,[{
		type: "text",
		text: value
	}]);
};

// We'll cache the available field viewers here
var fieldViewers = undefined;

exports.init = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Initialise the field viewers if they've not been done already
	if(!fieldViewers) {
		fieldViewers = {text: TextViewer}; // Start with the built-in text viewer
		$tw.modules.applyMethods("newfieldviewer",fieldViewers);
	}
	// Generate child nodes
	this.generateChildNodes();
};

exports.generateChildNodes = function() {
	// We'll manage our own dependencies
	this.renderer.dependencies = undefined;
	// Get parameters from our attributes
	this.tiddlerTitle = this.renderer.getAttribute("tiddler",this.renderer.getContextTiddlerTitle());
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
	var Viewer = fieldViewers.text;
	if($tw.utils.hop(fieldViewers,this.format)) {
		Viewer = fieldViewers[this.format];
	}
	this.viewer = new Viewer(this,tiddler,this.fieldName,value);
	// Ask the viewer to create the children
	this.children = this.viewer.render();
};

exports.refreshInDom = function(changedAttributes,changedTiddlers) {
	// Check if any of our attributes have changed, or if a tiddler we're interested in has changed
	if(changedAttributes.tiddler || changedAttributes.field || changedAttributes.format || (this.tiddlerTitle && changedTiddlers[this.tiddlerTitle])) {
		// Remove old child nodes
		$tw.utils.removeChildren(this.parentElement);
		// Regenerate and render children
		this.generateChildNodes();
		var self = this;
		$tw.utils.each(this.children,function(node) {
			if(node.renderInDom) {
				self.parentElement.appendChild(node.renderInDom());
			}
		});
	} else {
		// We don't need to refresh ourselves, so just refresh any child nodes
		$tw.utils.each(this.children,function(node) {
			if(node.refreshInDom) {
				node.refreshInDom(changedTiddlers);
			}
		});
	}
};

})();
