/*\
title: $:/plugins/skeeve/let.js
type: application/javascript
module-type: widget

Set variables widget

```
<$let name=value …>
    :
</$let>
```

Example:

```
<$let a="1" b="2" c="3" d="4">
    <<someMacro>>
</$let>
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var LetWidget = function(parseTreeNode,options) {
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

/*
Compute the internal state of the widget
*/
LetWidget.prototype.execute = function() {
	// Get our parameters
	// As there is nothing which will give me the attributes,
	// I have to access the object myself…
	for(var name in this.attributes) {
		this.setVariable(name, this.attributes[name], this.parseTreeNode.params);
	}
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
LetWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	for(var attr in changedAttributes) {
		if(changedAttributes[attr]) {
			this.refreshSelf();
			return true;
		}
	}
	return this.refreshChildren(changedTiddlers);		
};

exports.let = LetWidget;

})();
