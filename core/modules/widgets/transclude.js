/*\
title: $:/core/modules/widgets/transclude.js
type: application/javascript
module-type: widget

Transclude widget

\*/

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
	try {
		this.renderChildren(parent,nextSibling);
	} catch(error) {
		if(error instanceof $tw.utils.TranscludeRecursionError) {
			// We were infinite looping.
			// We need to try and abort as much of the loop as we can, so we will keep "throwing" upward until we find a transclusion that has a different signature.
			// Hopefully that will land us just outside where the loop began. That's where we want to issue an error.
			// Rendering widgets beneath this point may result in a freezing browser if they explode exponentially.
			var transcludeSignature = this.getVariable("transclusion");
			if(this.getAncestorCount() > $tw.utils.TranscludeRecursionError.MAX_WIDGET_TREE_DEPTH - 50) {
				// For the first fifty transcludes we climb up, we simply collect signatures.
				// We're assuming that those first 50 will likely include all transcludes involved in the loop.
				error.signatures[transcludeSignature] = true;
			} else if(!error.signatures[transcludeSignature]) {
				// Now that we're past the first 50, let's look for the first signature that wasn't in the loop. That'll be where we print the error and resume rendering.
				this.children = [this.makeChildWidget({type: "error", attributes: {
					"$message": {type: "string", value: $tw.language.getString("Error/RecursiveTransclusion")}
				}})];
				this.renderChildren(parent,nextSibling);
				return;
			}
		}
		throw error;
	}
};

/*
Compute the internal state of the widget
*/
TranscludeWidget.prototype.execute = function() {
	// Get our attributes, string parameters, and slot values into properties of the widget object
	this.collectAttributes();
	this.collectStringParameters();
	this.collectSlotFillParameters();
	// Determine whether we're being used in inline or block mode
	var parseAsInline = !this.parseTreeNode.isBlock;
	if(this.transcludeMode === "inline") {
		parseAsInline = true;
	} else if(this.transcludeMode === "block") {
		parseAsInline = false;
	}
	// Set 'thisTiddler'
	this.setVariable("thisTiddler",this.transcludeTitle);
	var parseTreeNodes, target;
	// Process the transclusion according to the output type
	switch(this.transcludeOutput || "text/html") {
		case "text/html":
			// Return the parse tree nodes of the target
			target = this.parseTransclusionTarget(parseAsInline);
			this.parseAsInline = target.parseAsInline;
			parseTreeNodes = target.parseTreeNodes;
			break;
		case "text/raw":
			// Just return the raw text
			target = this.getTransclusionTarget();
			parseTreeNodes = [{type: "text", text: target.text}];
			break;
		default:
			// "text/plain" is the plain text result of wikifying the text
			target = this.parseTransclusionTarget(parseAsInline);
			var widgetNode = this.wiki.makeWidget(target.parser,{
				parentWidget: this,
				document: $tw.fakeDocument
			});
			var container = $tw.fakeDocument.createElement("div");
			widgetNode.render(container,null);
			parseTreeNodes = [{type: "text", text: container.textContent}];
			break;
	}
	this.sourceText = target.text;
	this.parserType = target.type;
	this._canonical_uri = target._canonical_uri;
	// Set the legacy transclusion context variables only if we're not transcluding a variable
	if(!this.transcludeVariable) {
		var recursionMarker = this.makeRecursionMarker();
		this.setVariable("transclusion",recursionMarker);
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
		this.transcludeVariableIsFunction = false;
		this.transcludeType = this.getAttribute("$type");
		this.transcludeOutput = this.getAttribute("$output","text/html");
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
TranscludeWidget.prototype.collectSlotFillParameters = function() {
	var self = this;
	this.slotFillParseTrees = Object.create(null);
	if(this.legacyMode) {
		this.slotFillParseTrees["ts-missing"] = this.parseTreeNode.children;
	} else {
		this.slotFillParseTrees["ts-raw"] = this.parseTreeNode.children;
		var noFillWidgetsFound = true,
			searchParseTreeNodes = function(nodes) {
				$tw.utils.each(nodes,function(node) {
					if(node.type === "fill") {
						if(node.attributes["$name"] && node.attributes["$name"].type === "string") {
							var slotValueName = node.attributes["$name"].value;
							self.slotFillParseTrees[slotValueName] = node.children || [];
						}
						noFillWidgetsFound = false;
					} else {
						searchParseTreeNodes(node.children);
					}
				});
			};
		searchParseTreeNodes(this.parseTreeNode.children);
		if(noFillWidgetsFound) {
			this.slotFillParseTrees["ts-missing"] = this.parseTreeNode.children;
		}
	}
};

/*
Get transcluded details as an object {text:,type:}
*/
TranscludeWidget.prototype.getTransclusionTarget = function() {
	var self = this;
	var text;
	// Return the text and type of the target
	if(this.hasAttribute("$variable")) {
		if(this.transcludeVariable) {
			// Transcluding a variable
			var variableInfo = this.getVariableInfo(this.transcludeVariable,{params: this.getOrderedTransclusionParameters()});
			this.transcludeVariableIsFunction = variableInfo.srcVariable && variableInfo.srcVariable.isFunctionDefinition;
			text = variableInfo.text;
			this.transcludeFunctionResult = text;
			return {
				text: variableInfo.text,
				type: this.transcludeType
			};
		}
	} else {
		// Transcluding a text reference
		var parserInfo = this.wiki.getTextReferenceParserInfo(
						this.transcludeTitle,
						this.transcludeField,
						this.transcludeIndex,
						{
							subTiddler: this.transcludeSubTiddler,
							defaultType: this.transcludeType
						});
		return {
			text: parserInfo.text,
			type: parserInfo.type,
			_canonical_uri: parserInfo._canonical_uri
		};
	}
};

/*
Get transcluded parse tree nodes as an object {text:,type:,parseTreeNodes:,parseAsInline:}
*/
TranscludeWidget.prototype.parseTransclusionTarget = function(parseAsInline) {
	var self = this;
	var parser;
	// Get the parse tree
	if(this.hasAttribute("$variable")) {
		if(this.transcludeVariable) {
			// Transcluding a variable
			var variableInfo = this.getVariableInfo(this.transcludeVariable,{params: this.getOrderedTransclusionParameters()}),
				srcVariable = variableInfo && variableInfo.srcVariable;
			if(srcVariable && srcVariable.isFunctionDefinition) {
				this.transcludeVariableIsFunction = true;
				this.transcludeFunctionResult = (variableInfo.resultList ? variableInfo.resultList[0] : variableInfo.text) || "";
			}
			if(variableInfo.text) {
				if(srcVariable && srcVariable.isFunctionDefinition) {
					parser = {
						tree: [{
							type: "text",
							text: this.transcludeFunctionResult
						}],
						source: this.transcludeFunctionResult,
						type: "text/vnd.tiddlywiki"
					};
					if(parseAsInline) {
						parser.tree[0] = {
							type: "text",
							text: this.transcludeFunctionResult
						};
					} else {
						parser.tree[0] = {
							type: "element",
							tag: "p",
							children: [{
								type: "text",
								text: this.transcludeFunctionResult
							}]
						}
					}
				} else {
					var cacheKey = (parseAsInline ? "inlineParser" : "blockParser") + (this.transcludeType || "");
					if(variableInfo.isCacheable && srcVariable[cacheKey]) {
						parser = srcVariable[cacheKey];
					} else {
						parser = this.wiki.parseText(this.transcludeType,variableInfo.text || "",{parseAsInline: parseAsInline, configTrimWhiteSpace: srcVariable && srcVariable.configTrimWhiteSpace});
						if(variableInfo.isCacheable) {
							srcVariable[cacheKey] = parser;
						}
					}
				}
				if(parser) {
					// Add parameters widget for procedures and custom widgets
					if(srcVariable && (srcVariable.isProcedureDefinition || srcVariable.isWidgetDefinition)) {
						parser = {
							tree: [
								{
									type: "parameters",
									children: parser.tree
								}
							],
							source: parser.source,
							type: parser.type
						}
						$tw.utils.each(srcVariable.params,function(param) {
							var name = param.name;
							// Parameter names starting with dollar must be escaped to double dollars
							if(name.charAt(0) === "$") {
								name = "$" + name;
							}
							$tw.utils.addAttributeToParseTreeNode(parser.tree[0],name,param["default"])
						});
					} else if(srcVariable && !srcVariable.isFunctionDefinition) {
						// For macros and ordinary variables, wrap the parse tree in a vars widget assigning the parameters to variables named "__paramname__"
						parser = {
							tree: [
								{
									type: "vars",
									children: parser.tree
								}
							],
							source: parser.source,
							type: parser.type
						}
						$tw.utils.each(variableInfo.params,function(param) {
							$tw.utils.addAttributeToParseTreeNode(parser.tree[0],"__" + param.name + "__",param.value)
						});
					}
				}
			}
		}
	} else {
		// Transcluding a text reference
		parser = this.wiki.parseTextReference(
						this.transcludeTitle,
						this.transcludeField,
						this.transcludeIndex,
						{
							parseAsInline: parseAsInline,
							subTiddler: this.transcludeSubTiddler,
							defaultType: this.transcludeType
						});
	}
	// Return the parse tree
	return {
		parser: parser,
		parseTreeNodes: parser ? parser.tree : (this.slotFillParseTrees["ts-missing"] || []),
		parseAsInline: parseAsInline,
		text: parser && parser.source,
		type: parser && parser.type
	};
};

/*
Fetch all the string parameters as an ordered array of {name:, value:} where the name is optional
*/
TranscludeWidget.prototype.getOrderedTransclusionParameters = function() {
	var result = [];
	// Collect the parameters
	for(var name in this.stringParametersByName) {
		var value = this.stringParametersByName[name];
		result.push({name: name, value: value});
	}
	// Sort numerical parameter names first
	result.sort(function(a,b) {
		var aIsNumeric = !isNaN(a.name),
			bIsNumeric = !isNaN(b.name);
		if(aIsNumeric && bIsNumeric) {
			return a.name - b.name;
		} else if(aIsNumeric) {
			return -1;
		} else if(bIsNumeric) {
			return 1;
		} else {
			return a.name === b.name ? 0 : (a.name < b.name ? -1 : 1);
		}
	});
	// Remove names from numerical parameters
	$tw.utils.each(result,function(param,index) {
		if(!isNaN(param.name)) {
			delete param.name;
		}
	});
	return result;
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
Get one of the special parameters to be provided by the parameters widget
*/
TranscludeWidget.prototype.getTransclusionMetaParameters = function() {
	var self = this;
	return {
		"parseMode": function() {
			return self.parseAsInline ? "inline" : "block";
		},
		"parseTreeNodes": function() {
			return JSON.stringify(self.parseTreeNode.children || []);
		},
		"slotFillParseTreeNodes": function() {
			return JSON.stringify(self.slotFillParseTrees);
		},
		"params": function() {
			return JSON.stringify(self.stringParametersByName);
		}
	};
};

/*
Fetch the value of a slot
*/
TranscludeWidget.prototype.getTransclusionSlotFill = function(name,defaultParseTreeNodes) {
	if(name && this.slotFillParseTrees[name] && this.slotFillParseTrees[name].length > 0) {
		return this.slotFillParseTrees[name];
	} else {
		return defaultParseTreeNodes || [];
	}
};

/*
Return whether this transclusion should be visible to the slot widget
*/
TranscludeWidget.prototype.hasVisibleSlots = function() {
	return this.getAttribute("$fillignore","no") === "no";
}

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
	// Doesn't need to consider transcluded variables because a parent variable can't change once a widget has been created
	var parserInfo = this.wiki.getTextReferenceParserInfo(this.transcludeTitle,this.transcludeField,this.transcludeIndex,{
		subTiddler: this.transcludeSubTiddler,
		defaultType: this.transcludeType
	});
	return (this.sourceText === undefined || parserInfo.sourceText !== this.sourceText || parserInfo.parserType !== this.parserType || parserInfo._canonical_uri !== this._canonical_uri);
};

TranscludeWidget.prototype.functionNeedsRefresh = function() {
	var oldResult = this.transcludeFunctionResult;
	var variableInfo = this.getVariableInfo(this.transcludeVariable,{params: this.getOrderedTransclusionParameters()});
	var newResult = (variableInfo.resultList ? variableInfo.resultList[0] : variableInfo.text) || "";
	return oldResult !== newResult;
}

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
TranscludeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(($tw.utils.count(changedAttributes) > 0) || (this.transcludeVariableIsFunction && this.functionNeedsRefresh()) || (!this.transcludeVariable && changedTiddlers[this.transcludeTitle] && this.parserNeedsRefresh())) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

exports.transclude = TranscludeWidget;
