/*\
title: $:/core/modules/widgets/qualify.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var QualifyWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

QualifyWidget.prototype = new Widget();

QualifyWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

QualifyWidget.prototype.execute = function() {
	// Get our parameters
	this.qualifyName = this.getAttribute("name");
	this.qualifyTitle = this.getAttribute("title");
	// Set context variable
	if(this.qualifyName) {
		this.setVariable(this.qualifyName,this.qualifyTitle + "-" + this.getStateQualifier());
	}

	this.makeChildWidgets();
};

QualifyWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.name || changedAttributes.title) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

exports.qualify = QualifyWidget;
