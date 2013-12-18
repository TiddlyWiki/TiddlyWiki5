/*\
title: $:/plugins/skeeve/newtiddler.js
type: application/javascript
module-type: widget

newtiddler widget

```
<$newtiddler title="name" skeleton="name">Buttontext</$newtiddler>
```

The skeleton tiddler may contain variables which are replaced during creation

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var NewtiddlerWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
NewtiddlerWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
NewtiddlerWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	// Remember parent
	this.parentDomNode = parent;
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();
	// Create element
	var domNode = this.document.createElement("button");
	// Assign classes
	domNode.className = this.newtiddlerClass;
	// Assign styles
	if(this.style) {
		domNode.setAttribute("style",this.style);
	}
	// Add a click event handler
	$tw.utils.addEventListeners(domNode,[
		{name: "click", handlerObject: this, handlerMethod: "handleClickEvent"}
	]);
	// Insert element
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};

NewtiddlerWidget.prototype.handleClickEvent = function(event) {
	var skeleton = this.wiki.getTiddlerAsJson(this.newtiddlerSkeleton);
	var skeletonClone = JSON.parse(this.substituteVariableReferences(skeleton));
	var basetitle = this.newtiddlerTitle;
	var title = basetitle;
	for(var t=1; this.wiki.tiddlerExists(title); t++) {
		title = basetitle + " " + t;
	}
	skeletonClone.title = title;
	for(var modificationField in this.wiki.getModificationFields()) {
		delete skeletonClone[modificationField];
	}
	var created = this.wiki.getCreationFields();
	for(var creationField in created) {
		skeletonClone[modificationField] = created[creationField];
	}
	this.wiki.addTiddler(skeletonClone);
	this.dispatchEvent({type: "tw-edit-tiddler", tiddlerTitle: title});
};


/*
Compute the internal state of the widget
*/
NewtiddlerWidget.prototype.execute = function() {
	// Get attributes
	this.newtiddlerTitle = this.getAttribute("title");
	this.newtiddlerSkeleton = this.getAttribute("skeleton");
	this.newtiddlerClass = this.getAttribute("class","");
	this.newtiddlerStyle = this.getAttribute("style");
	if(this.newtiddlerClass != "") {
		this.newtiddlerClass = " " + this.newtiddlerClass;
	}
	this.newtiddlerClass = "tw-newtiddler-button" + this.newtiddlerClass;
	// Make child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
NewtiddlerWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.title || changedAttributes.skeleton || changedAttributes.class || changedAttributes.style) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.newtiddler = NewtiddlerWidget;

})();
