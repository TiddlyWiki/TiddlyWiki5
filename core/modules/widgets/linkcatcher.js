/*\
title: $:/core/modules/widgets/linkcatcher.js
type: application/javascript
module-type: widget

Implements the linkcatcher widget. It intercepts navigation events from its children, preventing normal navigation, and instead stores the name of the target tiddler in the text reference specified in the `to` attribute.

Using the linkcatcher widget allows the linking mechanism to be used for tasks like selecting the current theme tiddler from a list.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var LinkCatcherWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generate();
};

LinkCatcherWidget.prototype.generate = function() {
	// Get our attributes
	this.to = this.renderer.getAttribute("to");
	// Set the element
	this.tag = "div";
	this.attributes = {
		"class": "tw-linkcatcher"
	};
	this.children = this.renderer.renderTree.createRenderers(this.renderer,this.renderer.parseTreeNode.children);
	this.events = [
		{name: "tw-navigate", handlerObject: this, handlerMethod: "handleNavigateEvent"}
	];
};

LinkCatcherWidget.prototype.refreshInDom = function(changedAttributes,changedTiddlers) {
	// We don't need to refresh ourselves, so just refresh any child nodes
	$tw.utils.each(this.children,function(node) {
		if(node.refreshInDom) {
			node.refreshInDom(changedTiddlers);
		}
	});
};

// Navigate to a specified tiddler
LinkCatcherWidget.prototype.handleNavigateEvent = function(event) {
	if(this.to) {
		this.renderer.renderTree.wiki.setTextReference(this.to,event.navigateTo,this.renderer.tiddlerTitle);
	}
	event.stopPropagation();
	return false;
};

exports.linkcatcher = LinkCatcherWidget;

})();
