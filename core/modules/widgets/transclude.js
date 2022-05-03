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
	// Get our attributes, string parameters, and slot values into properties of the widget object
	this.collectAttributes();
	this.collectStringParameters();
	this.collectSlotValueParameters();
	// Get the parse tree nodes that we are transcluding
	var target = this.getTransclusionTarget(),
		parseTreeNodes = target.parseTreeNodes;
	this.sourceText = target.source;
	this.sourceType = target.type;
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
	var self = this;
	// Detect legacy mode
	this.legacyMode = true;
	$tw.utils.each(this.attributes,function(value,name) {
		if(name.charAt(0) === "$") {
			self.legacyMode = false;
		}
	});
	// Get the attributes for the appropriate mode
	if(this.legacyMode) {
		this.transcludeTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
		this.transcludeSubTiddler = this.getAttribute("subtiddler");
		this.transcludeField = this.getAttribute("field");
		this.transcludeIndex = this.getAttribute("index");
		this.transcludeMode = this.getAttribute("mode");
		this.recursionMarker = this.getAttribute("recursionMarker","yes");
	} else {
		this.transcludeVariable = this.getAttribute("$variable");
		this.transcludeType = this.getAttribute("$type");
		this.transcludeTitle = this.getAttribute("$tiddler",this.getVariable("currentTiddler"));
		this.transcludeSubTiddler = this.getAttribute("$subtiddler");
		this.transcludeField = this.getAttribute("$field");
		this.transcludeIndex = this.getAttribute("$index");
		this.transcludeMode = this.getAttribute("$mode");
		this.recursionMarker = this.getAttribute("$recursionMarker","yes");
	}
};

/*
Collect string parameters
*/
TranscludeWidget.prototype.collectStringParameters = function() {
	var self = this;
	this.stringParametersByName = Object.create(null);
	if(!this.legacyMode) {
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
	}
};

/*
Collect slot value parameters
*/
TranscludeWidget.prototype.collectSlotValueParameters = function() {
	var self = this;
	this.slotValueParseTrees = Object.create(null);
	if(this.legacyMode) {
		this.slotValueParseTrees["ts-missing"] = this.parseTreeNode.children;
	} else {
		var noValueWidgetsFound = true,
			searchParseTreeNodes = function(nodes) {
				$tw.utils.each(nodes,function(node) {
					if(node.type === "value") {
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
	}
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
	var parser;
	if(this.transcludeVariable) {
		var variableInfo = this.getVariableInfo(this.transcludeVariable).srcVariable;
		if(variableInfo) {
			parser = this.wiki.parseText(this.transcludeType,variableInfo.value || "",{parseAsInline: !this.parseTreeNode.isBlock});
			if(parser && variableInfo.isFunctionDefinition) {
				parser = {
					tree: [
						{
							type: "parameters",
							children: parser.tree,
							attributes: {},
							orderedAttributes: []
						}
					]
				}
				$tw.utils.each(variableInfo.variableParams,function(param,index) {
					var attr = {name: param.name, type: "string", value: param["default"]};
					parser.tree[0].attributes[param.name] = attr;
					parser.tree[0].orderedAttributes.push(attr);
				});
			}
		}
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
			parseTreeNodes: (this.slotValueParseTrees["ts-missing"] || []),
			text: null,
			type: null
		};
	}
};

/*
Fetch the value of a parameter
*/
TranscludeWidget.prototype.getTransclusionParameter = function(name,index,defaultValue) {
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
TranscludeWidget.prototype.getTransclusionParameterByPosition = function(index,defaultValue) {
	if(index in this.stringParametersByPosition) {
		return this.stringParametersByPosition[index];
	} else {
		return defaultValue;
	}
};

/*
Fetch the value of a slot
*/
TranscludeWidget.prototype.getTransclusionSlotValue = function(name,defaultParseTreeNodes) {
	if(name && this.slotValueParseTrees[name]) {
		return this.slotValueParseTrees[name];
	} else {
		return defaultParseTreeNodes || [];
	}
};

/*
Compose a string comprising the title, field and/or index to identify this transclusion for recursion detection
*/
TranscludeWidget.prototype.makeRecursionMarker = function() {
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
