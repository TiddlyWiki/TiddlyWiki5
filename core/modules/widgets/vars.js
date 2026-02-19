/*\
title: $:/core/modules/widgets/vars.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var VarsWidget = function(parseTreeNode,options) {
	// Initialise
	this.initialise(parseTreeNode,options);
};

VarsWidget.prototype = new Widget();

VarsWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

VarsWidget.prototype.execute = function() {
	// Parse variables
	var self = this;
	$tw.utils.each(this.attributes,function(val,key) {
		if(key.charAt(0) !== "$") {
			self.setVariable(key,val);
		}
	});
	// Construct the child widgets
	this.makeChildWidgets();
};

VarsWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if($tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports["vars"] = VarsWidget;
