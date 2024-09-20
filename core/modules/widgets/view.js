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

var ViewHandler = function(widget) {
	this.wiki = widget.wiki;
	this.widget = widget;
	this.document = widget.document;
};

/*
Base ViewHandler render method
*/
ViewHandler.prototype.render = function(parent,nextSibling) {
	this.text = this.getValue();
	this.createTextNode(parent,nextSibling);
};

/*
Base ViewHandler render method for wikified views
*/
ViewHandler.prototype.renderWikified = function(parent,nextSibling) {
	this.createFakeWidget();
	this.text = this.getValue();
	this.createWikifiedTextNode(parent,nextSibling);
};

/*
ViewHandler method to create a simple text node
*/
ViewHandler.prototype.createTextNode = function(parent,nextSibling) {
	if(this.text) {
		var textNode = this.document.createTextNode(this.text);
		parent.insertBefore(textNode,nextSibling);
		this.widget.domNodes.push(textNode);
	} else {
		this.widget.makeChildWidgets();
		this.widget.renderChildren(parent,nextSibling);
	}
};

/*
ViewHandler method to always create a text node, even if there's no text
*/
ViewHandler.prototype.createWikifiedTextNode = function(parent,nextSibling) {
	var textNode = this.document.createTextNode(this.text || "");
	parent.insertBefore(textNode,nextSibling);
	this.widget.domNodes.push(textNode);
};

/*
ViewHandler method to create a fake widget used by wikified views
*/
ViewHandler.prototype.createFakeWidget = function() {
	this.fakeWidget = this.wiki.makeTranscludeWidget(this.widget.viewTitle,{
		document: $tw.fakeDocument,
		field: this.widget.viewField,
		index: this.widget.viewIndex,
		parseAsInline: this.widget.viewMode !== "block",
		mode: this.widget.viewMode === "block" ? "block" : "inline",
		parentWidget: this.widget,
		subTiddler: this.widget.viewSubTiddler
	});
	this.fakeNode = $tw.fakeDocument.createElement("div");
	this.fakeWidget.makeChildWidgets();
	this.fakeWidget.render(this.fakeNode,null);
};

ViewHandler.prototype.refreshWikified = function(changedTiddlers) {
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
Base ViewHandler refresh method
*/
ViewHandler.prototype.refresh = function(changedTiddlers) {
	return false;
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
	this.view = this.getView(this.viewFormat);
	this.view.render(parent,nextSibling);
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
};

/*
Initialise the view subclasses
*/
ViewWidget.prototype.getView = function(format) {
	var View = this.initialiseView();
	View.prototype = Object.create(ViewHandler.prototype);
	switch(format) {
		case "htmlwikified":
			View = this.initialiseHTMLWikifiedView(View);
			break;
		case "plainwikified":
			View = this.initialisePlainWikifiedView(View);
			break;
		case "htmlencodedplainwikified":
			View = this.initialiseHTMLEncodedPlainWikifiedView(View);
			break;
		case "htmlencoded":
			View = this.initialiseHTMLEncodedView(View);
			break;
		case "htmltextencoded":
			View = this.initialiseHTMLTextEncodedView(View);
			break;
		case "urlencoded":
			View = this.initialiseURLEncodedView(View);
			break;
		case "doubleurlencoded":
			View = this.initialiseDoubleURLEncodedView(View);
			break;
		case "date":
			View = this.initialiseDateView(View);
			break;
		case "relativedate":
			View = this.initialiseRelativeDateView(View);
			break;
		case "stripcomments":
			View = this.initialiseStripCommentsView(View);
			break;
		case "jsencoded":
			View = this.initialiseJSEncodedView(View);
			break;
		default: // "text"
			View = this.initialiseTextView(View);
			break;
	};
	return new View(this);
};

/*
Return the function to intitialise the view subclass
*/
ViewWidget.prototype.initialiseView = function() {
	return function(widget) {
		ViewHandler.call(this,widget);
	};
};

/*
Initialise HTML wikified view methods
*/
ViewWidget.prototype.initialiseHTMLWikifiedView = function(View) {

	View.prototype.render = function(parent,nextSibling) {
		this.renderWikified(parent,nextSibling);
	};

	View.prototype.getValue = function() {
		return this.fakeNode.innerHTML;
	};

	View.prototype.refresh = function(changedTiddlers) {
		return this.refreshWikified(changedTiddlers);
	};
	return View;
};

/*
Initialise plain wikified view methods
*/
ViewWidget.prototype.initialisePlainWikifiedView = function(View) {

	View.prototype.render = function(parent,nextSibling) {
		this.renderWikified(parent,nextSibling);
	};

	View.prototype.getValue = function() {
		return this.fakeNode.textContent;
	};

	View.prototype.refresh = function(changedTiddlers) {
		return this.refreshWikified(changedTiddlers);
	};
	return View;
};

/*
Initialise HTML encoded plain wikified methods
*/
ViewWidget.prototype.initialiseHTMLEncodedPlainWikifiedView = function(View) {
	
	View.prototype.render = function(parent,nextSibling) {
		this.renderWikified(parent,nextSibling);
	};

	View.prototype.getValue = function() {
		return $tw.utils.htmlEncode(this.fakeNode.textContent);
	};

	View.prototype.refresh = function(changedTiddlers) {
		return this.refreshWikified(changedTiddlers);
	};
	return View;
};

/*
Initialise HTML encoded mehods
*/
ViewWidget.prototype.initialiseHTMLEncodedView = function(View) {
	var self = this;
	View.prototype.getValue = function() {
		return $tw.utils.htmlEncode(self.getValueAsText());
	};
	return View;
};

/*
Initialise HTML text encoded mehods
*/
ViewWidget.prototype.initialiseHTMLTextEncodedView = function(View) {
	var self = this;
	View.prototype.getValue = function() {
		return $tw.utils.htmlTextEncode(self.getValueAsText());
	};
	return View;
};

/*
Initialise URL encoded mehods
*/
ViewWidget.prototype.initialiseURLEncodedView = function(View) {
	var self = this;
	View.prototype.getValue = function() {
		return $tw.utils.encodeURIComponentExtended(self.getValueAsText());
	};
	return View;
};

/*
Initialise double URL encoded mehods
*/
ViewWidget.prototype.initialiseDoubleURLEncodedView = function(View) {
	var self = this;
	View.prototype.getValue = function() {
		return $tw.utils.encodeURIComponentExtended($tw.utils.encodeURIComponentExtended(self.getValueAsText()));
	};
	return View;
};

/*
Initialise date mehods
*/
ViewWidget.prototype.initialiseDateView = function(View) {
	var self = this;
	View.prototype.getValue = function(format) {
		format = format || "YYYY MM DD 0hh:0mm";
		var value = $tw.utils.parseDate(self.getValue());
		if(value && $tw.utils.isDate(value) && value.toString() !== "Invalid Date") {
			return $tw.utils.formatDateString(value,format);
		} else {
			return "";
		}
	};
	return View;
};

/*
Initialise relative date mehods
*/
ViewWidget.prototype.initialiseRelativeDateView = function(View) {
	var self = this;
	View.prototype.getValue = function(format) {
		var value = $tw.utils.parseDate(self.getValue());
		if(value && $tw.utils.isDate(value) && value.toString() !== "Invalid Date") {
			return $tw.utils.getRelativeDate((new Date()) - (new Date(value))).description;
		} else {
			return "";
		}
	};
	return View;
};

/*
Initialise stripcomments mehods
*/
ViewWidget.prototype.initialiseStripCommentsView = function(View) {
	var self = this;
	View.prototype.getValue = function() {
		var lines = self.getValueAsText().split("\n"),
			out = [];
		for(var line=0; line<lines.length; line++) {
			var text = lines[line];
			if(!/^\s*\/\/#/.test(text)) {
				out.push(text);
			}
		}
		return out.join("\n");
	};
	return View;
};

/*
Initialise JS encoded mehods
*/
ViewWidget.prototype.initialiseJSEncodedView = function(View) {
	var self = this;
	View.prototype.getValue = function() {
		return $tw.utils.stringify(self.getValueAsText());
	};
	return View;
};

/*
Initialise text mehods
*/
ViewWidget.prototype.initialiseTextView = function(View) {
	var self = this;
	View.prototype.getValue = function() {
		return self.getValueAsText();
	};
	return View;
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

ViewWidget.prototype.getValueAsText = function() {
	return this.getValue({asString: true});
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
		return this.view.refresh(changedTiddlers);
	}
};

exports.view = ViewWidget;

})();
