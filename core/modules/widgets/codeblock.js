/*\
title: $:/core/modules/widgets/codeblock.js
type: application/javascript
module-type: widget

Code block node widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var CodeBlockWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
CodeBlockWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
CodeBlockWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var codeNode = this.document.createElement("code"),
		domNode = this.document.createElement("pre");
	codeNode.appendChild(this.document.createTextNode(this.getAttribute("code")));
	domNode.appendChild(codeNode);
	parent.insertBefore(domNode,nextSibling);
	this.domNodes.push(domNode);
	if(this.postRender) {
		this.postRender();
	}
};

/*
Compute the internal state of the widget
*/
CodeBlockWidget.prototype.execute = function() {
	this.language = this.getAttribute("language");
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
CodeBlockWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.code || changedAttributes.language) {
		this.refreshSelf();
		return true;
	} else {
		return false;
	}
};

exports.codeblock = CodeBlockWidget;

})();
