/*\
title: $:/core/modules/widgets/raw.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var RawWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

RawWidget.prototype = new Widget();

RawWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.execute();
	var div = this.document.createElement("div");
	div.innerHTML=this.parseTreeNode.html;
	parent.insertBefore(div,nextSibling);
	this.domNodes.push(div);
};

RawWidget.prototype.execute = function() {
};

RawWidget.prototype.refresh = function(changedTiddlers) {
	return false;
};

exports.raw = RawWidget;
