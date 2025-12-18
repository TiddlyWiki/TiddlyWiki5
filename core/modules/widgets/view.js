/*\
title: $:/core/modules/widgets/view.js
type: application/javascript
module-type: widget

View widget

\*/

"use strict";

const Widget = require("$:/core/modules/widgets/widget.js").widget;

/*
==========================================
ViewHandler Base Class
==========================================
Base class for all view format handlers.
Provides common functionality and defines the interface for subclasses.
*/
class ViewHandler {
	constructor(widget) {
		this.widget = widget;
		this.wiki = widget.wiki;
		this.document = widget.document;
		this.viewTitle = widget.viewTitle;
		this.viewField = widget.viewField;
		this.viewIndex = widget.viewIndex;
		this.viewSubtiddler = widget.viewSubtiddler;
		this.viewTemplate = widget.viewTemplate;
		this.viewMode = widget.viewMode;
	}

	render(parent, nextSibling) {
		this.text = this.getValue();
		this.createTextNode(parent, nextSibling);
	}

	getValue() {
		return this.widget.getValueAsText();
	}

	createTextNode(parent, nextSibling) {
		if(this.text) {
			const textNode = this.document.createTextNode(this.text);
			parent.insertBefore(textNode, nextSibling);
			this.widget.domNodes.push(textNode);
		} else {
			this.widget.makeChildWidgets();
			this.widget.renderChildren(parent, nextSibling);
		}
	}

	refresh() {
		var self = this;
		return false;
	}
}

/*
==========================================
Wikified View Handler Base
==========================================
Base class for wikified view handlers
*/
class WikifiedViewHandler extends ViewHandler {
	constructor(widget) {
		super(widget);
		this.fakeWidget = null;
		this.fakeNode = null;
	}

	render(parent, nextSibling) {
		this.createFakeWidget();
		this.text = this.getValue();
		this.createWikifiedTextNode(parent, nextSibling);
	}

	createFakeWidget() {
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
	}

	createWikifiedTextNode(parent, nextSibling) {
		const textNode = this.document.createTextNode(this.text || "");
		parent.insertBefore(textNode, nextSibling);
		this.widget.domNodes.push(textNode);
	}

	refresh(changedTiddlers) {
		const refreshed = this.fakeWidget.refresh(changedTiddlers);
		if(refreshed) {
			const newText = this.getValue();
			if(newText !== this.text) {
				this.widget.domNodes[0].textContent = newText;
				this.text = newText;
			}
		}
		return refreshed;
	}
}

/*
==========================================
Text View Handler
==========================================
Default handler for plain text display
*/
class TextViewHandler extends ViewHandler {}

/*
==========================================
HTML Wikified View Handler
==========================================
Handler for wikified HTML content
*/
class HTMLWikifiedViewHandler extends WikifiedViewHandler {
	getValue() {
		return this.fakeNode.innerHTML;
	}
}

/*
==========================================
Plain Wikified View Handler
==========================================
Handler for wikified plain text content
*/
class PlainWikifiedViewHandler extends WikifiedViewHandler {
	getValue() {
		return this.fakeNode.textContent;
	}
}

/*
==========================================
HTML Encoded Plain Wikified View Handler
==========================================
Handler for HTML-encoded wikified plain text
*/
class HTMLEncodedPlainWikifiedViewHandler extends WikifiedViewHandler {
	getValue() {
		return $tw.utils.htmlEncode(this.fakeNode.textContent);
	}
}

/*
==========================================
HTML Encoded View Handler
==========================================
Handler for HTML-encoded text
*/
class HTMLEncodedViewHandler extends ViewHandler {
	getValue() {
		return $tw.utils.htmlEncode(this.widget.getValueAsText());
	}
}

/*
==========================================
HTML Text Encoded View Handler
==========================================
Handler for HTML text-encoded content
*/
class HTMLTextEncodedViewHandler extends ViewHandler {
	getValue() {
		return $tw.utils.htmlTextEncode(this.widget.getValueAsText());
	}
}

/*
==========================================
URL Encoded View Handler
==========================================
Handler for URL-encoded text
*/
class URLEncodedViewHandler extends ViewHandler {
	getValue() {
		return $tw.utils.encodeURIComponentExtended(this.widget.getValueAsText());
	}
}

/*
==========================================
Double URL Encoded View Handler
==========================================
Handler for double URL-encoded text
*/
class DoubleURLEncodedViewHandler extends ViewHandler {
	getValue() {
		const text = this.widget.getValueAsText();
		return $tw.utils.encodeURIComponentExtended($tw.utils.encodeURIComponentExtended(text));
	}
}

/*
==========================================
Date View Handler
==========================================
Handler for date formatting
*/
class DateViewHandler extends ViewHandler {
	getValue() {
		const format = this.viewTemplate || "YYYY MM DD 0hh:0mm";
		const rawValue = this.widget.getValueAsText();
		const value = $tw.utils.parseDate(rawValue);
		if(value && $tw.utils.isDate(value) && value.toString() !== "Invalid Date") {
			return $tw.utils.formatDateString(value, format);
		} else {
			return "";
		}
	}
}

/*
==========================================
Relative Date View Handler
==========================================
Handler for relative date display
*/
class RelativeDateViewHandler extends ViewHandler {
	getValue() {
		const rawValue = this.widget.getValueAsText();
		const value = $tw.utils.parseDate(rawValue);
		if(value && $tw.utils.isDate(value) && value.toString() !== "Invalid Date") {
			return $tw.utils.getRelativeDate((new Date()) - (new Date(value))).description;
		} else {
			return "";
		}
	}
}

/*
==========================================
Strip Comments View Handler
==========================================
Handler for stripping comments from text
*/
class StripCommentsViewHandler extends ViewHandler {
	getValue() {
		const lines = this.widget.getValueAsText().split("\n");
		const out = [];
		for(const text of lines) {
			if(!/^\s*\/\/#/.test(text)) {
				out.push(text);
			}
		}
		return out.join("\n");
	}
}

/*
==========================================
JS Encoded View Handler
==========================================
Handler for JavaScript string encoding
*/
class JSEncodedViewHandler extends ViewHandler {
	getValue() {
		return $tw.utils.stringify(this.widget.getValueAsText());
	}
}

/*
==========================================
ViewHandlerFactory
==========================================
Factory for creating appropriate view handlers based on format
*/
const ViewHandlerFactory = {
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
	
	createHandler(format, widget) {
		const HandlerClass = this.handlers[format] || this.handlers["text"];
		return new HandlerClass(widget);
	},
	
	registerHandler(format, handlerClass) {
		this.handlers[format] = handlerClass;
	}
};

/*
==========================================
ViewWidget
==========================================
Main widget class that orchestrates view handlers
*/
class ViewWidget extends Widget {
	constructor(parseTreeNode, options) {
		super();
		this.initialise(parseTreeNode, options);
	}

	render(parent, nextSibling) {
		this.parentDomNode = parent;
		this.computeAttributes();
		this.execute();
		this.viewHandler = ViewHandlerFactory.createHandler(this.viewFormat, this);
		this.viewHandler.render(parent, nextSibling);
	}

	execute() {
		this.viewTitle = this.getAttribute("tiddler", this.getVariable("currentTiddler"));
		this.viewSubtiddler = this.getAttribute("subtiddler");
		this.viewField = this.getAttribute("field", "text");
		this.viewIndex = this.getAttribute("index");
		this.viewFormat = this.getAttribute("format", "text");
		this.viewTemplate = this.getAttribute("template", "");
		this.viewMode = this.getAttribute("mode", "block");
	}

	getValue(options = {}) {
		let value = options.asString ? "" : undefined;
		if(this.viewIndex) {
			value = this.wiki.extractTiddlerDataItem(this.viewTitle, this.viewIndex);
		} else {
			let tiddler;
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
	}

	getValueAsText() {
		return this.getValue({asString: true});
	}

	refresh(changedTiddlers) {
		const changedAttributes = this.computeAttributes();
		if(changedAttributes.tiddler || changedAttributes.field || changedAttributes.index || 
		   changedAttributes.template || changedAttributes.format || changedTiddlers[this.viewTitle]) {
			this.refreshSelf();
			return true;
		} else {
			return this.viewHandler.refresh(changedTiddlers);
		}
	}
}

exports.view = ViewWidget;