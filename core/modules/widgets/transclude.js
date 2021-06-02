/*\
title: $:/core/modules/widgets/transclude.js
type: application/javascript
module-type: widget

Transclude widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var TranscludeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
TranscludeWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
TranscludeWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
TranscludeWidget.prototype.execute = function() {
	// Get our parameters
	this.transcludeTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.transcludeSubTiddler = this.getAttribute("subtiddler");
	this.transcludeField = this.getAttribute("field");
	this.transcludeIndex = this.getAttribute("index");
	this.transcludeMode = this.getAttribute("mode");
	this.recursionMarker = this.getAttribute("recursionMarker","yes");
	// Parse the text reference
	var parseAsInline = !this.parseTreeNode.isBlock;
	if(this.transcludeMode === "inline") {
		parseAsInline = true;
	} else if(this.transcludeMode === "block") {
		parseAsInline = false;
	}
	var parser = this.wiki.parseTextReference(
						this.transcludeTitle,
						this.transcludeField,
						this.transcludeIndex,
						{
							parseAsInline: parseAsInline,
							subTiddler: this.transcludeSubTiddler
						}),
		parseTreeNodes = parser ? parser.tree : this.parseTreeNode.children;
	this.sourceText = parser ? parser.source : null;
	this.parserType = parser? parser.type : null;
	// Set context variables for recursion detection
	var recursionMarker = this.makeRecursionMarker();
	if(this.recursionMarker === "yes") {
		this.setVariable("transclusion",recursionMarker);
	}
	// Check for recursion
	if(parser) {
		if(this.parentWidget && this.parentWidget.hasVariable("transclusion",recursionMarker)) {
			parseTreeNodes = [{type: "element", tag: "span", attributes: {
				"class": {type: "string", value: "tc-error"}
			}, children: [
				{type: "text", text: $tw.language.getString("Error/RecursiveTransclusion")}
			]}];
		}
	}
	// Construct the child widgets
	this.makeChildWidgets(parseTreeNodes);
};

/*
Compose a string comprising the title, field and/or index to identify this transclusion for recursion detection
*/
TranscludeWidget.prototype.makeRecursionMarker = function() {
	var output = [];
	output.push("{");
	output.push(this.getVariable("currentTiddler",{defaultValue: ""}));
	output.push("|");
	output.push(this.transcludeTitle || "");
	output.push("|");
	output.push(this.transcludeField || "");
	output.push("|");
	output.push(this.transcludeIndex || "");
	output.push("|");
	output.push(this.transcludeSubTiddler || "");
	output.push("}");
	return output.join("");
};

TranscludeWidget.prototype.parserNeedsRefresh = function() {
	var parserInfo = this.getParserInfo();
	return (parserInfo.sourceText === undefined || parserInfo.sourceText !== this.sourceText || parserInfo.parserType !== this.parserType)
};

/*
Returns the same source and parserType for the widget to be transcluded as wiki.parseTextReference
*/
TranscludeWidget.prototype.getParserInfo = function() {
	var tiddler,
		field = this.transcludeField,
		parserInfo = {
			sourceText : null,
			parserType : "text/vnd.tiddlywiki"
		};
	// Always trigger a refresh for parsers that don't have a source attribute by returning undefined for sourceText
	if(this.sourceText === undefined) {
		parserInfo.sourceText = undefined;
		parserInfo.parserType = undefined;
		return parserInfo;
	}
	if(this.transcludeSubTiddler) {
		tiddler = this.wiki.getSubTiddler(this.transcludeTitle,this.transcludeSubTiddler);
	} else {
		tiddler = this.wiki.getTiddler(this.transcludeTitle);
	}
	if(field === "text" || (!field && !this.transcludeIndex)) {
		if(tiddler && tiddler.fields) {
			parserInfo.sourceText = tiddler.fields.text || "";
			if(tiddler.fields.type) {
				parserInfo.parserType = tiddler.fields.type;
			}
		}
	} else if(field) {
		if(field === "title") {
			parserInfo.sourceText = this.transcludeTitle;
		} else if(tiddler && tiddler.fields) {
			parserInfo.sourceText = tiddler.fields[field] ? tiddler.fields[field].toString() : null;
		}
	} else if(this.transcludeIndex) {
		parserInfo.sourceText = this.wiki.extractTiddlerDataItem(tiddler,this.transcludeIndex,null);
	}
	if(parserInfo.sourceText === null) {
		parserInfo.parserType = null;
	}
	return parserInfo;
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
TranscludeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(($tw.utils.count(changedAttributes) > 0) || (changedTiddlers[this.transcludeTitle] && this.parserNeedsRefresh())) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

exports.transclude = TranscludeWidget;

})();
