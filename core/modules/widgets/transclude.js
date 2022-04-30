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
	// Get our attributes into properties of the widget object
	this.collectAttributes();
	// Get the parse tree nodes that we are transcluding
	var target = this.getTransclusionTarget(),
		parseTreeNodes = target.parseTreeNodes;
	this.sourceText = target.source;
	this.sourceType = target.type;
	// Set context variables for recursion detection
	var recursionMarker = this.makeRecursionMarker();
	if(this.recursionMarker === "yes") {
		this.setVariable("transclusion",recursionMarker);
	}
	// Check for recursion
	if(target.parser) {
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
Collect the attributes we need, in the process determining whether we're being used in legacy mode
*/
TranscludeWidget.prototype.collectAttributes = function() {
	this.transcludeTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.transcludeSubTiddler = this.getAttribute("subtiddler");
	this.transcludeField = this.getAttribute("field");
	this.transcludeIndex = this.getAttribute("index");
	this.transcludeMode = this.getAttribute("mode");
	this.recursionMarker = this.getAttribute("recursionMarker","yes");
};

/*
Get transcluded parse tree nodes as an object {parser:,text:,type:}
*/
TranscludeWidget.prototype.getTransclusionTarget = function() {
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
						});
	if(parser) {
		return {
			parser: parser,
			parseTreeNodes: parser.tree,
			text: parser.source,
			type: parser.type
		};
	} else {
		return {
			parser: null,
			parseTreeNodes: this.parseTreeNode.children,
			text: null,
			type: null
		};
	}
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
	var parserInfo = this.wiki.getTextReferenceParserInfo(this.transcludeTitle,this.transcludeField,this.transcludeIndex,{subTiddler:this.transcludeSubTiddler});
	return (this.sourceText === undefined || parserInfo.sourceText !== this.sourceText || parserInfo.parserType !== this.parserType)
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
