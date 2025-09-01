/*\
title: $:/core/modules/widgets/entity.js
type: application/javascript
module-type: widget

HTML entity widget

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var EntityWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
EntityWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
EntityWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var entityString = this.getAttribute("entity",this.parseTreeNode.entity || ""),
		textNode = this.document.createTextNode($tw.utils.entityDecode(entityString));
	parent.insertBefore(textNode,nextSibling);
	this.domNodes.push(textNode);
};

/*
Compute the internal state of the widget
*/
EntityWidget.prototype.execute = function() {
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
EntityWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.entity) {
		this.refreshSelf();
		return true;
	} else {
		return false;
	}
};

exports.entity = EntityWidget;
