/*\
title: $:/core/modules/old_widgets/count.js
type: application/javascript
module-type: widget

Implements the count widget that displays the number of tiddlers that match a filter

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var CountWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Execute the filter to get the initial count
	this.executeFilter();
	// Generate child nodes
	this.generate();
};

CountWidget.prototype.executeFilter = function() {
	// Get attributes
	this.filter = this.renderer.getAttribute("filter");
	// Execute the filter
	if(this.filter) {
		this.currentCount = this.renderer.renderTree.wiki.filterTiddlers(this.filter,this.renderer.tiddlerTitle).length;
	} else {
		this.currentCount = undefined;
	}
};

CountWidget.prototype.generate = function() {
	// Set the element
	this.tag = "span";
	this.attributes = {};
	this.children = this.renderer.renderTree.createRenderers(this.renderer,[
		{type: "text", text: this.currentCount !== undefined ? this.currentCount.toString() : ""}
	]);
};

CountWidget.prototype.refreshInDom = function(changedAttributes,changedTiddlers) {
	// Re-execute the filter to get the count
	var oldCount = this.currentCount;
	this.executeFilter();
	if(this.currentCount !== oldCount) {
		// Regenerate and rerender the widget and replace the existing DOM node
		this.generate();
		var oldDomNode = this.renderer.domNode,
			newDomNode = this.renderer.renderInDom();
		oldDomNode.parentNode.replaceChild(newDomNode,oldDomNode);
	}
};

exports.count = CountWidget;

})();
