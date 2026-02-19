/*\
title: $:/core/modules/widgets/codeblock.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var CodeBlockWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

CodeBlockWidget.prototype = new Widget();

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

CodeBlockWidget.prototype.execute = function() {
	this.language = this.getAttribute("language");
};

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
