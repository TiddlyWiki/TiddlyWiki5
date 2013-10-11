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
	switch(this.viewFormat) {
		case "wikified":
			this.text = this.getValueAsWikified();
			break;
		case "htmlwikified":
			this.text = this.getValueAsHtmlWikified();
			break;
		case "htmlencoded":
			this.text = this.getValueAsHtmlEncoded();
			break;
		case "date":
			this.text = this.getValueAsDate(this.viewFormat);
			break;
		case "relativedate":
			this.text = this.getValueAsRelativeDate();
			break;
		default: // "text"
			this.text = this.getValueAsText();
			break;
	}
};

/*
The various formatter functions are baked into this widget for the moment. Eventually they will be replaced by macro functions
*/

ViewWidget.prototype.getValueAsText = function() {
	// Get the value to display
	var text,
		tiddler = this.wiki.getTiddler(this.viewTitle);
	if(tiddler) {
		if(this.viewField === "text") {
			// Calling getTiddlerText() triggers lazy loading of skinny tiddlers
			text = this.wiki.getTiddlerText(this.viewTitle);
		} else {
			text = tiddler.fields[this.viewField];
		}
	} else { // Use a special value if the tiddler is missing
		switch(this.viewField) {
			case "title":
				text = this.getVariable("tiddlerTitle");
				break;
			case "modified":
			case "created":
				text = new Date();
				break;
			default:
				text = "";
				break;
		}
	}
	return text;
};

ViewWidget.prototype.getValueAsHtmlWikified = function() {
	return this.wiki.new_renderText("text/plain","text/vnd.tiddlywiki",this.getValueAsText());
};

ViewWidget.prototype.getValueAsHtmlEncoded = function() {
	return $tw.utils.htmlEncode(this.getValueAsText());
};

ViewWidget.prototype.getValueAsDate = function(format) {
	return $tw.utils.formatDateString(this.getValueAsText(),format);
};

ViewWidget.prototype.getValueAsRelativeDate = function(format) {
	var d = new Date(this.getValueAsText());
	return $tw.utils.getRelativeDate((new Date()) - d).description;
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ViewWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.title || changedAttributes.field || changedAttributes.index || changedTiddlers[this.viewTitle]) {
		this.refreshSelf();
		return true;
	} else {
		return false;	
	}
};

/*
Remove any DOM nodes created by this widget
*/
ViewWidget.prototype.removeChildDomNodes = function() {
	$tw.utils.each(this.domNodes,function(domNode) {
		domNode.parentNode.removeChild(domNode);
	});
	this.domNodes = [];
};

exports.view = ViewWidget;

})();
