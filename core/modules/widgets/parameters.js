/*\
title: $:/core/modules/widgets/parameters.js
type: application/javascript
module-type: widget

Widget for definition of transclusion parameters

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget,
	TranscludeWidget = require("$:/core/modules/widgets/transclude.js").transclude;

var ParametersWidget = function(parseTreeNode,options) {
	// Initialise
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ParametersWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ParametersWidget.prototype.render = function(parent,nextSibling) {
	// Call the constructor
	Widget.call(this);
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
ParametersWidget.prototype.execute = function() {
	var self = this;
	// Find the parent transclusions
	var pointer = this.getContainingTransclude();
	// Process each parameter
	if(pointer) {
		// It's important to remember this, because when we refresh, we'll need to make sure this widget is starting at the same index.
		this.initialParameterIndex = pointer.parameterIndex;
		// Get the value for each defined parameter
		$tw.utils.each($tw.utils.getOrderedAttributesFromParseTreeNode(self.parseTreeNode),function(attr) {
			var name = attr.name;
			// If the attribute name starts with $$ then reduce to a single dollar
			if(name.substr(0,2) === "$$") {
				name = name.substr(1);
			}
			var value = pointer.getTransclusionParameter(name,self.getAttribute(attr.name,""));
			self.setVariable(name,value);
		});
		// We remember where we left the unnamed parameter index.
		this.finalParameterIndex = pointer.parameterIndex;
		// Assign any metaparameters
		$tw.utils.each(pointer.getTransclusionMetaParameters(),function(getValue,name) {
			var variableName = self.getAttribute("$" + name);
			if(variableName) {
				self.setVariable(variableName,getValue(name));
			}
		});
	}
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
ParametersWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	var pointer = this.getContainingTransclude();
	var currentParameterIndex;
	if(pointer) {
		currentParameterIndex = pointer.parameterIndex;
	}
	if(Object.keys(changedAttributes).length || currentParameterIndex !== this.initialParameterIndex) {
		this.refreshSelf();
		return true;
	} else if(pointer) {
		// We set the index for unnamed parameters for our $transclude widget in case any later $parameters show up. They need to be able to confirm their indices are starting in the right place, because if not, they need to refresh.
		pointer.parameterIndex = this.finalParameterIndex;
	}
	return this.refreshChildren(changedTiddlers);
};

ParametersWidget.prototype.getContainingTransclude = function() {
	var pointer = this.parentWidget;
	while(pointer && !(pointer instanceof TranscludeWidget)) {
		pointer = pointer.parentWidget;
	}
	return pointer;
};

exports.parameters = ParametersWidget;

})();
