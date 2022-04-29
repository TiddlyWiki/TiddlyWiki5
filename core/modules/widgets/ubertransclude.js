/*\
title: $:/core/modules/widgets/ubertransclude.js
type: application/javascript
module-type: widget

Ubertransclude widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var UberTranscludeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
UberTranscludeWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
UberTranscludeWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
UberTranscludeWidget.prototype.execute = function() {
	var self = this;
	// Get our parameters
	this.transcludeVariable = this.getAttribute("$variable");
	this.transcludeType = this.getAttribute("$type");
	this.transcludeTitle = this.getAttribute("$tiddler",this.getVariable("currentTiddler"));
	this.transcludeSubTiddler = this.getAttribute("$subtiddler");
	this.transcludeField = this.getAttribute("$field");
	this.transcludeIndex = this.getAttribute("$index");
	this.transcludeMode = this.getAttribute("$mode");
	this.recursionMarker = this.getAttribute("$recursionMarker","yes");
	// Collect the string parameters
	this.stringParametersByName = Object.create(null);
	$tw.utils.each(this.attributes,function(value,name) {
		if(name.charAt(0) === "$") {
			if(name.charAt(1) === "$") {
				// Attributes starting $$ represent parameters starting with a single $
				name = name.slice(1);
			} else {
				// Attributes starting with a single $ are reserved for the widget
				return;
			}
		}
		self.stringParametersByName[name] = value;
	});
	// Collect the value widgets in our child parse tree
	this.slotValueParseTrees = Object.create(null);
	var noValueWidgetsFound = true,
		searchParseTreeNodes = function(nodes) {
		$tw.utils.each(nodes,function(node) {
			if(node.type === "value" && node.tag === "$value") {
				if(node.attributes["$name"] && node.attributes["$name"].type === "string") {
					var slotValueName = node.attributes["$name"].value;
					self.slotValueParseTrees[slotValueName] = node.children;
				}
				noValueWidgetsFound = false;
			} else {
				searchParseTreeNodes(node.children);
			}
		});
	};
	searchParseTreeNodes(this.parseTreeNode.children);
	if(noValueWidgetsFound) {
		this.slotValueParseTrees["ts-missing"] = this.parseTreeNode.children;
	}
	// Parse the text reference
	var parseAsInline = !this.parseTreeNode.isBlock;
	if(this.transcludeMode === "inline") {
		parseAsInline = true;
	} else if(this.transcludeMode === "block") {
		parseAsInline = false;
	}
	var parser;
	if(this.transcludeVariable) {
		parser = this.wiki.parseText(this.transcludeType,this.getVariable(this.transcludeVariable,""),{parseAsInline: !this.parseTreeNode.isBlock});
	} else {
		parser = this.wiki.parseTextReference(
			this.transcludeTitle,
			this.transcludeField,
			this.transcludeIndex,
			{
				parseAsInline: parseAsInline,
				subTiddler: this.transcludeSubTiddler
			});
	}
	var parseTreeNodes = parser ? parser.tree : (this.slotValueParseTrees["ts-missing"] || []);
	this.sourceText = parser ? parser.source : undefined;
	this.parserType = parser? parser.type : undefined;
	// Wrap the transcluded content if required
	if(this.slotValueParseTrees["ts-wrapper"]) {
		this.slotValueParseTrees["ts-wrapped"] = parseTreeNodes;
		parseTreeNodes = this.slotValueParseTrees["ts-wrapper"];
		this.sourceTest = undefined;
		this.sourceType = undefined;
	}
	// Set context variables for recursion detection
	var recursionMarker = this.makeRecursionMarker();
	if(this.recursionMarker === "yes") {
		this.setVariable("ubertransclusion",recursionMarker);
	}
	// Check for recursion
	if(parser) {
		if(this.parentWidget && this.parentWidget.hasVariable("ubertransclusion",recursionMarker)) {
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
Fetch the value of a parameter
*/
UberTranscludeWidget.prototype.getTransclusionParameter = function(name,index,defaultValue) {
	if(name in this.stringParametersByName) {
		return this.stringParametersByName[name];
	} else {
		var name = "" + index;
		if(name in this.stringParametersByName) {
			return this.stringParametersByName[name];
		}
	}
	return defaultValue;
};


/*
Fetch the value of a parameter identified by its position
*/
UberTranscludeWidget.prototype.getTransclusionParameterByPosition = function(index,defaultValue) {
	if(index in this.stringParametersByPosition) {
		return this.stringParametersByPosition[index];
	} else {
		return defaultValue;
	}
};

/*
Fetch the value of a slot
*/
UberTranscludeWidget.prototype.getTransclusionSlotValue = function(name,defaultParseTreeNodes) {
	if(name && this.slotValueParseTrees[name]) {
		return this.slotValueParseTrees[name];
	} else {
		return defaultParseTreeNodes || [];
	}
};

/*
Compose a string comprising the title, field and/or index to identify this transclusion for recursion detection
*/
UberTranscludeWidget.prototype.makeRecursionMarker = function() {
	var attributes = Object.create(null);
	$tw.utils.each(this.attributes,function(value,name) {
		attributes[name] = value;
	});
	var output = [];
	output.push("{");
	output.push(this.getVariable("currentTiddler",{defaultValue: ""}));
	output.push("|");
	output.push(JSON.stringify(attributes));
	output.push("}");
	return output.join("");
};

UberTranscludeWidget.prototype.parserNeedsRefresh = function() {
	var parserInfo = this.wiki.getTextReferenceParserInfo(this.transcludeTitle,this.transcludeField,this.transcludeIndex,{subTiddler:this.transcludeSubTiddler});
	return (this.sourceText === undefined || parserInfo.sourceText !== this.sourceText || parserInfo.parserType !== this.parserType)
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
UberTranscludeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(($tw.utils.count(changedAttributes) > 0) || (changedTiddlers[this.transcludeTitle] && this.parserNeedsRefresh())) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

exports.ubertransclude = UberTranscludeWidget;

})();
