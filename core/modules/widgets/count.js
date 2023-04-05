/*\
title: $:/core/modules/widgets/count.js
type: application/javascript
module-type: widget

Count widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var CountWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
CountWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
CountWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var textNode = this.document.createTextNode(this.currentCount);
	parent.insertBefore(textNode,nextSibling);
	this.domNodes.push(textNode);
};

/*
Compute the internal state of the widget
*/
CountWidget.prototype.execute = function() {
	// Get parameters from our attributes
	this.filter = this.getAttribute("filter");
	// Execute the filter
	if(this.filter) {
		this.currentCount = this.wiki.filterTiddlers(this.filter,this).length;
	} else {
		this.currentCount = "0";
	}
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
CountWidget.prototype.refresh = function(changedTiddlers) {
	// Re-execute the filter to get the count
	this.computeAttributes();
	var oldCount = this.currentCount;
	this.execute();
	if(this.currentCount !== oldCount) {
		// Regenerate and rerender the widget and replace the existing DOM node
		this.refreshSelf();
		return true;
	} else {
		return false;
	}

};

exports.count = CountWidget;

})();
