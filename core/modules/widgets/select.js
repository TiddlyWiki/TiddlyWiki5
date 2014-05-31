/*\
title: $:/core/modules/widgets/select.js
type: application/javascript
module-type: widget

Select widget:

```
<$select tiddler="MyTiddler" field="text">
<$list filter="[tag[chapter]]">
<option value=<<currentTiddler>>>
<$view field="description"/>
</option>
</$list>
</$select>
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var SelectWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
SelectWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
SelectWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
	this.setSelectValue();
	$tw.utils.addEventListeners(this.getSelectDomNode(),[
		{name: "change", handlerObject: this, handlerMethod: "handleChangeEvent"}
	]);
};

/*
Handle a change event
*/
SelectWidget.prototype.handleChangeEvent = function(event) {
	var value = this.getSelectDomNode().value;
	this.wiki.setText(this.selectTitle,this.selectField,this.selectIndex,value);
};

/*
If necessary, set the value of the select element to the current value
*/
SelectWidget.prototype.setSelectValue = function() {
	var value = this.selectDefault;
	// Get the value
	if(this.selectIndex) {
		value = this.wiki.extractTiddlerDataItem(this.selectTitle,this.selectIndex);
	} else {
		var tiddler = this.wiki.getTiddler(this.selectTitle);
		if(tiddler) {
			if(this.selectField === "text") {
				// Calling getTiddlerText() triggers lazy loading of skinny tiddlers
				value = this.wiki.getTiddlerText(this.selectTitle);
			} else {
				if($tw.utils.hop(tiddler.fields,this.selectField)) {
					value = tiddler.getFieldString(this.selectField);
				}
			}
		} else {
			if(this.selectField === "title") {
				value = this.selectTitle;
			}
		}
	}
	// Assign it to the select element if it's different than the current value
	var domNode = this.getSelectDomNode();
	if(domNode.value !== value) {
		domNode.value = value;
	}
};

/*
Get the DOM node of the select element
*/
SelectWidget.prototype.getSelectDomNode = function() {
	return this.children[0].domNodes[0];
};

/*
Compute the internal state of the widget
*/
SelectWidget.prototype.execute = function() {
	// Get our parameters
	this.selectTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.selectField = this.getAttribute("field","text");
	this.selectIndex = this.getAttribute("index");
	this.selectClass = this.getAttribute("class");
	this.selectDefault = this.getAttribute("default");
	// Make the child widgets
	var selectNode = {
		type: "element",
		tag: "select",
		children: this.parseTreeNode.children
	};
	if(this.selectClass) {
		$tw.utils.addAttributeToParseTreeNode(selectNode,"class",this.selectClass);
	}
	this.makeChildWidgets([selectNode]);
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
SelectWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	// If we're using a different tiddler/field/index then completely refresh ourselves
	if(changedAttributes.selectTitle || changedAttributes.selectField || changedAttributes.selectIndex) {
		this.refreshSelf();
		return true;
	// If the target tiddler value has changed, just update setting and refresh the children
	} else {
		if(changedTiddlers[this.selectTitle]) {
			this.setSelectValue();
		} 
		return this.refreshChildren(changedTiddlers);		
	}
};

exports.select = SelectWidget;

})();
