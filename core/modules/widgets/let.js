/*\
title: $:/core/modules/widgets/let.js
type: application/javascript
module-type: widget

This widget allows defining multiple variables at once, while allowing
the later variables to depend upon the earlier ones.

```
\define helloworld() Hello world!
<$let currentTiddler="target" value={{!!value}} currentTiddler="different">
  {{!!value}} will be different from <<value>>
</$let>
```

\*/

"use strict";

const Widget = require("$:/core/modules/widgets/widget.js").widget;

const LetWidget = function(parseTreeNode,options) {
	// Initialise
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
LetWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
LetWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

LetWidget.prototype.computeAttributes = function() {
	// Before computing attributes, we must make clear that none of the
	// existing attributes are staged for lookup, even on a refresh
	const changedAttributes = {};
	const self = this;
	this.currentValueFor = Object.create(null);
	$tw.utils.each($tw.utils.getOrderedAttributesFromParseTreeNode(this.parseTreeNode),(attribute) => {
		const value = self.computeAttribute(attribute);
		const {name} = attribute;
		// Now that it's prepped, we're allowed to look this variable up
		// when defining later variables
		if(value !== undefined) {
			self.currentValueFor[name] = value;
		}
	});
	// Run through again, setting variables and looking for differences
	$tw.utils.each(this.currentValueFor,(value,name) => {
		if(self.attributes[name] !== value) {
			self.attributes[name] = value;
			self.setVariable(name,value);
			changedAttributes[name] = true;
		}
	});
	return changedAttributes;
};

LetWidget.prototype.getVariableInfo = function(name,options) {
	// Special handling: If this variable exists in this very $let, we can
	// use it, but only if it's been staged.
	if($tw.utils.hop(this.currentValueFor,name)) {
		return {
			text: this.currentValueFor[name]
		};
	}
	return Widget.prototype.getVariableInfo.call(this,name,options);
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
LetWidget.prototype.refresh = function(changedTiddlers) {
	const changedAttributes = this.computeAttributes();
	if($tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports["let"] = LetWidget;
