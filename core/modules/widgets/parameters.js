/*\
title: $:/core/modules/widgets/parameters.js
type: application/javascript
module-type: widget

Widget for definition of transclusion parameters

\*/

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
	this.parametersDepth = Math.max(parseInt(this.getAttribute("$depth","1"),10) || 1,1);
	// Find the parent transclusions
	var pointer = this.parentWidget,
		depth = this.parametersDepth;
	while(pointer) {
		if(pointer instanceof TranscludeWidget) {
			depth--;
			if(depth <= 0) {
				break;
			}
		}
		pointer = pointer.parentWidget;
	}
	// Process each parameter
	if(pointer instanceof TranscludeWidget) {
		// Get the value for each defined parameter
		$tw.utils.each($tw.utils.getOrderedAttributesFromParseTreeNode(self.parseTreeNode),function(attr,index) {
			var name = attr.name;
			// If the attribute name starts with $$ then reduce to a single dollar
			if(name.substr(0,2) === "$$") {
				name = name.substr(1);
			}
			var value = pointer.getTransclusionParameter(name,index,self.getAttribute(attr.name,""));
			self.setVariable(name,value);
		});
		// Assign any metaparameters
		$tw.utils.each(pointer.getTransclusionMetaParameters(),function(getValue,name) {
			var variableName = self.getAttribute("$" + name);
			if(variableName) {
				self.setVariable(variableName,getValue(name));
			}
		});
	} else {
		// There is no parent transclude. i.e. direct rendering.
		// We use default values only.
		$tw.utils.each($tw.utils.getOrderedAttributesFromParseTreeNode(self.parseTreeNode),function(attr,index) {
			var name = attr.name;
			// If the attribute name starts with $$ then reduce to a single dollar
			if(name.substr(0,2) === "$$") {
				name = name.substr(1);
			}
			var value = self.getAttribute(attr.name,"");
			self.setVariable(name,value);
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
	if(Object.keys(changedAttributes).length) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.parameters = ParametersWidget;
