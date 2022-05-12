/*\
title: $:/core/modules/widgets/error.js
type: application/javascript
module-type: widget

Error widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ErrorWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ErrorWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ErrorWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var message = this.getAttribute("$message","Unknown error"),
		domNode = this.document.createElement("span");
	domNode.appendChild(this.document.createTextNode(message));
	domNode.className = "tc-error";
	parent.insertBefore(domNode,nextSibling);
	this.domNodes.push(domNode);
};

/*
Compute the internal state of the widget
*/
ErrorWidget.prototype.execute = function() {
	// Nothing to do for a text node
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ErrorWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$message"]) {
		this.refreshSelf();
		return true;
	} else {
		return false;
	}
};

exports.error = ErrorWidget;

})();
