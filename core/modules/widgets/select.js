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
	// Get the new value and assign it to the tiddler
	if(this.selectMultiple == false) {
		var value = this.getSelectDomNode().value;
	} else {
		var value = this.getSelectValues()
				value = $tw.utils.stringifyList(value);
	}
	this.wiki.setText(this.selectTitle,this.selectField,this.selectIndex,value);
	// Trigger actions
	if(this.selectActions) {
		this.invokeActionString(this.selectActions,this,event);
	}
};

/*
If necessary, set the value of the select element to the current value
*/
SelectWidget.prototype.setSelectValue = function() {
	var value = this.selectDefault;
	// Get the value
	if(this.selectIndex) {
		value = this.wiki.extractTiddlerDataItem(this.selectTitle,this.selectIndex,value);
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
	if (this.selectMultiple) {
		value = value === undefined ? "" : value;
		var select = this.getSelectDomNode();
		var values = Array.isArray(value) ? value : $tw.utils.parseStringArray(value);
		for(var i=0; i < select.children.length; i++){
			select.children[i].selected = values.indexOf(select.children[i].value) !== -1
		}
	} else {
		var domNode = this.getSelectDomNode();
		if(domNode.value !== value) {
			domNode.value = value;
		}
	}
};

/*
Get the DOM node of the select element
*/
SelectWidget.prototype.getSelectDomNode = function() {
	return this.children[0].domNodes[0];
};

// Return an array of the selected opion values
// select is an HTML select element
SelectWidget.prototype.getSelectValues = function() {
	var select, result, options, opt;
	select = this.getSelectDomNode();
	result = [];
	options = select && select.options;
	for (var i=0; i<options.length; i++) {
		opt = options[i];
		if (opt.selected) {
			result.push(opt.value || opt.text);
		}
	}
	return result;
}

/*
Compute the internal state of the widget
*/
SelectWidget.prototype.execute = function() {
	// Get our parameters
	this.selectActions = this.getAttribute("actions");
	this.selectTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.selectField = this.getAttribute("field","text");
	this.selectIndex = this.getAttribute("index");
	this.selectClass = this.getAttribute("class");
	this.selectDefault = this.getAttribute("default");
	this.selectMultiple = this.getAttribute("multiple", false);
	this.selectSize = this.getAttribute("size");
	this.selectTooltip = this.getAttribute("tooltip");
	// Make the child widgets
	var selectNode = {
		type: "element",
		tag: "select",
		children: this.parseTreeNode.children
	};
	if(this.selectClass) {
		$tw.utils.addAttributeToParseTreeNode(selectNode,"class",this.selectClass);
	}
	if(this.selectMultiple) {
		$tw.utils.addAttributeToParseTreeNode(selectNode,"multiple","multiple");
	}
	if(this.selectSize) {
		$tw.utils.addAttributeToParseTreeNode(selectNode,"size",this.selectSize);
	}
	if(this.selectTooltip) {
		$tw.utils.addAttributeToParseTreeNode(selectNode,"title",this.selectTooltip);
	}
	this.makeChildWidgets([selectNode]);
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
SelectWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	// If we're using a different tiddler/field/index then completely refresh ourselves
	if(changedAttributes.tiddler || changedAttributes.field || changedAttributes.index || changedAttributes.tooltip) {
		this.refreshSelf();
		return true;
	// If the target tiddler value has changed, just update setting and refresh the children
	} else {
		if(changedAttributes.class) {
			this.selectClass = this.getAttribute("class");
			this.getSelectDomNode().setAttribute("class",this.selectClass); 
		}
		
		var childrenRefreshed = this.refreshChildren(changedTiddlers);
		if(changedTiddlers[this.selectTitle] || childrenRefreshed) {
			this.setSelectValue();
		} 
		return childrenRefreshed;
	}
};

exports.select = SelectWidget;

})();
