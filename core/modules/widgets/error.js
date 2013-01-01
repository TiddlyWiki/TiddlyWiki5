/*\
title: $:/core/modules/widgets/error.js
type: application/javascript
module-type: widget

The error widget displays an error message.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var ErrorWidget = function(renderer,errorMessage) {
	// Save state
	this.renderer = renderer;
	this.errorMessage = errorMessage;
	// Generate child nodes
	this.generateChildNodes();
};

ErrorWidget.prototype.generateChildNodes = function() {
	// Create the wrapper node
	var node = {
		type: "element",
		tag: "span",
		children: [{
			type: "text",
			text: this.errorMessage
		}]
	};
	// Set up the attributes for the wrapper element
	$tw.utils.addClassToParseTreeNode(node,"tw-error-widget");
	// Create the renderers for the wrapper and the children
	this.children = this.renderer.renderTree.createRenderers(this.renderer.renderContext,[node]);
};

exports.error = ErrorWidget;

})();
