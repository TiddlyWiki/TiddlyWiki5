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
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var LetWidget = function(parseTreeNode,options) {
	// Initialise
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
LetWidget.prototype = Object.create(Widget.prototype);

/*
Render this widget into the DOM
*/
LetWidget.prototype.render = function(parent,nextSibling) {
	// Call the constructor
	Widget.call(this);
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

LetWidget.prototype.computeAttributes = function() {
	// Before computing attributes, we must make clear that none of the
	// existing attributes are staged for lookup, even on a refresh
	var changedAttributes = {},
		self = this,
		value;
	this.stagedVariables = Object.create(null);
	$tw.utils.each(this.parseTreeNode.orderedAttributes,function(attribute) {
		var value = self.computeAttribute(attribute),
			name = attribute.name;
		if (self.attributes[name] !== value) {
			self.attributes[name] = value;
			changedAttributes[name] = true;
		}
		if(name.charAt(0) !== "$") {
			self.setVariable(name,value);
			// Now that it's prepped, we're allowed to look this variable up
			// when defining later variables
			self.stagedVariables[name] = true;
		}
	});
	return changedAttributes;
};

LetWidget.prototype.getVariableInfo = function(name,options) {
	// Special handling: If this variable exists in this very $vars, we can
	// use it, but only if it's been staged.
	if (this.stagedVariables[name]) {
		return {
			text: this.variables[name].value
		};
	}
	return Widget.prototype.getVariableInfo.call(this,name,options);
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
LetWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(Object.keys(changedAttributes).length) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports["let"] = LetWidget;

})();
