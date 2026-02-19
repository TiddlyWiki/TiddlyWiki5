/*\
title: $:/core/modules/widgets/password.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var PasswordWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

PasswordWidget.prototype = new Widget();

PasswordWidget.prototype.render = function(parent,nextSibling) {
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Get the current password
	var password = $tw.browser ? $tw.utils.getPassword(this.passwordName) || "" : "";
	// Create our element
	var domNode = this.document.createElement("input");
	domNode.setAttribute("type","password");
	domNode.setAttribute("value",password);
	// Add a click event handler
	$tw.utils.addEventListeners(domNode,[
		{name: "change", handlerObject: this, handlerMethod: "handleChangeEvent"}
	]);
	// Insert the label into the DOM and render any children
	parent.insertBefore(domNode,nextSibling);
	this.domNodes.push(domNode);
	this.renderChildren(domNode,null);
};

PasswordWidget.prototype.handleChangeEvent = function(event) {
	var password = this.domNodes[0].value;
	return $tw.utils.savePassword(this.passwordName,password);
};

PasswordWidget.prototype.execute = function() {
	// Get the parameters from the attributes
	this.passwordName = this.getAttribute("name","");
	// Make the child widgets
	this.makeChildWidgets();
};

PasswordWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.name) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

exports.password = PasswordWidget;
