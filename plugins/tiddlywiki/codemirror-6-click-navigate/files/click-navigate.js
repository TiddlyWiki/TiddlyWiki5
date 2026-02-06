/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/click-navigate.js
type: application/javascript
module-type: codemirror6-plugin

TiddlyWiki Click Navigation Plugin - Ctrl+Click (or Cmd+Click on Mac) opens tiddler.

Features:
- Ctrl+Click on [[link]] opens tiddler
- Ctrl+Click on {{transclusion}} opens tiddler
- Ctrl+Click on CamelCase opens tiddler (if exists)
- Ctrl+Click on macro opens definition tiddler
- Visual indication when Ctrl is held

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var _syntaxTree = null;

// Node types that always contain tiddler titles
var TIDDLER_TITLE_NODES = {
	"LinkTarget": "link",
	"LinkText": "link",
	"TransclusionTarget": "transclusion",
	"FilterTextRef": "textref",
	"FilterTextRefTarget": "textref",
	"CamelCaseLink": "camelcase",
	"SystemLink": "systemlink",
	"ImageSource": "image"
};

// Node types that contain external URLs
var EXTERNAL_URL_NODES = {
	"URLLink": "url"
};

// Filter operators whose operand is a tiddler title or text reference
// Based on TiddlyWiki5/core/modules/filters/
var TIDDLER_TITLE_OPERATORS = {
	"title": true, // operand is tiddler title
	"tag": true, // operand is tag name (= tiddler title)
	"list": true // operand is text reference (tiddler!!field or tiddler##index)
};

// Widget attributes that contain tiddler titles
var TIDDLER_TITLE_WIDGET_ATTRS = {
	"$link": ["to"],
	"$tiddler": ["tiddler"],
	"$transclude": ["tiddler"],
	"$image": ["source"]
};

/**
 * Check if CamelCase wikilinks are enabled
 * @param {object} wiki - The wiki object (defaults to $tw.wiki)
 */
function isCamelCaseEnabled(wiki) {
	wiki = wiki || $tw.wiki;
	if(!wiki) return true; // Default to enabled
	var config = wiki.getTiddlerText("$:/config/WikiParserRules/Inline/wikilink", "enable");
	return config !== "disable";
}

/**
 * Get the operator name for a FilterOperand node by finding the FilterOperatorName sibling
 */
function getFilterOperatorName(state, operandNode) {
	var parent = operandNode.parent;
	if(!parent || parent.name !== "FilterOperator") return null;

	// Find the FilterOperatorName sibling
	for(var child = parent.firstChild; child; child = child.nextSibling) {
		if(child.name === "FilterOperatorName") {
			var opName = state.doc.sliceString(child.from, child.to);
			// Remove negation prefix and any suffix (e.g., "!tag:strict" -> "tag")
			opName = opName.replace(/^!/, "").split(":")[0];
			return opName;
		}
	}
	return null;
}

/**
 * Get widget and attribute info for an AttributeValue node
 * Returns { widgetName, attrName } or null
 */
function getWidgetAttributeInfo(valueNode) {
	// Walk up to find the Attribute node
	var current = valueNode.parent;
	var attrName = null;

	while(current) {
		// Look for Attribute node with AttributeName child
		if(current.name === "Attribute" || current.name === "WidgetAttribute") {
			// Find the AttributeName child
			for(var child = current.firstChild; child; child = child.nextSibling) {
				if(child.name === "AttributeName") {
					attrName = child;
					break;
				}
			}
			break;
		}
		current = current.parent;
	}

	if(!attrName) return null;

	// Continue walking up to find the Widget node
	while(current) {
		if(current.name === "Widget" || current.name === "InlineWidget" ||
			current.name === "SelfClosingWidget" || current.name === "HTMLOpenTag" ||
			(current.name && current.name.match && current.name.match(/^Widget/))) {
			// Find the WidgetName or TagName child
			for(var child = current.firstChild; child; child = child.nextSibling) {
				if(child.name === "WidgetName" || child.name === "TagName") {
					return {
						widgetName: null, // Will be filled by caller reading the text
						widgetNameNode: child,
						attrName: null, // Will be filled by caller reading the text
						attrNameNode: attrName
					};
				}
			}
			break;
		}
		current = current.parent;
	}

	return null;
}

/**
 * Get widget and attribute info with text values
 */
function getWidgetAttributeInfoWithText(state, valueNode) {
	var info = getWidgetAttributeInfo(valueNode);
	if(!info) return null;

	return {
		widgetName: state.doc.sliceString(info.widgetNameNode.from, info.widgetNameNode.to),
		attrName: state.doc.sliceString(info.attrNameNode.from, info.attrNameNode.to)
	};
}

// ============================================================================
// Link Detection using Syntax Tree
// ============================================================================

/**
 * Extract link target and type from position in document using syntax tree
 * @param {EditorState} state - The editor state
 * @param {number} pos - Position in document
 * @param {object} context - Optional context with { tiddlerTitle, engine }
 */
function getLinkAtPos(state, pos, context) {
	if(!_syntaxTree) return null;

	var tree = _syntaxTree(state);
	if(!tree) return null;

	var node = tree.resolveInner(pos, 0);
	if(!node) return null;

	// Get current tiddler info for local definition detection
	var currentTitle = context && context.tiddlerTitle;
	var currentText = state.doc.toString();

	// Build call-site analysis for dynamic scope resolution
	var callAnalysis = buildCallSiteAnalysis(tree, currentText);

	// Walk up the tree to find a tiddler title node
	var current = node;
	while(current) {
		var nodeType = TIDDLER_TITLE_NODES[current.name];
		if(nodeType) {
			var target = state.doc.sliceString(current.from, current.to);

			// For LinkText, check if parent is WikiLink and has no LinkTarget sibling
			if(current.name === "LinkText") {
				var parent = current.parent;
				if(parent && parent.name === "WikiLink") {
					// Check if there's a LinkTarget sibling
					var hasTarget = false;
					for(var child = parent.firstChild; child; child = child.nextSibling) {
						if(child.name === "LinkTarget") {
							hasTarget = true;
							break;
						}
					}
					if(hasTarget) {
						// LinkText is display text, not the target - skip
						current = current.parent;
						continue;
					}
				}
			}

			// For CamelCaseLink, check if wikilinks are enabled
			if(current.name === "CamelCaseLink") {
				if(!isCamelCaseEnabled()) {
					current = current.parent;
					continue;
				}
			}

			// For FilterTextRef, extract just the tiddler title (before !! or ##)
			if(current.name === "FilterTextRef" || current.name === "FilterTextRefTarget") {
				// Get content without braces
				var content = target;
				if(content.startsWith("{") && content.endsWith("}")) {
					content = content.slice(1, -1);
				}
				// Extract tiddler title (before !! or ##)
				var sepIdx = content.indexOf("!!");
				if(sepIdx === -1) sepIdx = content.indexOf("##");
				if(sepIdx > 0) {
					target = content.substring(0, sepIdx);
				} else {
					target = content;
				}
			}


			return {
				type: nodeType,
				target: target,
				from: current.from,
				to: current.to
			};
		}

		// Check for external URL nodes
		var urlType = EXTERNAL_URL_NODES[current.name];
		if(urlType) {
			var url = state.doc.sliceString(current.from, current.to);
			return {
				type: urlType,
				target: url,
				from: current.from,
				to: current.to,
				isExternal: true
			};
		}

		// Check for filter operand - title shortcut [[title]] or operators that take tiddler titles
		if(current.name === "FilterOperand") {
			var opName = getFilterOperatorName(state, current);
			// Handle: 1) title shortcut [[title]] (no operator), 2) operators that take tiddler titles
			if(!opName || TIDDLER_TITLE_OPERATORS[opName]) {
				var target = state.doc.sliceString(current.from, current.to);
				// Remove quotes if present
				if((target.startsWith("\"") && target.endsWith("\"")) ||
					(target.startsWith("'") && target.endsWith("'")) ||
					(target.startsWith("[") && target.endsWith("]")) ||
					(target.startsWith("{") && target.endsWith("}"))) {
					target = target.slice(1, -1);
				}
				// For list operator, extract tiddler title from text reference
				if(opName === "list") {
					var sepIdx = target.indexOf("!!");
					if(sepIdx === -1) sepIdx = target.indexOf("##");
					if(sepIdx > 0) {
						target = target.substring(0, sepIdx);
					}
				}
				return {
					type: opName === "tag" ? "tag" : "title",
					target: target,
					from: current.from,
					to: current.to
				};
			}
			current = current.parent;
			continue;
		}

		// Check for widget attribute values that contain tiddler titles (e.g., <$link to="Title">)
		if(current.name === "AttributeValue" || current.name === "AttributeValueContent") {
			var attrInfo = getWidgetAttributeInfoWithText(state, current);
			if(attrInfo && TIDDLER_TITLE_WIDGET_ATTRS[attrInfo.widgetName]) {
				var validAttrs = TIDDLER_TITLE_WIDGET_ATTRS[attrInfo.widgetName];
				if(validAttrs.indexOf(attrInfo.attrName) !== -1) {
					var target = state.doc.sliceString(current.from, current.to);
					// Remove quotes if present
					if((target.startsWith("\"") && target.endsWith("\"")) ||
						(target.startsWith("'") && target.endsWith("'"))) {
						target = target.slice(1, -1);
					}
					return {
						type: "link",
						target: target,
						from: current.from,
						to: current.to
					};
				}
			}
		}

		// Check for macro name (includes procedures, functions)
		if(current.name === "MacroName") {
			var macroName = state.doc.sliceString(current.from, current.to);
			var def = findDefinition(macroName, currentTitle, currentText);
			// Find the parent MacroCall for bounds
			var macroCall = current.parent;
			while(macroCall && macroCall.name !== "MacroCall") {
				macroCall = macroCall.parent;
			}
			if(def) {
				return {
					type: def.type, // "define", "procedure", "function", or "widget"
					target: def.tiddler,
					macroName: macroName,
					from: macroCall ? macroCall.from : current.from,
					to: macroCall ? macroCall.to : current.to,
					definitionIndex: def.index,
					isLocal: def.isLocal
				};
			}
			// Check for parameter definition within enclosing macro/procedure/function
			// Also handle <<__param__>> syntax by stripping underscores
			var paramName = macroName;
			if(paramName.startsWith("__") && paramName.endsWith("__")) {
				paramName = paramName.slice(2, -2);
			}
			var paramDef = findParameterDefinition(paramName, state, pos);
			if(paramDef) {
				return {
					type: "parameter",
					target: currentTitle,
					macroName: macroName,
					from: macroCall ? macroCall.from : current.from,
					to: macroCall ? macroCall.to : current.to,
					definitionIndex: paramDef.index,
					isLocal: true
				};
			}
			// Check for widget-defined variable (e.g., <$set name="varName">, <$list variable="item">)
			var widgetDef = findWidgetVariableDefinition(macroName, state, pos);
			if(widgetDef) {
				return {
					type: "widget-variable",
					target: currentTitle,
					macroName: macroName,
					from: macroCall ? macroCall.from : current.from,
					to: macroCall ? macroCall.to : current.to,
					definitionIndex: widgetDef.index,
					isLocal: true
				};
			}
			// Check for variable in call-site scope (dynamic scoping across macro calls)
			var callSiteDef = findVariableInCallSiteScope(macroName, state, pos, callAnalysis);
			if(callSiteDef) {
				return {
					type: "widget-variable",
					target: currentTitle,
					macroName: macroName,
					from: macroCall ? macroCall.from : current.from,
					to: macroCall ? macroCall.to : current.to,
					definitionIndex: callSiteDef.index,
					isLocal: true
				};
			}
			// Check for JavaScript macro module
			var jsMacroTiddler = findJavaScriptModule("macros", macroName);
			if(jsMacroTiddler) {
				return {
					type: "macro",
					target: jsMacroTiddler,
					macroName: macroName,
					from: macroCall ? macroCall.from : current.from,
					to: macroCall ? macroCall.to : current.to
				};
			}
		}

		// Check for widget name
		if(current.name === "WidgetName") {
			var widgetName = state.doc.sliceString(current.from, current.to);
			// Find the parent widget tag for bounds
			var widgetTag = current.parent;
			while(widgetTag && !widgetTag.name.includes("Widget")) {
				widgetTag = widgetTag.parent;
			}

			// First check if it's a custom widget defined with \widget
			var def = findDefinition(widgetName, currentTitle, currentText);
			if(def && def.type === "widget") {
				return {
					type: "widget",
					target: def.tiddler,
					widgetName: widgetName,
					from: widgetTag ? widgetTag.from : current.from,
					to: widgetTag ? widgetTag.to : current.to,
					definitionIndex: def.index,
					isLocal: def.isLocal
				};
			}

			// Check for JavaScript widget module
			// Remove $ prefix for module name
			var jsWidgetName = widgetName.startsWith("$") ? widgetName.slice(1) : widgetName;
			var jsWidgetTiddler = findJavaScriptModule("widgets", jsWidgetName);
			if(jsWidgetTiddler) {
				return {
					type: "widget",
					target: jsWidgetTiddler,
					widgetName: widgetName,
					from: widgetTag ? widgetTag.from : current.from,
					to: widgetTag ? widgetTag.to : current.to
				};
			}
			// No definition found - don't return a link
		}

		// Check for filter variable <variable> or <__param__>
		if(current.name === "FilterVariable") {
			// FilterVariable includes angle brackets, extract the name
			var varText = state.doc.sliceString(current.from, current.to);
			var varName = varText.replace(/^<|>$/g, "").trim();
			// Strip __underscores__ if present
			var paramName = varName;
			if(paramName.startsWith("__") && paramName.endsWith("__")) {
				paramName = paramName.slice(2, -2);
			}
			var paramDef = findParameterDefinition(paramName, state, pos);
			if(paramDef) {
				return {
					type: "parameter",
					target: currentTitle,
					macroName: varName,
					from: current.from,
					to: current.to,
					definitionIndex: paramDef.index,
					isLocal: true
				};
			}
			// Also check for widget-defined variables
			var widgetDef = findWidgetVariableDefinition(paramName, state, pos);
			if(widgetDef) {
				return {
					type: "widget-variable",
					target: currentTitle,
					macroName: varName,
					from: current.from,
					to: current.to,
					definitionIndex: widgetDef.index,
					isLocal: true
				};
			}
			// Check call-site scope (dynamic scoping)
			var callSiteDef = findVariableInCallSiteScope(paramName, state, pos, callAnalysis);
			if(callSiteDef) {
				return {
					type: "widget-variable",
					target: currentTitle,
					macroName: varName,
					from: current.from,
					to: current.to,
					definitionIndex: callSiteDef.index,
					isLocal: true
				};
			}
		}

		// Check for substituted parameter <__param__> (SubstitutedParam node)
		if(current.name === "SubstitutedParamName") {
			var varName = state.doc.sliceString(current.from, current.to).trim();
			// Strip __underscores__ if present
			var paramName = varName;
			if(paramName.startsWith("__") && paramName.endsWith("__")) {
				paramName = paramName.slice(2, -2);
			}
			// Get parent SubstitutedParam for bounds
			var parentNode = current.parent;
			var paramDef = findParameterDefinition(paramName, state, pos);
			if(paramDef) {
				return {
					type: "parameter",
					target: currentTitle,
					macroName: varName,
					from: parentNode ? parentNode.from : current.from,
					to: parentNode ? parentNode.to : current.to,
					definitionIndex: paramDef.index,
					isLocal: true
				};
			}
			// Also check for widget-defined variables
			var widgetDef = findWidgetVariableDefinition(paramName, state, pos);
			if(widgetDef) {
				return {
					type: "widget-variable",
					target: currentTitle,
					macroName: varName,
					from: parentNode ? parentNode.from : current.from,
					to: parentNode ? parentNode.to : current.to,
					definitionIndex: widgetDef.index,
					isLocal: true
				};
			}
			// Check call-site scope (dynamic scoping)
			var callSiteDef = findVariableInCallSiteScope(paramName, state, pos, callAnalysis);
			if(callSiteDef) {
				return {
					type: "widget-variable",
					target: currentTitle,
					macroName: varName,
					from: parentNode ? parentNode.from : current.from,
					to: parentNode ? parentNode.to : current.to,
					definitionIndex: callSiteDef.index,
					isLocal: true
				};
			}
		}

		// Check for $(variable)$ substitution - VariableName inside Variable
		// Also handles $param$ substitution - VariableName inside Placeholder
		if(current.name === "VariableName") {
			var parentNode = current.parent;
			if(parentNode && (parentNode.name === "Variable" || parentNode.name === "Placeholder")) {
				var varName = state.doc.sliceString(current.from, current.to).trim();
				var paramDef = findParameterDefinition(varName, state, pos);
				if(paramDef) {
					return {
						type: "parameter",
						target: currentTitle,
						macroName: varName,
						from: parentNode.from,
						to: parentNode.to,
						definitionIndex: paramDef.index,
						isLocal: true
					};
				}
				// Also check for widget-defined variables
				var widgetDef = findWidgetVariableDefinition(varName, state, pos);
				if(widgetDef) {
					return {
						type: "widget-variable",
						target: currentTitle,
						macroName: varName,
						from: parentNode.from,
						to: parentNode.to,
						definitionIndex: widgetDef.index,
						isLocal: true
					};
				}
				// Check call-site scope (dynamic scoping)
				var callSiteDef = findVariableInCallSiteScope(varName, state, pos, callAnalysis);
				if(callSiteDef) {
					return {
						type: "widget-variable",
						target: currentTitle,
						macroName: varName,
						from: parentNode.from,
						to: parentNode.to,
						definitionIndex: callSiteDef.index,
						isLocal: true
					};
				}
			}
		}

		current = current.parent;
	}

	return null;
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Find a JavaScript module tiddler for a widget or macro
 * @param {string} moduleType - "widgets" or "macros"
 * @param {string} name - The name of the widget/macro (without $ prefix for widgets)
 * @returns {string|null} - The tiddler title or null if not found
 */
function findJavaScriptModule(moduleType, name) {
	if(!$tw || !$tw.wiki) return null;

	try {
		// Handle widget names - convert to lowercase for matching
		var moduleName = name.toLowerCase();

		// Search for module tiddlers matching the pattern
		// module-type is singular: "widget" or "macro"
		var moduleTypeSingular = moduleType.slice(0, -1);
		var filter = "[all[tiddlers+shadows]module-type[" + moduleTypeSingular + "]]";
		var modules = $tw.wiki.filterTiddlers(filter);

		for(var i = 0; i < modules.length; i++) {
			var title = modules[i];

			// Check if title ends with /{name}.js
			var titleLower = title.toLowerCase();
			if(titleLower.endsWith("/" + moduleName + ".js")) {
				return title;
			}

			// For hyphenated names, also check without hyphens
			if(moduleName.indexOf("-") !== -1) {
				var moduleNameNoHyphens = moduleName.replace(/-/g, "");
				if(titleLower.endsWith("/" + moduleNameNoHyphens + ".js")) {
					return title;
				}
			}
		}

		// If title match didn't work, check exports in the module text
		for(var i = 0; i < modules.length; i++) {
			var title = modules[i];
			var tiddler = $tw.wiki.getTiddler(title);
			if(!tiddler) continue;

			var text = tiddler.fields.text || "";
			if(!text) continue;

			// For widgets: look for exports.{name} = pattern
			if(moduleType === "widgets") {
				if(text.indexOf("exports." + moduleName) !== -1 ||
					text.indexOf("exports['" + moduleName + "']") !== -1 ||
					text.indexOf('exports["' + moduleName + '"]') !== -1) {
					return title;
				}
			}

			// For macros: look for exports.name = "macroname" pattern
			if(moduleType === "macros") {
				var nameMatch = text.match(/exports\.name\s*=\s*["']([^"']+)["']/);
				if(nameMatch && nameMatch[1].toLowerCase() === moduleName) {
					return title;
				}
			}
		}
	} catch (e) {
		// Silently ignore errors
	}

	return null;
}

/**
 * Find definition of a macro, procedure, function, or widget
 * Returns { tiddler, index, type, isLocal } or null
 *
 * @param {string} name - The name to find (e.g., "myMacro" or "$myWidget")
 * @param {string} currentTiddlerTitle - Title of the current tiddler (for local check)
 * @param {string} currentText - Text of the current tiddler (for local check)
 */
function findDefinition(name, currentTiddlerTitle, currentText) {
	if(!$tw || !$tw.wiki) return null;

	// Build regex that matches \define, \procedure, \function, or \widget
	// Handle names that might have special regex chars (like $widget.name)
	var escapedName = escapeRegex(name);
	var regexPattern = "\\\\(define|procedure|function|widget)\\s+" + escapedName + "(?:\\s*\\(|\\s*$|\\s*\\n)";

	// 1. Check current tiddler first (local definition)
	if(currentText) {
		var localRegex = new RegExp(regexPattern, "gm");
		var match = localRegex.exec(currentText);
		if(match) {
			return {
				tiddler: currentTiddlerTitle,
				index: match.index,
				type: match[1],
				isLocal: true
			};
		}
	}

	// 2. Search in $:/tags/Macro and $:/tags/Global tiddlers first (user definitions)
	var globalTiddlers = $tw.wiki.filterTiddlers(
		"[all[tiddlers+shadows]tag[$:/tags/Macro]] [all[tiddlers+shadows]tag[$:/tags/Global]]"
	);
	for(var i = 0; i < globalTiddlers.length; i++) {
		var title = globalTiddlers[i];
		if(title === currentTiddlerTitle) continue; // Skip current tiddler, already checked
		var tiddler = $tw.wiki.getTiddler(title);
		if(tiddler && tiddler.fields.text) {
			var regex = new RegExp(regexPattern, "gm");
			var match = regex.exec(tiddler.fields.text);
			if(match) {
				return {
					tiddler: title,
					index: match.index,
					type: match[1],
					isLocal: false
				};
			}
		}
	}

	// 3. Search in shadow tiddlers that are tagged $:/tags/Macro or $:/tags/Global (core/plugin definitions)
	var shadows = $tw.wiki.filterTiddlers(
		"[all[shadows]tag[$:/tags/Macro]] [all[shadows]tag[$:/tags/Global]]"
	);
	for(var i = 0; i < shadows.length; i++) {
		var title = shadows[i];
		var tiddler = $tw.wiki.getTiddler(title);
		if(tiddler && tiddler.fields.text) {
			var regex = new RegExp(regexPattern, "gm");
			var match = regex.exec(tiddler.fields.text);
			if(match) {
				return {
					tiddler: title,
					index: match.index,
					type: match[1],
					isLocal: false
				};
			}
		}
	}

	return null;
}

/**
 * Find a parameter definition within an enclosing macro/procedure/function/widget.
 * This handles cases like <<param>> inside \define myMacro(param)
 * Returns { index, type } or null
 *
 * @param {string} varName - The variable name to find
 * @param {EditorState} state - The editor state
 * @param {number} pos - Current position in document
 */
function findParameterDefinition(varName, state, pos) {
	if(!_syntaxTree) return null;

	var tree = _syntaxTree(state);
	if(!tree) return null;

	var node = tree.resolveInner(pos, 0);

	// Walk up to find enclosing definition
	var current = node;
	while(current) {
		var defType = current.name;
		if(defType === "MacroDefinition" || defType === "ProcedureDefinition" ||
			defType === "FunctionDefinition" || defType === "WidgetDefinition") {
			// Found an enclosing definition, check its parameters
			var defText = state.doc.sliceString(current.from, current.to);
			var firstLineEnd = defText.indexOf('\n');
			var firstLine = firstLineEnd > 0 ? defText.substring(0, firstLineEnd) : defText;

			// Extract parameters from the first line
			// Pattern: \define name(param1, param2: default, ...)
			var paramMatch = firstLine.match(/\(([^)]*)\)/);
			if(paramMatch) {
				var paramsStr = paramMatch[1];
				var params = paramsStr.split(',');

				// Find the parameter and its position
				var searchPos = 0;
				for(var i = 0; i < params.length; i++) {
					var param = params[i];
					var colonIdx = param.indexOf(':');
					var paramName = colonIdx > 0 ? param.substring(0, colonIdx).trim() : param.trim();

					if(paramName === varName) {
						// Find position of this parameter in the params string
						var paramStartInStr = paramsStr.indexOf(param);
						// Skip leading whitespace in the param
						var leadingWs = param.match(/^\s*/)[0].length;

						// Calculate absolute position
						var parensStart = current.from + firstLine.indexOf('(') + 1;
						var paramPos = parensStart + paramStartInStr + leadingWs;

						return {
							index: paramPos,
							type: "parameter"
						};
					}
				}
			}
		}
		current = current.parent;
	}

	return null;
}

// ============================================================================
// Call-Site Analysis for Dynamic Scope Resolution
// ============================================================================

/**
 * Extract definition name from a definition node
 */
function extractDefinitionName(defNode, docText) {
	var text = docText.slice(defNode.from, Math.min(defNode.from + 200, defNode.to));
	var match = /\\(?:define|procedure|function|widget)\s+([^\s(]+)/.exec(text);
	return match ? match[1] : null;
}

/**
 * Build call-site analysis for dynamic scope resolution
 */
function buildCallSiteAnalysis(tree, docText) {
	var definitions = {};
	var callSites = {};

	// First pass: collect all definitions
	tree.iterate({
		enter: function(node) {
			var typeName = node.type.name;
			if(typeName === "MacroDefinition" || typeName === "ProcedureDefinition" ||
				typeName === "FunctionDefinition" || typeName === "WidgetDefinition") {
				var name = extractDefinitionName(node.node, docText);
				if(name) {
					definitions[name] = {
						from: node.from,
						to: node.to,
						node: node.node
					};
					callSites[name] = [];
				}
			}
		}
	});

	// Helper to find which definition contains a position
	function getDefinitionAtPosition(pos) {
		var bestMatch = null;
		var bestSize = Infinity;
		for(var name in definitions) {
			var def = definitions[name];
			if(pos >= def.from && pos <= def.to) {
				var size = def.to - def.from;
				if(size < bestSize) {
					bestMatch = name;
					bestSize = size;
				}
			}
		}
		return bestMatch;
	}

	// Second pass: collect call sites with their widget scope context
	tree.iterate({
		enter: function(node) {
			if(node.type.name === "MacroName") {
				var calledName = docText.slice(node.from, node.to).trim();
				if(callSites[calledName] !== undefined) {
					var callerDef = getDefinitionAtPosition(node.from);
					// Collect enclosing widgets at this call site
					var enclosingWidgets = collectEnclosingWidgets(node.node, docText);
					callSites[calledName].push({
						callerDef: callerDef,
						enclosingWidgets: enclosingWidgets,
						pos: node.from
					});
				}
			}
		}
	});

	return {
		definitions: definitions,
		callSites: callSites,
		getDefinitionAtPosition: getDefinitionAtPosition
	};
}

/**
 * Collect enclosing scope-creating widgets with their variable definitions
 */
function collectEnclosingWidgets(node, docText) {
	var widgets = [];
	var current = node;
	while(current) {
		var isWidget = current.name === "Widget" || current.name === "InlineWidget" ||
			(current.name && current.name.match && current.name.match(/^Widget\s*\d*$/));
		if(isWidget) {
			var widgetText = docText.slice(current.from, current.to);
			var widgetMatch = widgetText.match(/^<(\$[\w-]+)/);
			if(widgetMatch) {
				var widgetType = widgetMatch[1];
				var scopeType = SCOPE_CREATING_WIDGETS[widgetType];
				if(scopeType) {
					// Find end of opening tag (handle quoted attributes)
					var tagEnd = findOpeningTagEnd(widgetText);
					var openingTag = widgetText.substring(0, tagEnd);
					var attrsStart = openingTag.indexOf(widgetType) + widgetType.length;
					var attrs = openingTag.substring(attrsStart);
					var vars = extractWidgetVariables(widgetType, attrs, scopeType);
					if(vars.length > 0) {
						widgets.push({
							widgetType: widgetType,
							widgetFrom: current.from,
							attrsStart: current.from + attrsStart,
							attrs: attrs,
							vars: vars,
							scopeType: scopeType
						});
					}
				}
			}
		}
		current = current.parent;
	}
	return widgets;
}

/**
 * Find the end of an opening tag, handling quoted attributes
 */
function findOpeningTagEnd(text) {
	var inSingleQuote = false;
	var inDoubleQuote = false;
	for(var i = 0; i < text.length; i++) {
		var ch = text[i];
		if(ch === '"' && !inSingleQuote) inDoubleQuote = !inDoubleQuote;
		else if(ch === "'" && !inDoubleQuote) inSingleQuote = !inSingleQuote;
		else if(ch === '>' && !inSingleQuote && !inDoubleQuote) return i;
	}
	return text.length;
}

/**
 * Find variable definition through call-site scope (dynamic scoping)
 * Returns { index, widgetName } or null
 */
function findVariableInCallSiteScope(varName, state, pos, callAnalysis) {
	if(!callAnalysis) return null;

	// Find which definition we're in
	var currentDef = callAnalysis.getDefinitionAtPosition(pos);
	if(!currentDef) return null;

	// Get call sites for this definition
	var sites = callAnalysis.callSites[currentDef];
	if(!sites || sites.length === 0) return null;

	// Search through call sites for the variable
	var visited = new Set();
	return searchCallSitesForVariable(varName, currentDef, callAnalysis, visited);
}

/**
 * Recursively search call sites for a variable definition
 */
function searchCallSitesForVariable(varName, defName, callAnalysis, visited) {
	if(visited.has(defName)) return null; // Cycle detection
	visited.add(defName);

	var sites = callAnalysis.callSites[defName];
	if(!sites) return null;

	for(var i = 0; i < sites.length; i++) {
		var site = sites[i];
		// Check enclosing widgets at this call site
		for(var j = 0; j < site.enclosingWidgets.length; j++) {
			var widget = site.enclosingWidgets[j];
			if(widget.vars.indexOf(varName) !== -1) {
				// Found! Return position
				var varIdx = findVariablePositionInWidget(varName, widget.attrs, widget.scopeType);
				return {
					index: widget.attrsStart + varIdx,
					widgetName: widget.widgetType
				};
			}
		}
		// If called from another definition, search that too
		if(site.callerDef) {
			var found = searchCallSitesForVariable(varName, site.callerDef, callAnalysis, new Set(visited));
			if(found) return found;
		}
	}

	return null;
}

/**
 * Widget types that create variable scopes and how to extract variable names.
 * "all" = all attributes are variable names
 * string = specific attribute contains the variable name
 */
var SCOPE_CREATING_WIDGETS = {
	"$let": "all",
	"$vars": "all",
	"$set": "name",
	"$setvariable": "name",
	"$parameters": "all",
	"$list": "variable", // Also has "counter" attribute
	"$range": "variable",
	"$qualify": "name",
	"$wikify": "name",
	"$setmultiplevariables": "all",
	"$droppable": "actions", // Actually sets variables via actions, skip for now
	"$importvariables": null // Imports from tiddler, complex to handle
};

// Additional attributes that define variables for specific widgets
var ADDITIONAL_VARIABLE_ATTRS = {
	"$list": ["counter", "variable"],
	"$range": ["variable"]
};

/**
 * Find a widget-based variable definition in the enclosing scope.
 * This handles cases like <<myVar>> where myVar is set by <$let myVar="..."> or <$set name="myVar">
 * Returns { index, widgetName } or null
 *
 * @param {string} varName - The variable name to find
 * @param {EditorState} state - The editor state
 * @param {number} pos - Current position in document
 */
function findWidgetVariableDefinition(varName, state, pos) {
	if(!_syntaxTree) return null;

	var tree = _syntaxTree(state);
	if(!tree) return null;

	var node = tree.resolveInner(pos, 0);

	// Walk up to find enclosing scope-creating widgets
	var current = node;
	while(current) {
		// Check for Widget nodes (Widget, InlineWidget, or Widget with number suffix)
		if(current.name === "Widget" || current.name === "InlineWidget" ||
			current.name.match(/^Widget\s*\d*$/)) {
			// Find the WidgetName child to get the widget type
			var widgetNameNode = null;
			var widgetText = state.doc.sliceString(current.from, current.to);

			// Extract widget name from the opening tag
			var widgetMatch = widgetText.match(/^<(\$[\w-]+)/);
			if(widgetMatch) {
				var widgetType = widgetMatch[1];
				var scopeType = SCOPE_CREATING_WIDGETS[widgetType];

				if(scopeType) {
					// Extract the opening tag's attributes
					var tagEndIdx = widgetText.indexOf('>');
					if(tagEndIdx === -1) tagEndIdx = widgetText.length;
					var openingTag = widgetText.substring(0, tagEndIdx);
					var attrsStart = openingTag.indexOf(widgetType) + widgetType.length;
					var attrs = openingTag.substring(attrsStart);

					var definedVars = extractWidgetVariables(widgetType, attrs, scopeType);

					if(definedVars.indexOf(varName) !== -1) {
						// Find the position of the variable definition in the widget
						var varIdx = findVariablePositionInWidget(varName, attrs, scopeType);
						return {
							index: current.from + attrsStart + varIdx,
							widgetName: widgetType
						};
					}
				}
			}
		}
		current = current.parent;
	}

	return null;
}

/**
 * Extract variable names defined by a widget
 */
function extractWidgetVariables(widgetType, attrs, scopeType) {
	var vars = [];

	if(scopeType === "all") {
		// All attributes are variable names (for $let, $vars, $parameters, $setmultiplevariables)
		var attrRegex = /([a-zA-Z_][\w-]*)\s*=/g;
		var match;
		while((match = attrRegex.exec(attrs)) !== null) {
			vars.push(match[1]);
		}
		// Also handle bare attributes for $parameters
		if(widgetType === "$parameters") {
			var withoutQuotes = attrs.replace(/"[^"]*"|'[^']*'|\[\[[^\]]*\]\]/g, '');
			var bareRegex = /\b([a-zA-Z_][\w-]*)\b(?!\s*=)/g;
			var assignedNames = new Set(vars);
			while((match = bareRegex.exec(withoutQuotes)) !== null) {
				if(!assignedNames.has(match[1])) {
					vars.push(match[1]);
				}
			}
		}
	} else if(scopeType) {
		// Specific attribute contains the variable name
		var attrName = scopeType;
		// Match name="value", name='value', or name=value
		var specificRegex = new RegExp(attrName + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i');
		var match = specificRegex.exec(attrs);
		if(match) {
			var value = match[1] || match[2] || match[3];
			// Skip dynamic values
			if(value && !/^<<|^\{\{|^\{\{\{|^`/.test(value)) {
				vars.push(value);
			}
		}
	}

	// Check for additional variable attributes (e.g., $list has both 'variable' and 'counter')
	var additionalAttrs = ADDITIONAL_VARIABLE_ATTRS[widgetType];
	if(additionalAttrs) {
		for(var i = 0; i < additionalAttrs.length; i++) {
			var attrName = additionalAttrs[i];
			if(attrName === scopeType) continue; // Already handled
			var specificRegex = new RegExp(attrName + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i');
			var match = specificRegex.exec(attrs);
			if(match) {
				var value = match[1] || match[2] || match[3];
				if(value && !/^<<|^\{\{|^\{\{\{|^`/.test(value) && vars.indexOf(value) === -1) {
					vars.push(value);
				}
			}
		}
	}

	return vars;
}

/**
 * Find the position of a variable definition within widget attributes
 */
function findVariablePositionInWidget(varName, attrs, scopeType) {
	if(scopeType === "all") {
		// Look for varName= or bare varName
		var regex = new RegExp('\\b' + escapeRegex(varName) + '\\b');
		var match = regex.exec(attrs);
		return match ? match.index : 0;
	} else {
		// Look for attrName="varName" or attrName=varName
		var regex = new RegExp(scopeType + '\\s*=\\s*["\']?' + escapeRegex(varName));
		var match = regex.exec(attrs);
		if(match) {
			// Return position of the actual variable name, not the attribute name
			return match.index + match[0].indexOf(varName);
		}
		return 0;
	}
}

// ============================================================================
// Navigation
// ============================================================================

/**
 * Navigate to a tiddler
 */
function navigateToTiddler(title, options) {
	options = options || {};

	if(!$tw || !$tw.wiki) return;

	// Use TiddlyWiki's navigation mechanism
	var event = {
		type: "tm-navigate",
		navigateTo: title,
		navigateFromTitle: options.fromTitle
	};

	// If we have a widget, use its dispatch
	if(options.widget && options.widget.dispatchEvent) {
		options.widget.dispatchEvent(event);
	} else {
		// Fallback: dispatch to root widget
		var rootWidget = $tw.rootWidget;
		if(rootWidget && rootWidget.dispatchEvent) {
			rootWidget.dispatchEvent(event);
		}
	}
}

/**
 * Open tiddler in new window/tab
 */
function openInNewWindow(title) {
	if(!$tw) return;

	// Create permalink
	var permalink = "#" + encodeURIComponent(title);
	window.open(window.location.pathname + permalink, "_blank");
}

// ============================================================================
// Visual Feedback
// ============================================================================

var _currentHighlight = null;

/**
 * Add underline decoration to clickable link
 */
function highlightLink(view, from, to) {
	// Remove existing highlight
	clearHighlight(view);

	// Add CSS class to the editor for styling
	view.dom.classList.add("cm6-ctrl-held");

	_currentHighlight = {
		from: from,
		to: to
	};
}

/**
 * Remove highlight and reset cursor
 */
function clearHighlight(view) {
	if(view && view.dom) {
		view.dom.classList.remove("cm6-ctrl-held");
		view.dom.style.cursor = "";
	}
	_currentHighlight = null;
}

// ============================================================================
// Event Handlers
// ============================================================================

var ctrlHeld = false;
var lastMousePos = null;

/**
 * Get context info from view for getLinkAtPos
 */
function getContextFromView(view) {
	var engine = view._cm6Engine;
	if(!engine) return null;
	var pluginContext = engine._pluginContext;
	return {
		tiddlerTitle: pluginContext ? pluginContext.tiddlerTitle : null,
		engine: engine
	};
}

function handleKeyDown(event, view) {
	if(event.key === "Control" || event.key === "Meta") {
		ctrlHeld = true;

		// If we have a mouse position, check for link
		if(lastMousePos) {
			var pos;
			try {
				pos = view.posAtCoords(lastMousePos);
			} catch (e) {
				// posAtCoords can throw if view structure is inconsistent
				return;
			}
			if(pos !== null) {
				var context = getContextFromView(view);
				var link = getLinkAtPos(view.state, pos, context);
				if(link) {
					highlightLink(view, link.from, link.to);
				}
			}
		}
	}
}

function handleKeyUp(event, view) {
	if(event.key === "Control" || event.key === "Meta") {
		ctrlHeld = false;
		clearHighlight(view);
	}
}

function handleMouseMove(event, view) {
	lastMousePos = {
		x: event.clientX,
		y: event.clientY
	};

	if(!ctrlHeld) return;

	var pos;
	try {
		pos = view.posAtCoords(lastMousePos);
	} catch (e) {
		// posAtCoords can throw if view structure is inconsistent
		clearHighlight(view);
		return;
	}
	if(pos === null) {
		clearHighlight(view);
		return;
	}

	var context = getContextFromView(view);
	var link = getLinkAtPos(view.state, pos, context);
	if(link) {
		highlightLink(view, link.from, link.to);
		view.dom.style.cursor = "pointer";
	} else {
		clearHighlight(view);
	}
}

function handleMouseLeave(event, view) {
	lastMousePos = null;
	clearHighlight(view);
}

function handleClick(event, view) {
	// Check for Ctrl+Click (Cmd+Click on Mac)
	var ctrlKey = event.ctrlKey || event.metaKey;
	if(!ctrlKey) return false;

	var pos;
	try {
		pos = view.posAtCoords({
			x: event.clientX,
			y: event.clientY
		});
	} catch (e) {
		// posAtCoords can throw if view structure is inconsistent
		return false;
	}
	if(pos === null) return false;

	var context = getContextFromView(view);
	var link = getLinkAtPos(view.state, pos, context);
	if(!link) return false;

	// Prevent default click behavior
	event.preventDefault();

	// Handle external URLs - always open in new browser tab
	if(link.isExternal) {
		window.open(link.target, "_blank", "noopener,noreferrer");
		clearHighlight(view);
		return true;
	}

	// Handle local definitions - scroll to definition instead of navigating
	if(link.isLocal && link.definitionIndex !== undefined) {
		view.dispatch({
			selection: {
				anchor: link.definitionIndex
			},
			scrollIntoView: true
		});
		clearHighlight(view);
		return true;
	}

	// Get widget from engine
	var engine = view._cm6Engine;
	var widget = engine ? engine.widget : null;

	// Navigate based on link type
	if(event.shiftKey) {
		// Shift+Ctrl+Click opens in new window
		openInNewWindow(link.target);
	} else {
		navigateToTiddler(link.target, {
			widget: widget,
			fromTitle: engine && engine._pluginContext ? engine._pluginContext.tiddlerTitle : null
		});
	}

	// Clear highlight
	clearHighlight(view);

	return true;
}

function handleBlur(event, view) {
	ctrlHeld = false;
	clearHighlight(view);
}

/**
 * Handle mousedown to prevent multi-cursor insertion when Ctrl+clicking on links.
 * CodeMirror adds secondary cursors on mousedown with Ctrl held, so we need to
 * prevent default here if we're on a navigatable link.
 */
function handleMouseDown(event, view) {
	// Check for Ctrl+Click (Cmd+Click on Mac)
	var ctrlKey = event.ctrlKey || event.metaKey;
	if(!ctrlKey) return false;

	var pos;
	try {
		pos = view.posAtCoords({
			x: event.clientX,
			y: event.clientY
		});
	} catch (e) {
		// posAtCoords can throw if view structure is inconsistent
		return false;
	}
	if(pos === null) return false;

	var context = getContextFromView(view);
	var link = getLinkAtPos(view.state, pos, context);
	if(!link) return false;

	// We're on a navigatable link - prevent default to stop multi-cursor insertion
	// The actual navigation happens in the click handler
	event.preventDefault();
	return true;
}

// ============================================================================
// Plugin Definition
// ============================================================================

exports.plugin = {
	name: "click-navigate",
	description: "Ctrl+Click (Cmd+Click on Mac) to navigate to tiddler",
	priority: 450,

	// Only load for TiddlyWiki content when enabled
	condition: function(context) {
		var type = context.tiddlerType;
		if(context.options.clickNavigate === false) return false;
		// Check config tiddler
		var wiki = context.options && context.options.widget && context.options.widget.wiki;
		var enabled = wiki && wiki.getTiddlerText("$:/config/codemirror-6/click-navigate/enabled", "yes");
		if(enabled !== "yes") return false;
		return !type || type === "" || type === "text/vnd.tiddlywiki" || type === "text/x-tiddlywiki";
	},

	init: function(cm6Core) {
		this._core = cm6Core;
		// Store syntaxTree function for link detection
		if(cm6Core.language && cm6Core.language.syntaxTree) {
			_syntaxTree = cm6Core.language.syntaxTree;
		}
	},

	registerCompartments: function() {
		var core = this._core;
		var Compartment = core.state.Compartment;
		return {
			clickNavigate: new Compartment()
		};
	},

	// Lazily create and cache the click-navigate handlers
	_getOrCreateClickNavigateHandlers: function(context) {
		if(this._clickNavigateHandlers) return this._clickNavigateHandlers;

		var core = this._core;
		var EditorView = core.view.EditorView;

		this._clickNavigateHandlers = [
			EditorView.domEventHandlers({
				keydown: handleKeyDown,
				keyup: handleKeyUp,
				mousemove: handleMouseMove,
				mouseleave: handleMouseLeave,
				mousedown: handleMouseDown,
				click: handleClick,
				blur: handleBlur
			}),
			// Store engine reference on view for click handler
			EditorView.updateListener.of(function(update) {
				if(!update.view._cm6Engine && context.engine) {
					update.view._cm6Engine = context.engine;
				}
			})
		];

		return this._clickNavigateHandlers;
	},

	getExtensions: function(context) {
		var handlers = this._getOrCreateClickNavigateHandlers(context);
		if(!handlers || handlers.length === 0) return [];

		// Wrap in compartment if available
		var engine = context.engine;
		var compartments = engine && engine._compartments;
		if(compartments && compartments.clickNavigate) {
			return [compartments.clickNavigate.of(handlers)];
		}

		return handlers;
	},

	// Return raw content for compartment reconfiguration (without compartment.of wrapper)
	getCompartmentContent: function(context) {
		var handlers = this._getOrCreateClickNavigateHandlers(context);
		return handlers || [];
	},

	registerEvents: function(engine, context) {
		var self = this;

		return {
			settingsChanged: function(settings) {
				if(engine._destroyed) return;

				if(settings.clickNavigate !== undefined) {
					if(settings.clickNavigate) {
						var handlers = self._getOrCreateClickNavigateHandlers(context);
						if(handlers) {
							engine.reconfigure("clickNavigate", handlers);
						}
					} else {
						engine.reconfigure("clickNavigate", []);
						// Clear any highlight
						if(engine.view) {
							clearHighlight(engine.view);
						}
					}
				}
			}
		};
	},

	extendAPI: function(_engine, _context) {
		return {
			/**
			 * Navigate to tiddler at current cursor position
			 * For local definitions (same tiddler), scrolls to the definition instead
			 */
			navigateToLinkAtCursor: function() {
				if(this._destroyed) return false;

				var pos = this.view.state.selection.main.head;
				var context = {
					tiddlerTitle: this._pluginContext ? this._pluginContext.tiddlerTitle : null,
					engine: this
				};
				var link = getLinkAtPos(this.view.state, pos, context);
				if(!link) return false;

				// Handle local definitions - scroll to definition instead of navigating
				if(link.isLocal && link.definitionIndex !== undefined) {
					this.view.dispatch({
						selection: {
							anchor: link.definitionIndex
						},
						scrollIntoView: true
					});
					return true;
				}

				navigateToTiddler(link.target, {
					widget: this.widget,
					fromTitle: this._pluginContext ? this._pluginContext.tiddlerTitle : null
				});
				return true;
			},

			/**
			 * Get link information at cursor
			 */
			getLinkInfoAtCursor: function() {
				if(this._destroyed) return null;

				var pos = this.view.state.selection.main.head;
				var context = {
					tiddlerTitle: this._pluginContext ? this._pluginContext.tiddlerTitle : null,
					engine: this
				};
				return getLinkAtPos(this.view.state, pos, context);
			},

			/**
			 * Navigate to specific tiddler
			 */
			navigateToTiddler: function(title) {
				navigateToTiddler(title, {
					widget: this.widget,
					fromTitle: this._pluginContext ? this._pluginContext.tiddlerTitle : null
				});
			},

			/**
			 * Open tiddler in new window
			 */
			openTiddlerInNewWindow: function(title) {
				openInNewWindow(title);
			}
		};
	},

	destroy: function(_engine) {
		ctrlHeld = false;
		lastMousePos = null;
		_currentHighlight = null;
	}
};
