/*\
title: $:/core/modules/widgets/view.js
type: application/javascript
module-type: new_widget

View widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ViewWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ViewWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ViewWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var textNode = this.document.createTextNode(this.text);
	parent.insertBefore(textNode,nextSibling);
	this.domNodes.push(textNode);
};

/*
Compute the internal state of the widget
*/
ViewWidget.prototype.execute = function() {
	// Get parameters from our attributes
	this.viewTitle = this.getAttribute("title",this.getVariable("tiddlerTitle"));
	this.viewField = this.getAttribute("field","text");
	this.viewIndex = this.getAttribute("index");
	this.viewFormat = this.getAttribute("format","text");
	// Get the value to display
	var tiddler = this.wiki.getTiddler(this.viewTitle);
	if(tiddler) {
		if(this.viewField === "text") {
			// Calling getTiddlerText() triggers lazy loading of skinny tiddlers
			this.text = this.wiki.getTiddlerText(this.viewTitle);
		} else {
			this.text = tiddler.fields[this.viewField];
		}
	} else { // Use a special value if the tiddler is missing
		switch(this.viewField) {
			case "title":
				this.text = this.getVariable("tiddlerTitle");
				break;
			case "modified":
			case "created":
				this.text = new Date();
				break;
			default:
				this.text = "";
				break;
		}
	}
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ViewWidget.prototype.refresh = function(changedTiddlers) {
	return false;
};

/*
Remove any DOM nodes created by this widget
*/
ViewWidget.prototype.removeChildDomNodes = function() {
	$tw.utils.each(this.domNodes,function(domNode) {
		domNode.parentNode.removeChild(domNode);
	});
};

exports.view = ViewWidget;

})();
