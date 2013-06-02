/*\
title: $:/core/modules/widgets/setstyle.js
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

SetStyleWidget.prototype.refreshInDom = function(changedAttributes,changedTiddlers) {
	// Check if any of our attributes have changed, or if a tiddler we're interested in has changed
	if(changedAttributes.name || changedAttributes.value || changedAttributes["class"]) {
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

exports.setstyle = SetStyleWidget;

})();
