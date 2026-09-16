/*\
title: $:/core/modules/widgets/wikify.js
type: application/javascript
module-type: widget

Widget to wikify text into a variable

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var WikifyWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
WikifyWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
WikifyWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
WikifyWidget.prototype.execute = function() {
	// Get our parameters
	this.wikifyName = this.getAttribute("name");
	// Create the wikifier
	this.wikifier = new $tw.utils.Wikifier({
		wiki: this.wiki,
		widget: this,
		text: this.getAttribute("text"),
		type: this.getAttribute("type"),
		mode: this.getAttribute("mode","block"),
		output: this.getAttribute("output","text")
	});
	this.wikifyResult = this.wikifier.getResult();
	// Set context variable
	this.setVariable(this.wikifyName,this.wikifyResult);
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
WikifyWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	// Refresh ourselves entirely if any of our attributes have changed
	if(changedAttributes.name || changedAttributes.text || changedAttributes.type || changedAttributes.mode || changedAttributes.output) {
		this.refreshSelf();
		return true;
	} else {
		// Refresh the widget tree
		if(this.wikifier.refresh(changedTiddlers)) {
			// Check if there was any change
			var result = this.wikifier.getResult();
			if(result !== this.wikifyResult) {
				// If so, save the change
				this.wikifyResult = result;
				this.setVariable(this.wikifyName,this.wikifyResult);
				// Refresh each of our child widgets
				$tw.utils.each(this.children,function(childWidget) {
					childWidget.refreshSelf();
				});
				return true;
			}
		}
		// Just refresh the children
		return this.refreshChildren(changedTiddlers);
	}
};

exports.wikify = WikifyWidget;
