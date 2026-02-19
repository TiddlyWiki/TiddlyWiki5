/*\
title: $:/core/modules/widgets/entity.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var EntityWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

EntityWidget.prototype = new Widget();

EntityWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var entityString = this.getAttribute("entity",this.parseTreeNode.entity || ""),
		textNode = this.document.createTextNode($tw.utils.entityDecode(entityString));
	parent.insertBefore(textNode,nextSibling);
	this.domNodes.push(textNode);
};

EntityWidget.prototype.execute = function() {
};

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
