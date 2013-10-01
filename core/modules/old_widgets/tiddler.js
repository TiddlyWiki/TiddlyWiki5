/*\
title: $:/core/modules/widgets/tiddler.js
type: application/javascript
module-type: widget

The tiddler widget sets the current tiddler to a specified title.

Attributes:
	title: the title of the current tiddler
	class: CSS classes


\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var TiddlerWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generate();
};

TiddlerWidget.prototype.generate = function() {
	var self = this;
	this.tiddlerTitle = this.renderer.getAttribute("title","");
	// Set up the attributes for the wrapper element
	var classes = ["tw-tiddler"];
	if(this.renderer.hasAttribute("class")) {
		$tw.utils.pushTop(classes,this.renderer.getAttribute("class").split(" "));
	}
	if(!this.renderer.renderTree.wiki.tiddlerExists(this.tiddlerTitle) && !this.renderer.renderTree.wiki.isShadowTiddler(this.tiddlerTitle)) {
		$tw.utils.pushTop(classes,"tw-tiddler-missing");
	}
	// Save the context for this renderer node
	this.renderer.context = {
		tiddlerTitle: this.tiddlerTitle
	};
	// Initialise events
	this.events = [];
	// Trap and update tag modification events
	this.events.push({name: "tw-remove-tag", handlerFunction: function(event) {
		event.currentTag = self.tiddlerTitle;
		return true;
	}});
	// Set the element
	this.tag = this.renderer.parseTreeNode.isBlock ? "div" : "span";
	this.attributes = {};
	if(classes.length > 0) {
		this.attributes["class"] = classes.join(" ");
	}
	this.children = this.renderer.renderTree.createRenderers(this.renderer,this.renderer.parseTreeNode.children);
};

TiddlerWidget.prototype.refreshInDom = function(changedAttributes,changedTiddlers) {
	// Set the class for missing tiddlers
	if(this.tiddlerTitle && changedTiddlers[this.tiddlerTitle]) {
		$tw.utils.toggleClass(this.renderer.domNode,"tw-tiddler-missing",!this.renderer.renderTree.wiki.tiddlerExists(this.tiddlerTitle));
	}
	// Check if any of our attributes have changed, or if a tiddler we're interested in has changed
	if(changedAttributes.title) {
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

exports.tiddler = TiddlerWidget;

})();
