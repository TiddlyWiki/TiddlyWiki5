/*\
title: $:/core/modules/widget/setstyle.js
type: application/javascript
module-type: widget

Implements the setstyle widget.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var SetStyleWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generate();
};

SetStyleWidget.prototype.generate = function() {
	// Get the parameters from the attributes
	this.name = this.renderer.getAttribute("name");
	this.value = this.renderer.getAttribute("value");
	this["class"] = this.renderer.getAttribute("class");
	// Set up the element
	this.tag = this.renderer.parseTreeNode.isBlock ? "div" : "span";
	this.attributes = {
		style: this.name + ":" + this.value
	};
	if(this["class"]) {
		this.attributes["class"] = this["class"];
	}
	this.children = this.renderer.renderTree.createRenderers(this.renderer,this.renderer.parseTreeNode.children);
};

exports.setstyle = SetStyleWidget;

})();
