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
	this.transcludeField = this.getAttribute("field");
	this.transcludeIndex = this.getAttribute("index");
	this.transcludeMode = this.getAttribute("mode");
	// Check for recursion
	var recursionMarker = this.makeRecursionMarker();
	if(this.parentWidget && this.parentWidget.hasVariable("transclusion",recursionMarker)) {
		this.makeChildWidgets([{type: "text", text: "Recursive transclusion error in transclude widget"}]);
		return;
	}
	// Set context variables for recursion detection
	this.setVariable("transclusion",recursionMarker);
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
						{parseAsInline: parseAsInline}),
		parseTreeNodes = parser ? parser.tree : this.parseTreeNode.children;
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
	output.push("}");
	return output.join("");
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
TranscludeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tiddler || changedAttributes.field || changedAttributes.index || changedTiddlers[this.transcludeTitle]) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);		
	}
};

exports.transclude = TranscludeWidget;

})();
