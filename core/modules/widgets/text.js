/*\
title: $:/core/modules/widgets/text.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var TextNodeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

TextNodeWidget.prototype = new Widget();

TextNodeWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var text = this.getAttribute("text",this.parseTreeNode.text || "");
	text = text.replace(/\r/mg,"");
	var textNode = this.document.createTextNode(text);
	parent.insertBefore(textNode,nextSibling);
	this.domNodes.push(textNode);
};

TextNodeWidget.prototype.execute = function() {
	// Nothing to do for a text node
};

TextNodeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.text) {
		this.refreshSelf();
		return true;
	} else {
		return false;
	}
};

exports.text = TextNodeWidget;
