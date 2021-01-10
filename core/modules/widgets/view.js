/*\
title: $:/core/modules/widgets/view.js
type: application/javascript
module-type: widget

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
	if(this.text) {
		var textNode = this.document.createTextNode(this.text);
		parent.insertBefore(textNode,nextSibling);
		this.domNodes.push(textNode);
	} else {
		this.makeChildWidgets();
		this.renderChildren(parent,nextSibling);
	}
};

/*
Compute the internal state of the widget
*/
ViewWidget.prototype.execute = function() {
	var formats = getViewWidgetFormats(),
		formatMethod;
	// Get parameters from our attributes
	this.viewTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.viewSubtiddler = this.getAttribute("subtiddler");
	this.viewField = this.getAttribute("field","text");
	this.viewIndex = this.getAttribute("index");
	this.viewFormat = this.getAttribute("format","text");
	this.viewTemplate = this.getAttribute("template","");
	this.viewMode = this.getAttribute("mode","block");

	formatMethod = formats[this.viewFormat];
	if(!formatMethod) {
		// Default to "text"
		formatMethod = formats.text;
	}
	this.text = formatMethod(this,this.viewMode,this.viewTemplate);
};

/*
The various formatter functions are defined by the viewwidgetformat module-type. The default format is "text".
*/

var viewWidgetFormats;

function getViewWidgetFormats() {
	if(!viewWidgetFormats) {
		viewWidgetFormats = Object.create(null);
		$tw.modules.applyMethods("viewwidgetformat",viewWidgetFormats);
	}
	return viewWidgetFormats;
};

/*
Retrieve the value of the widget. Options are:
asString: Optionally return the value as a string
*/
ViewWidget.prototype.getValue = function(options) {
	options = options || {};
	var value = options.asString ? "" : undefined;
	if(this.viewIndex) {
		value = this.wiki.extractTiddlerDataItem(this.viewTitle,this.viewIndex);
	} else {
		var tiddler;
		if(this.viewSubtiddler) {
			tiddler = this.wiki.getSubTiddler(this.viewTitle,this.viewSubtiddler);	
		} else {
			tiddler = this.wiki.getTiddler(this.viewTitle);
		}
		if(tiddler) {
			if(this.viewField === "text" && !this.viewSubtiddler) {
				// Calling getTiddlerText() triggers lazy loading of skinny tiddlers
				value = this.wiki.getTiddlerText(this.viewTitle);
			} else {
				if($tw.utils.hop(tiddler.fields,this.viewField)) {
					if(options.asString) {
						value = tiddler.getFieldString(this.viewField);
					} else {
						value = tiddler.fields[this.viewField];				
					}
				}
			}
		} else {
			if(this.viewField === "title") {
				value = this.viewTitle;
			}
		}
	}
	return value;
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ViewWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tiddler || changedAttributes.field || changedAttributes.index || changedAttributes.template || changedAttributes.format || changedTiddlers[this.viewTitle]) {
		this.refreshSelf();
		return true;
	} else {
		return false;	
	}
};

exports.view = ViewWidget;

})();
