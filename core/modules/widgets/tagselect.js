/*\
title: $:/core/modules/widgets/tagselect.js
type: application/javascript
module-type: widget

Tagselect widget

Used to create checkboxes or radiobuttons to set or remove tags

To create a checkbox:

```
	<$tagselect tag="mytag" tiddler="mytiddler>my label</$tagselect>
	
```

To create radiobuttons, introduce a group:

```
	<$tagselect group="mygroup" tag="check 1" tiddler="mytiddler>label one</$tagselect>
	<$tagselect group="mygroup" tag="check 2" tiddler="mytiddler>label two</$tagselect>
	<$tagselect group="mygroup" tag="check 3" tiddler="mytiddler>label three</$tagselect>
	
```

Just one of them can be selected and so just one of the tags "check 1", "check 2" or 
"check 3" can be set..

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var TagselectWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
TagselectWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
TagselectWidget.prototype.render = function(parent,nextSibling) {
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Create our elements
	this.labelDomNode = this.document.createElement("label");
	this.labelDomNode.setAttribute("class", "tw-tagselect");
	this.inputDomNode = this.document.createElement("input");
	if (this.tagselectGroup == "") {
		this.inputDomNode.setAttribute("type", "checkbox");
	}
	else {
		this.inputDomNode.setAttribute("type", "radio");
		this.inputDomNode.setAttribute("name",this.tagselectGroup);
		this.inputDomNode.setAttribute("value",this.tagselectTag);
console.log(this.getStateQualifier(this.tagselectGroup));
	}
	if(this.getValue()) {
		this.inputDomNode.setAttribute("checked","true");
	}
	this.labelDomNode.appendChild(this.inputDomNode);
	this.spanDomNode = this.document.createElement("span");
	this.labelDomNode.appendChild(this.spanDomNode);
	// Add a click event handler
	$tw.utils.addEventListeners(this.inputDomNode,[
		{name: "change", handlerObject: this, handlerMethod: "handleChangeEvent"}
	]);
	// Insert the label into the DOM and render any children
	parent.insertBefore(this.labelDomNode,nextSibling);
	this.renderChildren(this.spanDomNode,null);
	this.domNodes.push(this.labelDomNode);
};

TagselectWidget.prototype.getValue = function() {
	var tiddler = this.wiki.getTiddler(this.tagselectTitle);
	return tiddler ? tiddler.hasTag(this.tagselectTag) : false;
};

TagselectWidget.prototype.handleChangeEvent = function(event) {
	var checked = this.inputDomNode.checked,
		tiddler = this.wiki.getTiddler(this.tagselectTitle);
	if(tiddler && (this.tagselectGroup || tiddler.hasTag(this.tagselectTag) !== checked)) {
		var newTags = (tiddler.fields.tags || []).slice(0),
			pos = newTags.indexOf(this.tagselectTag);
		if(pos !== -1) {
			newTags.splice(pos,1);
		}
		if(checked) {
			newTags.push(this.tagselectTag);
		}
		// If it was a radio button, and it was checked,
		// it was the one clicked upon
		// Now we need to remove the unchecked tags
		if (checked && this.tagselectGroup) {
			// get all the other radiobuttons
			var radios= document.getElementsByName(this.tagselectGroup);
			for (var i=radios.length; i--;) {
				if (radios[i].value != this.tagselectTag) {
					pos = newTags.indexOf(radios[i].value);
					if(pos !== -1) {
						newTags.splice(pos,1);
					}
				}
			}
		}
		this.wiki.addTiddler(new $tw.Tiddler(tiddler,{tags: newTags},this.wiki.getModificationFields()));
	}
};

/*
Compute the internal state of the widget
*/
TagselectWidget.prototype.execute = function() {
	// Get the parameters from the attributes
	this.tagselectTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.tagselectTag = this.getAttribute("tag");
	// group defined?
	this.tagselectGroup = this.getAttribute("group") ? this.tagselectTitle + "::" + this.getAttribute("group") : "";
	// Make the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
TagselectWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tiddler || changedAttributes.tag || changedAttributes["class"]) {
		this.refreshSelf();
		return true;
	} else {
		var refreshed = false;
		if(changedTiddlers[this.tagselectTitle]) {
			this.inputDomNode.checked = this.getValue();
			refreshed = true;
		}
		return this.refreshChildren(changedTiddlers) || refreshed;
	}
};

exports.tagselect = TagselectWidget;

})();
