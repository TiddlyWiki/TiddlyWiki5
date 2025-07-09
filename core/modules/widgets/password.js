/*\
title: $:/core/modules/widgets/password.js
type: application/javascript
module-type: widget

Password widget

\*/

"use strict";

const Widget = require("$:/core/modules/widgets/widget.js").widget;

const PasswordWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
PasswordWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
PasswordWidget.prototype.render = function(parent,nextSibling) {
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Get the current password
	const password = $tw.browser ? $tw.utils.getPassword(this.passwordName) || "" : "";
	// Create our element
	const domNode = this.document.createElement("input");
	domNode.setAttribute("type","password");
	domNode.setAttribute("value",password);
	// Add a click event handler
	$tw.utils.addEventListeners(domNode,[
		{name: "change",handlerObject: this,handlerMethod: "handleChangeEvent"}
	]);
	// Insert the label into the DOM and render any children
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};

PasswordWidget.prototype.handleChangeEvent = function(event) {
	const password = this.domNodes[0].value;
	return $tw.utils.savePassword(this.passwordName,password);
};

/*
Compute the internal state of the widget
*/
PasswordWidget.prototype.execute = function() {
	// Get the parameters from the attributes
	this.passwordName = this.getAttribute("name","");
	// Make the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
PasswordWidget.prototype.refresh = function(changedTiddlers) {
	const changedAttributes = this.computeAttributes();
	if(changedAttributes.name) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

exports.password = PasswordWidget;
