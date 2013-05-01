/*\
title: $:/core/modules/widget/linkcatcher.js
type: application/javascript
module-type: widget

Implements the linkcatcher widget.

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
	this.children = this.renderer.renderTree.createRenderers(this.renderer.renderContext,this.renderer.parseTreeNode.children);
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
		this.renderer.renderTree.wiki.setTextReference(this.to,event.navigateTo,this.renderer.getContextTiddlerTitle());
	}
	event.stopPropagation();
	return false;
};

exports.linkcatcher = LinkCatcherWidget;

})();
