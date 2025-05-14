/*\
title: $:/core/modules/widgets/vars.js
type: application/javascript
module-type: widget

This widget allows multiple variables to be set in one go:

```
\define helloworld() Hello world!
<$vars greeting="Hi" me={{!!title}} sentence=<<helloworld>>>
  <<greeting>>! I am <<me>> and I say: <<sentence>>
</$vars>
```

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var VarsWidget = function(parseTreeNode,options) {
	// Initialise
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
VarsWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
VarsWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
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

/*
Refresh the widget by ensuring our attributes are up to date
*/
VarsWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if($tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports["vars"] = VarsWidget;
