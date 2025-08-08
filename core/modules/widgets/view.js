/*\
title: $:/core/modules/widgets/view.js
type: application/javascript
module-type: widget

View widget

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

/*
==========================================
ViewHandler Base Class
==========================================
Base class for all view format handlers.
Provides common functionality and defines the interface for subclasses.
*/
var ViewHandler = function(widget) {
	this.widget = widget;
	this.wiki = widget.wiki;
	this.document = widget.document;
	this.viewTitle = widget.viewTitle;
	this.viewField = widget.viewField;
	this.viewIndex = widget.viewIndex;
	this.viewSubtiddler = widget.viewSubtiddler;
	this.viewTemplate = widget.viewTemplate;
	this.viewMode = widget.viewMode;
};

ViewHandler.prototype.render = function(parent, nextSibling) {
	this.text = this.getValue();
	this.createTextNode(parent, nextSibling);
};

ViewHandler.prototype.getValue = function() {
	return this.widget.getValueAsText();
};

ViewHandler.prototype.createTextNode = function(parent, nextSibling) {
	if(this.text) {
		var textNode = this.document.createTextNode(this.text);
		parent.insertBefore(textNode, nextSibling);
		this.widget.domNodes.push(textNode);
	} else {
		this.widget.makeChildWidgets();
		this.widget.renderChildren(parent, nextSibling);
	}
};

ViewHandler.prototype.refresh = function(changedTiddlers) {
	return false;
};

/*
==========================================
Wikified View Handler Base
==========================================
Base class for wikified view handlers
*/
var WikifiedViewHandler = function(widget) {
	ViewHandler.call(this, widget);
	this.fakeWidget = null;
	this.fakeNode = null;
};

WikifiedViewHandler.prototype = Object.create(ViewHandler.prototype);
WikifiedViewHandler.prototype.constructor = WikifiedViewHandler;

WikifiedViewHandler.prototype.render = function(parent, nextSibling) {
	this.createFakeWidget();
	this.text = this.getValue();
	this.createWikifiedTextNode(parent, nextSibling);
};

WikifiedViewHandler.prototype.createFakeWidget = function() {
	this.fakeWidget = this.wiki.makeTranscludeWidget(this.viewTitle, {
		document: $tw.fakeDocument,
		field: this.viewField,
		index: this.viewIndex,
		parseAsInline: this.viewMode !== "block",
		mode: this.viewMode === "block" ? "block" : "inline",
		parentWidget: this.widget,
		subTiddler: this.viewSubtiddler
	});
	this.fakeNode = $tw.fakeDocument.createElement("div");
	this.fakeWidget.makeChildWidgets();
	this.fakeWidget.render(this.fakeNode, null);
};

WikifiedViewHandler.prototype.createWikifiedTextNode = function(parent, nextSibling) {
	var textNode = this.document.createTextNode(this.text || "");
	parent.insertBefore(textNode, nextSibling);
	this.widget.domNodes.push(textNode);
};

WikifiedViewHandler.prototype.refresh = function(changedTiddlers) {
	var refreshed = this.fakeWidget.refresh(changedTiddlers);
	if(refreshed) {
		var newText = this.getValue();
		if(newText !== this.text) {
			this.widget.domNodes[0].textContent = newText;
			this.text = newText;
		}
	}
	return refreshed;
};

/*
==========================================
Text View Handler
==========================================
Default handler for plain text display
*/
var TextViewHandler = function(widget) {
	ViewHandler.call(this, widget);
};

TextViewHandler.prototype = Object.create(ViewHandler.prototype);
TextViewHandler.prototype.constructor = TextViewHandler;

/*
==========================================
HTML Wikified View Handler
==========================================
Handler for wikified HTML content
*/
var HTMLWikifiedViewHandler = function(widget) {
	WikifiedViewHandler.call(this, widget);
};

HTMLWikifiedViewHandler.prototype = Object.create(WikifiedViewHandler.prototype);
HTMLWikifiedViewHandler.prototype.constructor = HTMLWikifiedViewHandler;

HTMLWikifiedViewHandler.prototype.getValue = function() {
	return this.fakeNode.innerHTML;
};

/*
==========================================
Plain Wikified View Handler
==========================================
Handler for wikified plain text content
*/
var PlainWikifiedViewHandler = function(widget) {
	WikifiedViewHandler.call(this, widget);
};

PlainWikifiedViewHandler.prototype = Object.create(WikifiedViewHandler.prototype);
PlainWikifiedViewHandler.prototype.constructor = PlainWikifiedViewHandler;

PlainWikifiedViewHandler.prototype.getValue = function() {
	return this.fakeNode.textContent;
};

/*
==========================================
HTML Encoded Plain Wikified View Handler
==========================================
Handler for HTML-encoded wikified plain text
*/
var HTMLEncodedPlainWikifiedViewHandler = function(widget) {
	WikifiedViewHandler.call(this, widget);
};

HTMLEncodedPlainWikifiedViewHandler.prototype = Object.create(WikifiedViewHandler.prototype);
HTMLEncodedPlainWikifiedViewHandler.prototype.constructor = HTMLEncodedPlainWikifiedViewHandler;

HTMLEncodedPlainWikifiedViewHandler.prototype.getValue = function() {
	return $tw.utils.htmlEncode(this.fakeNode.textContent);
};

/*
==========================================
HTML Encoded View Handler
==========================================
Handler for HTML-encoded text
*/
var HTMLEncodedViewHandler = function(widget) {
	ViewHandler.call(this, widget);
};

HTMLEncodedViewHandler.prototype = Object.create(ViewHandler.prototype);
HTMLEncodedViewHandler.prototype.constructor = HTMLEncodedViewHandler;

HTMLEncodedViewHandler.prototype.getValue = function() {
	return $tw.utils.htmlEncode(this.widget.getValueAsText());
};

/*
==========================================
HTML Text Encoded View Handler
==========================================
Handler for HTML text-encoded content
*/
var HTMLTextEncodedViewHandler = function(widget) {
	ViewHandler.call(this, widget);
};

HTMLTextEncodedViewHandler.prototype = Object.create(ViewHandler.prototype);
HTMLTextEncodedViewHandler.prototype.constructor = HTMLTextEncodedViewHandler;

HTMLTextEncodedViewHandler.prototype.getValue = function() {
	return $tw.utils.htmlTextEncode(this.widget.getValueAsText());
};

/*
==========================================
URL Encoded View Handler
==========================================
Handler for URL-encoded text
*/
var URLEncodedViewHandler = function(widget) {
	ViewHandler.call(this, widget);
};

URLEncodedViewHandler.prototype = Object.create(ViewHandler.prototype);
URLEncodedViewHandler.prototype.constructor = URLEncodedViewHandler;

URLEncodedViewHandler.prototype.getValue = function() {
	return $tw.utils.encodeURIComponentExtended(this.widget.getValueAsText());
};

/*
==========================================
Double URL Encoded View Handler
==========================================
Handler for double URL-encoded text
*/
var DoubleURLEncodedViewHandler = function(widget) {
	ViewHandler.call(this, widget);
};

DoubleURLEncodedViewHandler.prototype = Object.create(ViewHandler.prototype);
DoubleURLEncodedViewHandler.prototype.constructor = DoubleURLEncodedViewHandler;

DoubleURLEncodedViewHandler.prototype.getValue = function() {
	var text = this.widget.getValueAsText();
	return $tw.utils.encodeURIComponentExtended($tw.utils.encodeURIComponentExtended(text));
};

/*
==========================================
Date View Handler
==========================================
Handler for date formatting
*/
var DateViewHandler = function(widget) {
	ViewHandler.call(this, widget);
};

DateViewHandler.prototype = Object.create(ViewHandler.prototype);
DateViewHandler.prototype.constructor = DateViewHandler;

DateViewHandler.prototype.getValue = function() {
	var format = this.viewTemplate || "YYYY MM DD 0hh:0mm";
	var rawValue = this.widget.getValueAsText();
	var value = $tw.utils.parseDate(rawValue);
	if(value && $tw.utils.isDate(value) && value.toString() !== "Invalid Date") {
		return $tw.utils.formatDateString(value, format);
	} else {
		return "";
	}
};

/*
==========================================
Relative Date View Handler
==========================================
Handler for relative date display
*/
var RelativeDateViewHandler = function(widget) {
	ViewHandler.call(this, widget);
};

RelativeDateViewHandler.prototype = Object.create(ViewHandler.prototype);
RelativeDateViewHandler.prototype.constructor = RelativeDateViewHandler;

RelativeDateViewHandler.prototype.getValue = function() {
	var rawValue = this.widget.getValueAsText();
	var value = $tw.utils.parseDate(rawValue);
	if(value && $tw.utils.isDate(value) && value.toString() !== "Invalid Date") {
		return $tw.utils.getRelativeDate((new Date()) - (new Date(value))).description;
	} else {
		return "";
	}
};

/*
==========================================
Strip Comments View Handler
==========================================
Handler for stripping comments from text
*/
var StripCommentsViewHandler = function(widget) {
	ViewHandler.call(this, widget);
};

StripCommentsViewHandler.prototype = Object.create(ViewHandler.prototype);
StripCommentsViewHandler.prototype.constructor = StripCommentsViewHandler;

StripCommentsViewHandler.prototype.getValue = function() {
	var lines = this.widget.getValueAsText().split("\n"),
		out = [];
	for(var line = 0; line < lines.length; line++) {
		var text = lines[line];
		if(!/^\s*\/\/#/.test(text)) {
			out.push(text);
		}
	}
	return out.join("\n");
};

/*
==========================================
JS Encoded View Handler
==========================================
Handler for JavaScript string encoding
*/
var JSEncodedViewHandler = function(widget) {
	ViewHandler.call(this, widget);
};

JSEncodedViewHandler.prototype = Object.create(ViewHandler.prototype);
JSEncodedViewHandler.prototype.constructor = JSEncodedViewHandler;

JSEncodedViewHandler.prototype.getValue = function() {
	return $tw.utils.stringify(this.widget.getValueAsText());
};

/*
==========================================
ViewHandlerFactory
==========================================
Factory for creating appropriate view handlers based on format
*/
var ViewHandlerFactory = {
	handlers: {
		"text": TextViewHandler,
		"htmlwikified": HTMLWikifiedViewHandler,
		"plainwikified": PlainWikifiedViewHandler,
		"htmlencodedplainwikified": HTMLEncodedPlainWikifiedViewHandler,
		"htmlencoded": HTMLEncodedViewHandler,
		"htmltextencoded": HTMLTextEncodedViewHandler,
		"urlencoded": URLEncodedViewHandler,
		"doubleurlencoded": DoubleURLEncodedViewHandler,
		"date": DateViewHandler,
		"relativedate": RelativeDateViewHandler,
		"stripcomments": StripCommentsViewHandler,
		"jsencoded": JSEncodedViewHandler
	},
	
	createHandler: function(format, widget) {
		var HandlerClass = this.handlers[format] || this.handlers["text"];
		return new HandlerClass(widget);
	},
	
	registerHandler: function(format, handlerClass) {
		this.handlers[format] = handlerClass;
	}
};

/*
==========================================
ViewWidget
==========================================
Main widget class that orchestrates view handlers
*/
var ViewWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

ViewWidget.prototype = new Widget();

ViewWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.viewHandler = ViewHandlerFactory.createHandler(this.viewFormat, this);
	this.viewHandler.render(parent, nextSibling);
};

ViewWidget.prototype.execute = function() {
	this.viewTitle = this.getAttribute("tiddler", this.getVariable("currentTiddler"));
	this.viewSubtiddler = this.getAttribute("subtiddler");
	this.viewField = this.getAttribute("field", "text");
	this.viewIndex = this.getAttribute("index");
	this.viewFormat = this.getAttribute("format", "text");
	this.viewTemplate = this.getAttribute("template", "");
	this.viewMode = this.getAttribute("mode", "block");
};

ViewWidget.prototype.getValue = function(options) {
	options = options || {};
	var value = options.asString ? "" : undefined;
	if(this.viewIndex) {
		value = this.wiki.extractTiddlerDataItem(this.viewTitle, this.viewIndex);
	} else {
		var tiddler;
		if(this.viewSubtiddler) {
			tiddler = this.wiki.getSubTiddler(this.viewTitle, this.viewSubtiddler);
		} else {
			tiddler = this.wiki.getTiddler(this.viewTitle);
		}
		if(tiddler) {
			if(this.viewField === "text" && !this.viewSubtiddler) {
				value = this.wiki.getTiddlerText(this.viewTitle);
			} else {
				if($tw.utils.hop(tiddler.fields, this.viewField)) {
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

ViewWidget.prototype.getValueAsText = function() {
	return this.getValue({asString: true});
};

ViewWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tiddler || changedAttributes.field || changedAttributes.index || 
	   changedAttributes.template || changedAttributes.format || changedTiddlers[this.viewTitle]) {
		this.refreshSelf();
		return true;
	} else {
		return this.viewHandler.refresh(changedTiddlers);
	}
};

exports.view = ViewWidget;
