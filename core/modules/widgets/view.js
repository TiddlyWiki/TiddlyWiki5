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
	// Get parameters from our attributes
	this.viewTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.viewSubtiddler = this.getAttribute("subtiddler");
	this.viewField = this.getAttribute("field","text");
	this.viewIndex = this.getAttribute("index");
	this.viewFormat = this.getAttribute("format","text");
	this.viewTemplate = this.getAttribute("template","");
	this.viewMode = this.getAttribute("mode","block");
	switch(this.viewFormat) {
		case "htmlwikified":
			this.text = this.getValueAsHtmlWikified(this.viewMode);
			break;
		case "plainwikified":
			this.text = this.getValueAsPlainWikified(this.viewMode);
			break;
		case "htmlencodedplainwikified":
			this.text = this.getValueAsHtmlEncodedPlainWikified(this.viewMode);
			break;
		case "htmlencoded":
			this.text = this.getValueAsHtmlEncoded();
			break;
		case "htmltextencoded":
			this.text = this.getValueAsHtmlTextEncoded();
			break;
		case "urlencoded":
			this.text = this.getValueAsUrlEncoded();
			break;
		case "doubleurlencoded":
			this.text = this.getValueAsDoubleUrlEncoded();
			break;
		case "date":
			this.text = this.getValueAsDate(this.viewTemplate);
			break;
		case "relativedate":
			this.text = this.getValueAsRelativeDate();
			break;
		case "stripcomments":
			this.text = this.getValueAsStrippedComments();
			break;
		case "jsencoded":
			this.text = this.getValueAsJsEncoded();
			break;
		default: // "text"
			this.text = this.getValueAsText();
			break;
	}
};

/*
The various formatter functions are baked into this widget for the moment. Eventually they will be replaced by macro functions
*/

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

ViewWidget.prototype.getValueAsText = function() {
	return this.getValue({asString: true});
};

ViewWidget.prototype.getValueAsHtmlWikified = function(mode) {
	return this.wiki.renderText("text/html","text/vnd.tiddlywiki",this.getValueAsText(),{
		parseAsInline: mode !== "block",
		parentWidget: this
	});
};

ViewWidget.prototype.getValueAsPlainWikified = function(mode) {
	return this.wiki.renderText("text/plain","text/vnd.tiddlywiki",this.getValueAsText(),{
		parseAsInline: mode !== "block",
		parentWidget: this
	});
};

ViewWidget.prototype.getValueAsHtmlEncodedPlainWikified = function(mode) {
	return $tw.utils.htmlEncode(this.wiki.renderText("text/plain","text/vnd.tiddlywiki",this.getValueAsText(),{
		parseAsInline: mode !== "block",
		parentWidget: this
	}));
};

ViewWidget.prototype.getValueAsHtmlEncoded = function() {
	return $tw.utils.htmlEncode(this.getValueAsText());
};

ViewWidget.prototype.getValueAsHtmlTextEncoded = function() {
	return $tw.utils.htmlTextEncode(this.getValueAsText());
};

ViewWidget.prototype.getValueAsUrlEncoded = function() {
	return $tw.utils.encodeURIComponentExtended(this.getValueAsText());
};

ViewWidget.prototype.getValueAsDoubleUrlEncoded = function() {
	return $tw.utils.encodeURIComponentExtended($tw.utils.encodeURIComponentExtended(this.getValueAsText()));
};

ViewWidget.prototype.getValueAsDate = function(format) {
	format = format || "YYYY MM DD 0hh:0mm";
	var value = $tw.utils.parseDate(this.getValue());
	if(value && $tw.utils.isDate(value) && value.toString() !== "Invalid Date") {
		return $tw.utils.formatDateString(value,format);
	} else {
		return "";
	}
};

ViewWidget.prototype.getValueAsRelativeDate = function(format) {
	var value = $tw.utils.parseDate(this.getValue());
	if(value && $tw.utils.isDate(value) && value.toString() !== "Invalid Date") {
		return $tw.utils.getRelativeDate((new Date()) - (new Date(value))).description;
	} else {
		return "";
	}
};

ViewWidget.prototype.getValueAsStrippedComments = function() {
	var lines = this.getValueAsText().split("\n"),
		out = [];
	for(var line=0; line<lines.length; line++) {
		var text = lines[line];
		if(!/^\s*\/\/#/.test(text)) {
			out.push(text);
		}
	}
	return out.join("\n");
};

ViewWidget.prototype.getValueAsJsEncoded = function() {
	return $tw.utils.stringify(this.getValueAsText());
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
