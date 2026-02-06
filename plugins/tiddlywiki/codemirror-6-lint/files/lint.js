/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lint.js
type: application/javascript
module-type: codemirror6-plugin

TiddlyWiki Lint Plugin - highlights potential issues in wikitext.

Checks for:
- Links to missing tiddlers
- Undefined macros/procedures/functions
- Unknown widgets
- Unclosed brackets and formatting
- Filter syntax issues
- Unclosed widgets and code blocks
- Pragma issues

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Load the bundled lint library
var lintLib = null;
try {
	lintLib = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lint/codemirror-lint.js");
} catch (_e) {
	// Lint library not available
}

var _syntaxTree = null;
var _linter = lintLib ? lintLib.linter : null;
var _lintGutter = lintLib ? lintLib.lintGutter : null;
var _lintKeymap = lintLib ? lintLib.lintKeymap : null;
var _forceLinting = lintLib ? lintLib.forceLinting : null;
var _Compartment = null;

// ============================================================================
// Configuration
// ============================================================================

/**
 * Check if a specific lint rule is enabled
 * @param {string} ruleName - The rule name
 * @param {object} wiki - The wiki object (defaults to $tw.wiki)
 */
function isRuleEnabled(ruleName, wiki) {
	wiki = wiki || $tw.wiki;
	if(!wiki) return true;
	var config = (wiki.getTiddlerText("$:/config/codemirror-6/lint/" + ruleName, "yes") || "").trim();
	return config === "yes";
}

/**
 * Check if CamelCase wikilinks are enabled
 * @param {object} wiki - The wiki object (defaults to $tw.wiki)
 */
function isCamelCaseEnabled(wiki) {
	wiki = wiki || $tw.wiki;
	if(!wiki) return true;
	var config = wiki.getTiddlerText("$:/config/WikiParserRules/Inline/wikilink", "enable");
	return config !== "disable";
}

// ============================================================================
// Built-in Variables (never flagged as undefined)
// ============================================================================

var builtInVariables = new Set([
	"currentTiddler",
	"storyTiddler",
	"transclusion",
]);

// ============================================================================
// Action Implicit Variables
// ============================================================================

/**
 * Map of widgets to the implicit variables they provide within their action attributes.
 * These variables are available in the scope of the action content and passed to
 * sub-macro-calls and sub-transclusions.
 *
 * Based on actual TiddlyWiki widget source code - see core/modules/widgets/*.js
 * Only includes widgets that actually pass variables to invokeActionString.
 */
var actionImplicitVariables = {
	// Drag and drop widgets (see droppable.js, draggable.js)
	"$droppable": ["actionTiddler", "actionTiddlerList", "modifier"],
	"$dropzone": ["actionTiddler", "actionTiddlerList", "modifier"],
	"$draggable": ["actionTiddler"],

	// Form widgets (see button.js, radio.js, range.js)
	// $button only provides modifier
	"$button": ["modifier"],
	// $checkbox does NOT pass any variables to invokeActionString
	// $radio passes actionValue
	"$radio": ["actionValue"],
	// $select does NOT pass any variables to invokeActionString
	// $range passes actionValue and actionValueHasChanged
	"$range": ["actionValue", "actionValueHasChanged"],

	// Event handling widgets (see linkcatcher.js, messagecatcher.js, eventcatcher.js, keyboard.js)
	"$linkcatcher": ["navigateTo", "modifier"],
	"$messagecatcher": ["modifier", "event-*", "event-paramObject-*", "list-event", "list-event-paramObject"],
	"$eventcatcher": [
		"dom-*", // All DOM attributes with dom- prefix (from collectDOMVariables)
		"modifier",
		"event-mousebutton",
		"event-type",
		"event-detail-*", // Properties in event.detail with event-detail- prefix
		"tv-popup-coords",
		"tv-popup-abs-coords",
		"tv-widgetnode-width",
		"tv-widgetnode-height",
		"tv-selectednode-posx",
		"tv-selectednode-posy",
		"tv-selectednode-width",
		"tv-selectednode-height",
		"event-fromselected-posx",
		"event-fromselected-posy",
		"event-fromcatcher-posx",
		"event-fromcatcher-posy",
		"event-fromviewport-posx",
		"event-fromviewport-posy"
	],
	"$keyboard": ["modifier", "event-key-descriptor"]
};

/**
 * Map of widgets to their action attribute names.
 * Only includes widgets that actually provide implicit variables.
 */
var actionAttributeNames = {
	"$droppable": ["actions"],
	"$dropzone": ["actions"],
	"$draggable": ["startactions", "endactions"],
	"$button": ["actions"],
	"$radio": ["actions"],
	"$range": ["actions", "actionsStart", "actionsStop"],
	"$linkcatcher": ["actions"],
	"$messagecatcher": ["actions"],
	"$eventcatcher": [
		// New $event syntax
		"$click", "$dblclick", "$contextmenu",
		"$mousedown", "$mouseup", "$mouseover", "$mouseout", "$mouseenter", "$mouseleave", "$mousemove",
		"$pointerdown", "$pointerup", "$pointermove", "$pointerover", "$pointerout", "$pointerenter", "$pointerleave", "$pointercancel",
		"$dragstart", "$dragend", "$dragenter", "$dragleave", "$dragover", "$drop", "$drag",
		"$focusin", "$focusout", "$focus", "$blur",
		"$keydown", "$keyup", "$keypress",
		"$input", "$change", "$submit",
		"$touchstart", "$touchend", "$touchmove", "$touchcancel",
		"$wheel", "$scroll",
		// Legacy actions-event syntax
		"actions-click", "actions-dblclick", "actions-contextmenu",
		"actions-mousedown", "actions-mouseup", "actions-mouseover", "actions-mouseout",
		"actions-focusin", "actions-focusout",
		"actions-keydown", "actions-keyup",
		"actions-input", "actions-change",
		"actions-dragstart", "actions-dragend", "actions-dragenter", "actions-dragleave", "actions-dragover", "actions-drop",
		"actions-pointerdown", "actions-pointerup", "actions-pointermove", "actions-pointerover", "actions-pointerout", "actions-pointerenter", "actions-pointerleave", "actions-pointercancel"
	],
	"$keyboard": ["actions"]
};

// ============================================================================
// Widget Tree Scope Variables
// ============================================================================

/**
 * Extract variables from the TiddlyWiki widget tree (runtime scope).
 * This allows the linter to recognize variables set by parent widgets
 * wrapping the editor, like <$let>, <$set>, <$vars>, etc.
 *
 * @param {object} widget - The TiddlyWiki widget containing the editor
 * @returns {Set<string>} Set of variable names from the widget scope
 */
function extractWidgetTreeVariables(widget) {
	var vars = new Set();
	if(!widget) return vars;

	var current = widget;
	while(current) {
		// Widgets store variables in the 'variables' property
		if(current.variables) {
			for(var varName in current.variables) {
				if(Object.prototype.hasOwnProperty.call(current.variables, varName)) {
					vars.add(varName);
				}
			}
		}
		current = current.parentWidget;
	}

	return vars;
}

// ============================================================================
// Self-Closing Tags
// ============================================================================

/**
 * HTML void elements that don't need closing tags
 */
var voidHTMLElements = new Set([
	"area", "base", "br", "col", "embed", "hr", "img", "input",
	"link", "meta", "param", "source", "track", "wbr"
]);

/**
 * TiddlyWiki widgets that are typically self-closing (action widgets, etc.)
 */
var selfClosingWidgets = new Set([
	"$action-confirm", "$action-createtiddler", "$action-deletefield",
	"$action-deletetiddler", "$action-listops", "$action-log",
	"$action-navigate", "$action-popup", "$action-sendmessage",
	"$action-setfield", "$action-setmultiplefields", "$importvariables"
]);

// ============================================================================
// Smart Tag Scanning for Auto-Close Detection
// ============================================================================

/**
 * Scan text to find if there's a matching closing tag at depth 0.
 * Skips protected contexts: code blocks, comments, quotes, macros, filters, etc.
 *
 * @param {string} text - Text to scan (should start after the opening tag)
 * @param {string} tagName - The tag name to look for
 * @param {boolean} caseSensitive - Whether to match case-sensitively (true for widgets)
 * @returns {boolean} True if there's a matching closing tag that would close this tag
 */
function hasMatchingClosingTag(text, tagName, caseSensitive) {
	var len = text.length;
	var pos = 0;
	var depth = 0;

	var tagMatches = function(name) {
		return caseSensitive ? name === tagName : name.toLowerCase() === tagName.toLowerCase();
	};

	while(pos < len) {
		var ch = text[pos];

		// Skip fenced code blocks ``` ... ```
		if(ch === '`' && text[pos + 1] === '`' && text[pos + 2] === '`') {
			pos += 3;
			while(pos < len && !(text[pos] === '`' && text[pos + 1] === '`' && text[pos + 2] === '`')) pos++;
			pos += 3;
			continue;
		}

		// Skip typed blocks $$$ ... $$$
		if(ch === '$' && text[pos + 1] === '$' && text[pos + 2] === '$') {
			pos += 3;
			while(pos < len && !(text[pos] === '$' && text[pos + 1] === '$' && text[pos + 2] === '$')) pos++;
			pos += 3;
			continue;
		}

		// Skip HTML comments <!-- ... -->
		if(ch === '<' && text[pos + 1] === '!' && text[pos + 2] === '-' && text[pos + 3] === '-') {
			pos += 4;
			while(pos < len && !(text[pos] === '-' && text[pos + 1] === '-' && text[pos + 2] === '>')) pos++;
			pos += 3;
			continue;
		}

		// Skip triple-quoted strings """ ... """
		if(ch === '"' && text[pos + 1] === '"' && text[pos + 2] === '"') {
			pos += 3;
			while(pos < len && !(text[pos] === '"' && text[pos + 1] === '"' && text[pos + 2] === '"')) pos++;
			pos += 3;
			continue;
		}

		// Skip macros <<...>>
		if(ch === '<' && text[pos + 1] === '<') {
			pos += 2;
			var macroDepth = 1;
			while(pos < len && macroDepth > 0) {
				if(text[pos] === '<' && text[pos + 1] === '<') {
					macroDepth++;
					pos += 2;
				} else if(text[pos] === '>' && text[pos + 1] === '>') {
					macroDepth--;
					pos += 2;
				} else pos++;
			}
			continue;
		}

		// Skip filtered transclusions {{{...}}}
		if(ch === '{' && text[pos + 1] === '{' && text[pos + 2] === '{') {
			pos += 3;
			while(pos < len && !(text[pos] === '}' && text[pos + 1] === '}' && text[pos + 2] === '}')) pos++;
			pos += 3;
			continue;
		}

		// Skip transclusions {{...}}
		if(ch === '{' && text[pos + 1] === '{') {
			pos += 2;
			while(pos < len && !(text[pos] === '}' && text[pos + 1] === '}')) pos++;
			pos += 2;
			continue;
		}

		// Skip substituted strings `...` (single backtick, not triple)
		if(ch === '`' && text[pos + 1] !== '`') {
			pos++;
			while(pos < len && text[pos] !== '`') pos++;
			pos++;
			continue;
		}

		// Check for closing tag </tagname>
		if(ch === '<' && text[pos + 1] === '/') {
			pos += 2;
			// Read tag name
			var closeName = "";
			while(pos < len && /[a-zA-Z0-9\-_$.]/.test(text[pos])) {
				closeName += text[pos];
				pos++;
			}
			// Skip whitespace
			while(pos < len && /\s/.test(text[pos])) pos++;
			// Check for >
			if(text[pos] === '>' && tagMatches(closeName)) {
				if(depth === 0) {
					// Found closing tag at depth 0 - belongs to our opening tag
					return true;
				}
				depth--;
			}
			pos++;
			continue;
		}

		// Check for opening tag <tagname
		if(ch === '<' && /[a-zA-Z$]/.test(text[pos + 1])) {
			pos++;
			// Read tag name
			var openName = "";
			while(pos < len && /[a-zA-Z0-9\-_$.]/.test(text[pos])) {
				openName += text[pos];
				pos++;
			}
			// Check if this matches our tag name
			if(tagMatches(openName)) {
				// Need to determine if this is a self-closing tag or opening tag
				var isSelfClosing = false;
				var foundEnd = false;
				while(pos < len && !foundEnd) {
					var sch = text[pos];
					// Skip triple-quoted strings
					if(sch === '"' && text[pos + 1] === '"' && text[pos + 2] === '"') {
						pos += 3;
						while(pos < len && !(text[pos] === '"' && text[pos + 1] === '"' && text[pos + 2] === '"')) pos++;
						pos += 3;
						continue;
					}
					// Skip quoted strings
					if(sch === '"' || sch === "'") {
						var quote = sch;
						pos++;
						while(pos < len && text[pos] !== quote) {
							if(text[pos] === '\\') pos++;
							pos++;
						}
						pos++;
						continue;
					}
					// Skip macros in attributes
					if(sch === '<' && text[pos + 1] === '<') {
						pos += 2;
						var md = 1;
						while(pos < len && md > 0) {
							if(text[pos] === '<' && text[pos + 1] === '<') {
								md++;
								pos += 2;
							} else if(text[pos] === '>' && text[pos + 1] === '>') {
								md--;
								pos += 2;
							} else pos++;
						}
						continue;
					}
					// Skip filtered transclusions in attributes
					if(sch === '{' && text[pos + 1] === '{' && text[pos + 2] === '{') {
						pos += 3;
						while(pos < len && !(text[pos] === '}' && text[pos + 1] === '}' && text[pos + 2] === '}')) pos++;
						pos += 3;
						continue;
					}
					// Skip transclusions in attributes
					if(sch === '{' && text[pos + 1] === '{') {
						pos += 2;
						while(pos < len && !(text[pos] === '}' && text[pos + 1] === '}')) pos++;
						pos += 2;
						continue;
					}
					// Skip backtick strings in attributes
					if(sch === '`') {
						if(text[pos + 1] === '`' && text[pos + 2] === '`') {
							pos += 3;
							while(pos < len && !(text[pos] === '`' && text[pos + 1] === '`' && text[pos + 2] === '`')) pos++;
							pos += 3;
						} else {
							pos++;
							while(pos < len && text[pos] !== '`') pos++;
							pos++;
						}
						continue;
					}
					// Found end of tag
					if(sch === '/' && text[pos + 1] === '>') {
						isSelfClosing = true;
						foundEnd = true;
						pos += 2;
					} else if(sch === '>') {
						foundEnd = true;
						pos++;
					} else {
						pos++;
					}
				}
				// Only count as opening tag if not self-closing
				if(foundEnd && !isSelfClosing) {
					depth++;
				}
			}
			continue;
		}

		pos++;
	}

	// No matching closing tag found at depth 0
	return false;
}

/**
 * Check if a tag is self-closing (void HTML element or action widget)
 * @param {string} tagName - The tag name (with $ prefix for widgets)
 * @param {boolean} isWidget - Whether this is a widget
 * @returns {boolean} True if the tag is self-closing
 */
function isSelfClosingTag(tagName, isWidget) {
	if(isWidget) {
		return selfClosingWidgets.has(tagName) || selfClosingWidgets.has("$" + tagName);
	} else {
		return voidHTMLElements.has(tagName.toLowerCase());
	}
}

/**
 * Check if a position in the document is inside an attribute value
 * (quoted strings, macros, filters, transclusions in tag attributes)
 * @param {object} tree - The syntax tree
 * @param {number} pos - Position to check
 * @returns {boolean} True if inside an attribute value
 */
function isInsideAttributeValue(tree, pos) {
	var node = tree.resolveInner(pos, 0);
	while(node && !node.type.isTop) {
		var name = node.type.name;
		// Check for various attribute value node types
		if(name === "AttributeValue" ||
			name === "AttributeString" ||
			name === "AttributeQuoted" ||
			name === "MacroAttributeValue" ||
			name === "FilteredTransclusionAttributeValue" ||
			name === "TransclusionAttributeValue" ||
			name === "SubstitutedAttributeValue") {
			return true;
		}
		// Also check if inside a code block or comment
		if(name === "FencedCode" ||
			name === "CodeBlock" ||
			name === "TypedBlock" ||
			name === "CommentBlock") {
			return true;
		}
		node = node.parent;
	}
	return false;
}

// ============================================================================
// Scope Detection for Variables
// ============================================================================

/**
 * Helper to extract an attribute value (handles both quoted and unquoted values)
 * Returns null for dynamic values (variables, transclusions, filtered transclusions, substitutions)
 * since those can't be statically determined
 * @param {string} attrs - Attribute string
 * @param {string} attrName - Attribute name to extract
 * @returns {string|null} The attribute value or null if not found/dynamic
 */
function extractAttrValue(attrs, attrName) {
	// Match quoted values: name="value" or name='value'
	var quotedRegex = new RegExp(attrName + '\\s*=\\s*["\']([^"\']+)["\']', 'i');
	var quotedMatch = quotedRegex.exec(attrs);
	if(quotedMatch) {
		var val = quotedMatch[1];
		// Check if it's a dynamic value inside quotes (shouldn't happen but be safe)
		if(/^<<|^\{\{|^\{\{\{|^`|^```/.test(val)) return null;
		return val;
	}

	// Match unquoted values: name=value (value is non-whitespace, non->)
	// This includes: plain values, <<variables>>, {{transclusions}}, {{{filters}}}, `substitutions`, ```substitutions```
	var unquotedRegex = new RegExp(attrName + '\\s*=\\s*([^\\s>"\']+)', 'i');
	var unquotedMatch = unquotedRegex.exec(attrs);
	if(unquotedMatch) {
		var val = unquotedMatch[1];
		// Dynamic values - can't statically determine the value
		if(/^<</.test(val)) return null; // <<variable>>
		if(/^\{\{\{/.test(val)) return null; // {{{filter}}}
		if(/^\{\{/.test(val)) return null; // {{transclusion}}
		if(/^```/.test(val)) return null; // ```substitution```
		if(/^`/.test(val)) return null; // `substitution`
		return val;
	}

	return null;
}

/**
 * Widget types that create variable scopes and how to extract their variables
 * (Legacy version using text extraction - kept for backwards compatibility)
 */
var scopeCreatingWidgets = {
	"$set": function(attrs) {
		// <$set name="varName" ...> or <$set name=varName ...>
		var value = extractAttrValue(attrs, 'name');
		return value ? [value] : [];
	},
	"$setvariable": function(attrs) {
		var value = extractAttrValue(attrs, 'name');
		return value ? [value] : [];
	},
	"$qualify": function(attrs) {
		var value = extractAttrValue(attrs, 'name');
		return value ? [value] : [];
	},
	"$let": function(attrs) {
		// <$let var1="val" var2="val"> - all attributes are variables
		var vars = [];
		var attrRegex = /([a-zA-Z_][\w-]*)\s*=/g;
		var match;
		while((match = attrRegex.exec(attrs)) !== null) {
			vars.push(match[1]);
		}
		return vars;
	},
	"$vars": function(attrs) {
		// <$vars var1="val" var2="val"> - all attributes are variables
		var vars = [];
		var attrRegex = /([a-zA-Z_][\w-]*)\s*=/g;
		var match;
		while((match = attrRegex.exec(attrs)) !== null) {
			vars.push(match[1]);
		}
		return vars;
	},
	"$parameters": function(attrs) {
		// <$parameters param1="default" param2> - all attributes are variables
		// Handles both name=value and bare attribute names
		var vars = [];
		// Match attribute names: either name= or bare names not inside quotes
		// First, extract all name=value pairs
		var assignedRegex = /([a-zA-Z_][\w-]*)\s*=/g;
		var match;
		var assignedNames = new Set();
		while((match = assignedRegex.exec(attrs)) !== null) {
			vars.push(match[1]);
			assignedNames.add(match[1]);
		}
		// Then, find bare attribute names (words not followed by =)
		// Remove quoted strings first to avoid matching names inside quotes
		var withoutQuotes = attrs.replace(/"[^"]*"|'[^']*'|\[\[[^\]]*\]\]/g, '');
		var bareRegex = /\b([a-zA-Z_][\w-]*)\b(?!\s*=)/g;
		while((match = bareRegex.exec(withoutQuotes)) !== null) {
			// Only add if not already in assigned names
			if(!assignedNames.has(match[1])) {
				vars.push(match[1]);
			}
		}
		return vars;
	},
	"$list": function(attrs) {
		// <$list variable="item" counter="idx"> - variable and counter attributes
		var vars = [];
		var varValue = extractAttrValue(attrs, 'variable');
		var counterValue = extractAttrValue(attrs, 'counter');
		if(varValue) vars.push(varValue);
		if(counterValue) vars.push(counterValue);
		return vars;
	},
	"$range": function(attrs) {
		// <$range variable="i"> - variable attribute
		var value = extractAttrValue(attrs, 'variable');
		return value ? [value] : [];
	},
	"$wikify": function(attrs) {
		// <$wikify name="html"> - name attribute
		var value = extractAttrValue(attrs, 'name');
		return value ? [value] : [];
	},
	"$keyboard": function(attrs) {
		// <$keyboard> implicitly defines these variables within its scope
		return ["event-key", "event-code", "event-key-descriptor", "modifier"];
	},
	"$eventcatcher": function(attrs) {
		// <$eventcatcher> implicitly defines these variables within its scope
		// Also defines dom-* and event-detail-* dynamic prefixes
		return {
			vars: [
				"modifier",
				"event-mousebutton",
				"event-type",
				"tv-popup-coords",
				"tv-popup-abs-coords",
				"tv-widgetnode-width",
				"tv-widgetnode-height",
				"tv-selectednode-posx",
				"tv-selectednode-posy",
				"tv-selectednode-width",
				"tv-selectednode-height",
				"event-fromselected-posx",
				"event-fromselected-posy",
				"event-fromcatcher-posx",
				"event-fromcatcher-posy",
				"event-fromviewport-posx",
				"event-fromviewport-posy"
			],
			prefixes: ["dom-", "event-detail-"]
		};
	},
	"$messagecatcher": function(attrs) {
		// <$messagecatcher> implicitly defines these variables within its action strings
		// event-* properties from the event object, event-paramObject-* from event.paramObject
		return {
			vars: ["list-event", "list-event-paramObject", "modifier"],
			prefixes: ["event-", "event-paramObject-"]
		};
	}
};

/**
 * Widget types that create variable scopes - syntax tree based version
 * attrMap is { attrName (lowercase): value (or null if dynamic) }
 */
var scopeCreatingWidgetsFromAttrMap = {
	"$set": function(attrMap) {
		var value = attrMap['name'];
		return value ? [value] : [];
	},
	"$setvariable": function(attrMap) {
		var value = attrMap['name'];
		return value ? [value] : [];
	},
	"$qualify": function(attrMap) {
		var value = attrMap['name'];
		return value ? [value] : [];
	},
	"$let": function(attrMap, attrOriginalNames) {
		// All attributes are variable names - use original names to preserve case
		return attrOriginalNames ? attrOriginalNames.slice() : [];
	},
	"$vars": function(attrMap, attrOriginalNames) {
		// All attributes are variable names - use original names to preserve case
		return attrOriginalNames ? attrOriginalNames.slice() : [];
	},
	"$parameters": function(attrMap, attrOriginalNames) {
		// All attributes are parameter names (which become variables) - use original names to preserve case
		return attrOriginalNames ? attrOriginalNames.slice() : [];
	},
	"$list": function(attrMap) {
		var vars = [];
		if(attrMap['variable']) vars.push(attrMap['variable']);
		if(attrMap['counter']) vars.push(attrMap['counter']);
		return vars;
	},
	"$range": function(attrMap) {
		var value = attrMap['variable'];
		return value ? [value] : [];
	},
	"$wikify": function(attrMap) {
		var value = attrMap['name'];
		return value ? [value] : [];
	},
	"$keyboard": function(attrMap) {
		return ["event-key", "event-code", "event-key-descriptor", "modifier"];
	},
	"$eventcatcher": function(attrMap) {
		return {
			vars: [
				"modifier",
				"event-mousebutton",
				"event-type",
				"tv-popup-coords",
				"tv-popup-abs-coords",
				"tv-widgetnode-width",
				"tv-widgetnode-height",
				"tv-selectednode-posx",
				"tv-selectednode-posy",
				"tv-selectednode-width",
				"tv-selectednode-height",
				"event-fromselected-posx",
				"event-fromselected-posy",
				"event-fromcatcher-posx",
				"event-fromcatcher-posy",
				"event-fromviewport-posx",
				"event-fromviewport-posy"
			],
			prefixes: ["dom-", "event-detail-"]
		};
	},
	"$messagecatcher": function(attrMap) {
		return {
			vars: ["list-event", "list-event-paramObject", "modifier"],
			prefixes: ["event-", "event-paramObject-"]
		};
	}
};

/**
 * Extract attribute value from a single Attribute syntax node
 * @param {TreeCursor} attrCursor - Cursor positioned at an Attribute node
 * @param {string} docText - Full document text
 * @returns {{name: string, value: string|null}} Attribute name and value (null if dynamic)
 */
function extractSingleAttrValue(attrCursor, docText) {
	var name = null;
	var value = null;

	// Save cursor position
	var attrNode = attrCursor.node;
	var innerCursor = attrNode.cursor();

	if(!innerCursor.firstChild()) {
		return {
			name: null,
			value: null
		};
	}

	do {
		if(innerCursor.name === "AttributeName") {
			name = docText.slice(innerCursor.from, innerCursor.to);
		} else if(innerCursor.name === "AttributeString" ||
			innerCursor.name === "AttributeValue") {
			// Simple string value - extract text, removing quotes if present
			var rawValue = docText.slice(innerCursor.from, innerCursor.to);
			// Remove surrounding quotes
			if((rawValue.startsWith('"') && rawValue.endsWith('"')) ||
				(rawValue.startsWith("'") && rawValue.endsWith("'"))) {
				value = rawValue.slice(1, -1);
			} else {
				value = rawValue;
			}
		} else if(innerCursor.name === "AttributeIndirect" ||
			innerCursor.name === "AttributeFiltered" ||
			innerCursor.name === "AttributeSubstituted" ||
			innerCursor.name === "AttributeVariable") {
			// Dynamic value - can't statically determine
			value = null;
		}
	} while(innerCursor.nextSibling());

	return {
		name: name,
		value: value
	};
}

/**
 * Extract variables defined by a widget node
 * @param {SyntaxNode} widgetNode - Widget or InlineWidget node
 * @param {string} docText - Full document text
 * @returns {{vars: string[], prefixes: string[]}} Object with variable names and prefixes
 */
function extractWidgetScopeVariables(widgetNode, docText) {
	// Find WidgetName and collect attributes from syntax tree
	var cursor = widgetNode.cursor();
	var widgetName = null;
	var attrMap = {}; // Map of attribute name (lowercase) -> value (for attribute lookup)
	var attrOriginalNames = []; // Original attribute names with preserved case (for $let/$vars/$parameters)

	if(!cursor.firstChild()) {
		return {
			vars: [],
			prefixes: []
		};
	}

	do {
		if(cursor.name === "WidgetName") {
			widgetName = docText.slice(cursor.from, cursor.to);
		} else if(cursor.name === "Attribute") {
			// Extract attribute name and value from syntax tree
			var attr = extractSingleAttrValue(cursor, docText);
			if(attr.name) {
				// Store lowercase for widgets that look up specific attribute names (like 'name', 'variable')
				attrMap[attr.name.toLowerCase()] = attr.value;
				// Keep original names for $let/$vars/$parameters which use attr names as variable names
				attrOriginalNames.push(attr.name);
			}
		}
	} while(cursor.nextSibling());

	if(!widgetName) {
		return {
			vars: [],
			prefixes: []
		};
	}

	// Get extractor for this widget type
	var extractor = scopeCreatingWidgetsFromAttrMap[widgetName.toLowerCase()];
	if(!extractor) {
		return {
			vars: [],
			prefixes: []
		};
	}

	var result = extractor(attrMap, attrOriginalNames);

	// Normalize: if result is an array, convert to {vars, prefixes} format
	if(Array.isArray(result)) {
		return {
			vars: result,
			prefixes: []
		};
	}
	// Already in {vars, prefixes} format
	return result;
}

/**
 * Extract variables defined by a pragma definition node
 * @param {SyntaxNode} pragmaNode - Pragma definition node
 * @param {string} docText - Full document text
 * @returns {string[]} Array of parameter names defined by this pragma
 */
function extractPragmaScopeVariables(pragmaNode, docText) {
	var pragmaText = docText.slice(pragmaNode.from, pragmaNode.to);
	var vars = [];

	// Match \define/\procedure/\function/\widget name(params)
	var match = /\\(?:define|procedure|function|widget)\s+[^\s(]+\s*\(([^)]*)\)/.exec(pragmaText);
	if(match && match[1]) {
		var paramsStr = match[1];
		var paramMatches = paramsStr.matchAll(/([a-zA-Z][a-zA-Z0-9_-]*)/g);
		for(var paramMatch of paramMatches) {
			vars.push(paramMatch[1]);
		}
	}

	// Match \parameters pragma
	var paramsMatch = /\\parameters\s*\(([^)]*)\)/.exec(pragmaText);
	if(paramsMatch && paramsMatch[1]) {
		var paramsStr = paramsMatch[1];
		var paramMatches = paramsStr.matchAll(/([a-zA-Z][a-zA-Z0-9_-]*)/g);
		for(var paramMatch of paramMatches) {
			vars.push(paramMatch[1]);
		}
	}

	return vars;
}

/**
 * Get all variables in scope at a given node position
 * Walks up the tree to find scope-creating ancestors
 * @param {SyntaxNode} node - The node to check scope for
 * @param {string} docText - Full document text
 * @returns {{vars: Set<string>, prefixes: string[]}} Object with variable names and prefixes in scope
 */
/**
 * Check if a node position is inside an inline conditional block.
 * For inline parsing, <%if%> and <%endif%> are sibling Conditional nodes.
 * This checks if the node is positioned between a <%if%> and matching <%endif%>.
 * @param {SyntaxNode} node - The node to check
 * @param {string} docText - Full document text
 * @returns {boolean} True if inside an inline conditional
 */
function isInsideInlineConditional(node, docText) {
	var nodePos = node.from;
	var parent = node.parent;
	if(!parent) return false;

	// Collect all Conditional siblings
	var conditionals = [];
	var cursor = parent.cursor();
	if(cursor.firstChild()) {
		do {
			if(cursor.name === "Conditional") {
				var text = docText.slice(cursor.from, cursor.to);
				var type = null;
				if(/<%\s*if\b/.test(text)) type = "if";
				else if(/<%\s*endif\s*%>/.test(text)) type = "endif";
				if(type) {
					conditionals.push({
						type: type,
						from: cursor.from,
						to: cursor.to
					});
				}
			}
		} while(cursor.nextSibling());
	}

	// Sort by position
	conditionals.sort(function(a, b) {
		return a.from - b.from;
	});

	// Check if nodePos is between an <%if%> and matching <%endif%>
	var depth = 0;
	var lastIfStart = -1;
	for(var i = 0; i < conditionals.length; i++) {
		var cond = conditionals[i];
		if(cond.type === "if") {
			if(depth === 0) lastIfStart = cond.to;
			depth++;
		} else if(cond.type === "endif") {
			depth--;
			if(depth === 0 && lastIfStart !== -1) {
				// Check if nodePos is between this <%if%> and <%endif%>
				if(nodePos > lastIfStart && nodePos < cond.from) {
					return true;
				}
				lastIfStart = -1;
			}
		}
	}

	// Also check if we're after an unmatched <%if%> (still typing)
	if(depth > 0 && lastIfStart !== -1 && nodePos > lastIfStart) {
		return true;
	}

	return false;
}

function getVariablesInScope(node, docText) {
	var scopeVars = new Set();
	var scopePrefixes = [];

	// Walk up the tree to find scope-creating ancestors
	var current = node;
	while(current) {
		var typeName = current.type.name;

		// Check for Widget or InlineWidget
		if(typeName === "Widget" || typeName === "InlineWidget") {
			var extracted = extractWidgetScopeVariables(current, docText);
			extracted.vars.forEach(function(v) {
				scopeVars.add(v);
			});
			extracted.prefixes.forEach(function(p) {
				if(scopePrefixes.indexOf(p) === -1) scopePrefixes.push(p);
			});
		}

		// Check for Attribute nodes - if it's an action attribute, add action implicit variables
		if(typeName === "Attribute") {
			var actionVars = extractActionScopeVariables(current, docText);
			actionVars.forEach(function(v) {
				scopeVars.add(v);
			});
		}

		// Check for pragma definitions (parameters are in scope within the body)
		if(typeName === "MacroDefinition" || typeName === "ProcedureDefinition" ||
			typeName === "FunctionDefinition" || typeName === "WidgetDefinition") {
			var vars = extractPragmaScopeVariables(current, docText);
			vars.forEach(function(v) {
				scopeVars.add(v);
			});
		}

		// Check for ParametersPragma
		if(typeName === "ParametersPragma") {
			var vars = extractPragmaScopeVariables(current, docText);
			vars.forEach(function(v) {
				scopeVars.add(v);
			});
		}

		// Check for ConditionalBlock (<%if%> provides "condition" variable)
		if(typeName === "ConditionalBlock") {
			scopeVars.add("condition");
		}

		// Check for inline conditional siblings (Conditional nodes are siblings, not parents)
		if(isInsideInlineConditional(current, docText)) {
			scopeVars.add("condition");
		}

		current = current.parent;
	}

	return {
		vars: scopeVars,
		prefixes: scopePrefixes
	};
}

/**
 * Extract action implicit variables when inside an action attribute of a widget.
 * Walks up the tree to find ALL enclosing action attributes and accumulates their variables,
 * because in TiddlyWiki action variables from outer widgets are inherited by nested widgets.
 * @param {SyntaxNode} node - Starting node to walk up from
 * @param {string} docText - Full document text
 * @returns {string[]} Array of action implicit variables available in this context
 */
function extractActionScopeVariables(node, docText) {
	var vars = [];
	var seenVars = {};

	// Walk up looking for Attribute nodes - accumulate ALL action contexts
	var current = node;
	while(current) {
		if(current.type.name === "Attribute") {
			// Get the attribute name
			var attrName = null;
			var cursor = current.cursor();
			cursor.firstChild();
			do {
				if(cursor.name === "AttributeName") {
					attrName = docText.slice(cursor.from, cursor.to);
					break;
				}
			} while(cursor.nextSibling());

			if(attrName) {
				// Find the parent widget
				var parent = current.parent;
				while(parent) {
					if(parent.type.name === "Widget" || parent.type.name === "InlineWidget") {
						// Get widget name
						var widgetName = null;
						var widgetCursor = parent.cursor();
						widgetCursor.firstChild();
						do {
							if(widgetCursor.name === "WidgetName") {
								widgetName = docText.slice(widgetCursor.from, widgetCursor.to);
								break;
							}
						} while(widgetCursor.nextSibling());

						if(widgetName) {
							// Check if this attribute is an action attribute for this widget
							var actionAttrs = actionAttributeNames[widgetName.toLowerCase()] || actionAttributeNames[widgetName];
							if(actionAttrs && actionAttrs.indexOf(attrName) !== -1) {
								// Get the implicit variables for this widget
								var implicitVars = actionImplicitVariables[widgetName.toLowerCase()] || actionImplicitVariables[widgetName];
								if(implicitVars) {
									for(var i = 0; i < implicitVars.length; i++) {
										var v = implicitVars[i];
										if(!seenVars[v]) {
											seenVars[v] = true;
											vars.push(v);
										}
									}
								}
							}
						}
						break;
					}
					parent = parent.parent;
				}
			}
		}
		current = current.parent;
	}

	return vars;
}

/**
 * Check if a variable name is in scope (exact match or prefix match)
 * @param {string} varName - The variable name to check
 * @param {{vars: Set<string>, prefixes: string[]}} scope - Scope object from getVariablesInScope
 * @returns {boolean} True if variable is in scope
 */
function isVarInScope(varName, scope) {
	// Check exact match first
	if(scope.vars.has(varName)) return true;

	// Check prefix matches
	for(var i = 0; i < scope.prefixes.length; i++) {
		if(varName.indexOf(scope.prefixes[i]) === 0) {
			return true;
		}
	}

	return false;
}

// ============================================================================
// Call-Site Analysis for Dynamic Scope Resolution
// ============================================================================

/**
 * Find which definition (if any) contains a given node
 * @param {SyntaxNode} node - The node to check
 * @returns {string|null} The definition name, or null if at top level
 */
function getContainingDefinition(node) {
	var current = node.parent;
	while(current) {
		var typeName = current.type.name;
		if(typeName === "MacroDefinition" || typeName === "ProcedureDefinition" ||
			typeName === "FunctionDefinition" || typeName === "WidgetDefinition") {
			// Extract the definition name from the pragma text
			var cursor = current.cursor();
			if(cursor.firstChild()) {
				do {
					if(cursor.name === "PragmaName") {
						// The definition name follows the pragma keyword
						// Look for next sibling which should be the name
						if(cursor.nextSibling() && cursor.name !== "PragmaEnd") {
							return cursor.node.parent ? null : null; // Skip, name is elsewhere
						}
					}
				} while(cursor.nextSibling());
			}
			// Fallback: extract from text using regex
			return null; // Will be handled by extractDefinitionName
		}
		current = current.parent;
	}
	return null;
}

/**
 * Extract definition name from a definition node
 * @param {SyntaxNode} defNode - MacroDefinition/ProcedureDefinition/etc node
 * @param {string} docText - Full document text
 * @returns {string|null} The definition name
 */
function extractDefinitionName(defNode, docText) {
	var text = docText.slice(defNode.from, Math.min(defNode.from + 200, defNode.to));
	var match = /\\(?:define|procedure|function|widget)\s+([^\s(]+)/.exec(text);
	return match ? match[1] : null;
}

/**
 * Build call graph and scope information for the document
 * @param {Tree} tree - Syntax tree
 * @param {string} docText - Full document text
 * @returns {object} Call analysis data
 */
function buildCallSiteAnalysis(tree, docText) {
	// Map: definition name -> { from, to } (node boundaries)
	var definitions = {};
	// Map: definition name -> array of { callerDef: string|null, scopeVars: Set<string> }
	var callSites = {};
	// Track which definition each position is inside
	var positionToDefinition = [];

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

	// Helper to find which definition contains a position (innermost for nested definitions)
	function getDefinitionAtPosition(pos) {
		var bestMatch = null;
		var bestSize = Infinity;
		for(var name in definitions) {
			var def = definitions[name];
			if(pos >= def.from && pos <= def.to) {
				// For nested definitions, return the innermost (smallest range)
				var size = def.to - def.from;
				if(size < bestSize) {
					bestMatch = name;
					bestSize = size;
				}
			}
		}
		return bestMatch;
	}

	// Second pass: collect all call sites with their scope context
	tree.iterate({
		enter: function(node) {
			if(node.type.name === "MacroName") {
				var calledName = docText.slice(node.from, node.to).trim();
				// Only track calls to known local definitions
				if(callSites[calledName] !== undefined) {
					var callerDef = getDefinitionAtPosition(node.from);
					var scopeVars = getVariablesInScope(node.node, docText);
					callSites[calledName].push({
						callerDef: callerDef,
						scopeVars: scopeVars,
						pos: node.from
					});
				}
			}
			// Also detect <$macrocall $name="..."> and <$transclude $variable="..."> calls
			else if(node.type.name === "WidgetName") {
				var widgetName = docText.slice(node.from, node.to).toLowerCase();
				if(widgetName === "$macrocall" || widgetName === "$transclude") {
					// Find the $name or $variable attribute by looking at sibling Attribute nodes
					var cursor = node.node.parent ? node.node.parent.cursor() : null;
					if(cursor) {
						cursor.firstChild();
						var firstAttrStart = -1;
						var lastAttrEnd = -1;
						do {
							if(cursor.name === "Attribute") {
								if(firstAttrStart === -1) firstAttrStart = cursor.from;
								lastAttrEnd = cursor.to;
							}
						} while(cursor.nextSibling());

						if(firstAttrStart !== -1) {
							var attrs = docText.slice(firstAttrStart, lastAttrEnd);
							// Check $name for $macrocall, $variable for $transclude
							var calledName = widgetName === "$macrocall" ?
								extractAttrValue(attrs, "\\$name") :
								extractAttrValue(attrs, "\\$variable");
							if(calledName && callSites[calledName] !== undefined) {
								var callerDef = getDefinitionAtPosition(node.from);
								var scopeVars = getVariablesInScope(node.node, docText);
								callSites[calledName].push({
									callerDef: callerDef,
									scopeVars: scopeVars,
									pos: node.from
								});
							}
						}
					}
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
 * Get all variables that could be in scope for a definition through its call chain
 * Handles recursive/transitive calls
 * @param {string} defName - The definition name to check
 * @param {object} callAnalysis - Result from buildCallSiteAnalysis
 * @param {Set<string>} visited - Already visited definitions (for cycle detection)
 * @returns {{vars: Set<string>, prefixes: string[]}} All variables and prefixes potentially in scope
 */
function getCallSiteReachableScope(defName, callAnalysis, visited) {
	if(!visited) visited = new Set();
	if(visited.has(defName)) return {
		vars: new Set(),
		prefixes: []
	}; // Cycle detection
	visited.add(defName);

	var reachableVars = new Set();
	var reachablePrefixes = [];
	var sites = callAnalysis.callSites[defName];

	if(!sites || sites.length === 0) {
		return {
			vars: reachableVars,
			prefixes: reachablePrefixes
		};
	}

	for(var i = 0; i < sites.length; i++) {
		var site = sites[i];
		// Add direct scope variables at this call site
		// site.scopeVars is now {vars: Set, prefixes: []}
		site.scopeVars.vars.forEach(function(v) {
			reachableVars.add(v);
		});
		site.scopeVars.prefixes.forEach(function(p) {
			if(reachablePrefixes.indexOf(p) === -1) reachablePrefixes.push(p);
		});

		// If called from within another definition, recursively get that definition's reachable scope
		if(site.callerDef) {
			var callerScope = getCallSiteReachableScope(site.callerDef, callAnalysis, new Set(visited));
			callerScope.vars.forEach(function(v) {
				reachableVars.add(v);
			});
			callerScope.prefixes.forEach(function(p) {
				if(reachablePrefixes.indexOf(p) === -1) reachablePrefixes.push(p);
			});
		}
	}

	return {
		vars: reachableVars,
		prefixes: reachablePrefixes
	};
}

// ============================================================================
// Tiddler Existence Checking
// ============================================================================

/**
 * Check if a tiddler exists (including shadows)
 * @param {string} title - The tiddler title
 * @param {object} wiki - The wiki object (defaults to $tw.wiki)
 */
function tiddlerExists(title, wiki) {
	wiki = wiki || $tw.wiki;
	if(!wiki) return true;
	return wiki.tiddlerExists(title) || wiki.isShadowTiddler(title);
}

// ============================================================================
// Macro/Procedure/Function Checking
// ============================================================================

var _knownDefinitions = null;
var _definitionsCacheTime = 0;
var CACHE_DURATION = 5000; // 5 seconds

/**
 * Get all known macro/procedure/function/widget definitions
 */
function getKnownDefinitions() {
	var now = Date.now();
	if(_knownDefinitions && (now - _definitionsCacheTime) < CACHE_DURATION) {
		// Only use cache if it has some widgets (meaning TW was initialized)
		if(_knownDefinitions.widgets.size > 0) {
			return _knownDefinitions;
		}
	}

	var definitions = {
		macros: new Set(),
		procedures: new Set(),
		functions: new Set(),
		widgets: new Set()
	};

	if(!$tw) return definitions;

	// Built-in JavaScript macros
	if($tw.macros) {
		Object.keys($tw.macros).forEach(function(name) {
			definitions.macros.add(name);
		});
	}

	// Core widgets from $tw.widgets
	if($tw.widgets) {
		Object.keys($tw.widgets).forEach(function(name) {
			// Widgets in $tw.widgets are stored without the $ prefix
			definitions.widgets.add("$" + name);
		});
	}

	// Also check widget modules using TiddlyWiki's module API
	if($tw.modules && $tw.modules.forEachModuleOfType) {
		$tw.modules.forEachModuleOfType("widget", function(title, moduleExports) {
			if(moduleExports) {
				Object.keys(moduleExports).forEach(function(exportName) {
					if(exportName && typeof exportName === "string") {
						// Widgets are exported without $ prefix, add it
						definitions.widgets.add("$" + exportName);
					}
				});
			}
		});
		// Also check widget-subclass modules (e.g., $log is a subclass of $action-log)
		$tw.modules.forEachModuleOfType("widget-subclass", function(title, moduleExports) {
			if(moduleExports) {
				// Widget-subclass modules export: name (widget name), baseClass (parent widget)
				var widgetName = moduleExports.name || moduleExports.baseClass;
				if(widgetName && typeof widgetName === "string") {
					definitions.widgets.add("$" + widgetName);
				}
			}
		});
	}

	// Scan tiddlers for definitions
	if($tw.wiki) {
		var tiddlers = $tw.wiki.filterTiddlers("[all[tiddlers+shadows]has[text]]");
		tiddlers.forEach(function(title) {
			var tiddler = $tw.wiki.getTiddler(title);
			if(!tiddler) {
				// Try shadow
				if($tw.wiki.isShadowTiddler(title)) {
					var pluginTitle = $tw.wiki.getShadowSource(title);
					if(pluginTitle) {
						var pluginInfo = $tw.wiki.getPluginInfo(pluginTitle);
						if(pluginInfo && pluginInfo.tiddlers && pluginInfo.tiddlers[title]) {
							tiddler = new $tw.Tiddler(pluginInfo.tiddlers[title]);
						}
					}
				}
			}
			if(!tiddler || !tiddler.fields.text) return;

			var text = tiddler.fields.text;

			// Match \define
			var defineMatches = text.matchAll(/\\define\s+([^\s(]+)/g);
			for(var match of defineMatches) {
				definitions.macros.add(match[1]);
			}

			// Match \procedure
			var procMatches = text.matchAll(/\\procedure\s+([^\s(]+)/g);
			for(var match of procMatches) {
				definitions.procedures.add(match[1]);
			}

			// Match \function
			var funcMatches = text.matchAll(/\\function\s+([^\s(]+)/g);
			for(var match of funcMatches) {
				definitions.functions.add(match[1]);
			}

			// Match \widget
			var widgetMatches = text.matchAll(/\\widget\s+([^\s(]+)/g);
			for(var match of widgetMatches) {
				definitions.widgets.add(match[1]);
			}
		});
	}

	_knownDefinitions = definitions;
	_definitionsCacheTime = now;
	return definitions;
}

/**
 * Check if a macro/procedure/function is defined
 */
function isDefinitionKnown(name, type) {
	var defs = getKnownDefinitions();

	// Check all types since <<name>> can call any of them
	if(type === "macro" || type === "any") {
		if(defs.macros.has(name) || defs.procedures.has(name) || defs.functions.has(name)) {
			return true;
		}
	}

	if(type === "widget") {
		// Normalize widget name and check both with and without $ prefix
		var withDollar = name.startsWith("$") ? name : "$" + name;
		var withoutDollar = name.startsWith("$") ? name.substring(1) : name;
		return defs.widgets.has(name) || defs.widgets.has(withDollar) || defs.widgets.has(withoutDollar);
	}

	return false;
}

// ============================================================================
// Extract Local Definitions from Current Document
// ============================================================================

/**
 * Extract definitions from document text (simple version for quick lookups)
 */
function extractLocalDefinitions(text) {
	var definitions = {
		macros: new Set(),
		procedures: new Set(),
		functions: new Set(),
		widgets: new Set(),
		variables: new Set() // Variables defined with <$set>, <$let>, <$vars>
	};

	// Match \define (supports indented pragmas)
	var defineMatches = text.matchAll(/\\define\s+([^\s(]+)/g);
	for(var match of defineMatches) {
		definitions.macros.add(match[1].trim());
	}

	// Match \procedure (supports indented pragmas)
	var procMatches = text.matchAll(/\\procedure\s+([^\s(]+)/g);
	for(var match of procMatches) {
		definitions.procedures.add(match[1].trim());
	}

	// Match \function (supports indented pragmas)
	var funcMatches = text.matchAll(/\\function\s+([^\s(]+)/g);
	for(var match of funcMatches) {
		definitions.functions.add(match[1].trim());
	}

	// Match \widget (supports indented pragmas)
	var widgetMatches = text.matchAll(/\\widget\s+([^\s(]+)/g);
	for(var match of widgetMatches) {
		definitions.widgets.add(match[1].trim());
	}

	// Match <$set name="varName">, <$setvariable name="varName">, <$qualify name="varName"> - extract name attribute
	var setMatches = text.matchAll(/<\$(?:set|setvariable|qualify)\s+[^>]*name\s*=\s*["']([^"']+)["']/gi);
	for(var match of setMatches) {
		if(match[1]) definitions.variables.add(match[1]);
	}

	// Match <$let varName="value"> - all attributes are variables
	var letMatches = text.matchAll(/<\$let\s+([^>]+)>/gi);
	for(var match of letMatches) {
		var attrs = match[1];
		var attrMatches = attrs.matchAll(/([a-zA-Z_][\w-]*)\s*=/g);
		for(var attrMatch of attrMatches) {
			definitions.variables.add(attrMatch[1]);
		}
	}

	// Match <$vars varName="value"> - all attributes are variables
	var varsMatches = text.matchAll(/<\$vars\s+([^>]+)>/gi);
	for(var match of varsMatches) {
		var attrs = match[1];
		var attrMatches = attrs.matchAll(/([a-zA-Z_][\w-]*)\s*=/g);
		for(var attrMatch of attrMatches) {
			definitions.variables.add(attrMatch[1]);
		}
	}

	// Match <$list variable="item" counter="idx"> - extract variable and counter
	var listMatches = text.matchAll(/<\$list\s+[^>]*(?:variable|counter)\s*=\s*["']([^"']+)["']/gi);
	for(var match of listMatches) {
		if(match[1]) definitions.variables.add(match[1]);
	}

	// Match <$range variable="i"> - extract variable attribute
	var rangeMatches = text.matchAll(/<\$range\s+[^>]*variable\s*=\s*["']([^"']+)["']/gi);
	for(var match of rangeMatches) {
		if(match[1]) definitions.variables.add(match[1]);
	}

	// Match <$wikify name="html"> - extract name attribute
	var wikifyMatches = text.matchAll(/<\$wikify\s+[^>]*name\s*=\s*["']([^"']+)["']/gi);
	for(var match of wikifyMatches) {
		if(match[1]) definitions.variables.add(match[1]);
	}

	// Match <$parameters> which defines parameter variables
	var paramWidgetMatches = text.matchAll(/<\$parameters\s+([^>\/]+)/gi);
	for(var match of paramWidgetMatches) {
		var attrs = match[1];
		var attrMatches = attrs.matchAll(/([a-zA-Z_][\w-]*)\s*=/g);
		for(var attrMatch of attrMatches) {
			definitions.variables.add(attrMatch[1]);
		}
	}

	// Match \parameters(param1:"default" param2) pragma - extracts parameter names
	var paramsPragmaMatches = text.matchAll(/\\parameters\s*\(([^)]*)\)/g);
	for(var match of paramsPragmaMatches) {
		var paramsStr = match[1];
		// Parameters can be: name, name:"default", name:<<macro>>
		var paramMatches = paramsStr.matchAll(/([a-zA-Z][a-zA-Z0-9_-]*)/g);
		for(var paramMatch of paramMatches) {
			definitions.variables.add(paramMatch[1]);
		}
	}

	// Extract parameter names from procedure/function/macro definitions
	// \procedure name(param1, param2:"default")
	var defWithParamsMatches = text.matchAll(/\\(?:define|procedure|function|widget)\s+[^\s(]+\s*\(([^)]*)\)/g);
	for(var match of defWithParamsMatches) {
		var paramsStr = match[1];
		if(paramsStr) {
			// Parameters are comma or space separated, may have defaults
			var paramMatches = paramsStr.matchAll(/([a-zA-Z][a-zA-Z0-9_-]*)/g);
			for(var paramMatch of paramMatches) {
				definitions.variables.add(paramMatch[1]);
			}
		}
	}

	return definitions;
}

/**
 * Extract definitions with position information for advanced checks
 */
function extractLocalDefinitionsWithPositions(text) {
	var definitions = [];

	// Match \define, \procedure, \function, \widget with positions
	var pragmaRe = /\\(define|procedure|function|widget)\s+([^\s(]+)(\([^)]*\))?/g;
	var match;
	while((match = pragmaRe.exec(text)) !== null) {
		var type = match[1];
		var name = match[2];
		var nameStart = match.index + match[0].indexOf(name);
		definitions.push({
			type: type,
			name: name,
			from: match.index,
			to: match.index + match[0].length,
			nameFrom: nameStart,
			nameTo: nameStart + name.length
		});
	}

	return definitions;
}

/**
 * Find all usages of macros/procedures/functions in text
 */
function findDefinitionUsages(text) {
	var usages = new Set();

	// Macro calls <<name ...>>
	var macroCallRe = /<<\s*([^\s>]+)/g;
	var match;
	while((match = macroCallRe.exec(text)) !== null) {
		usages.add(match[1]);
	}

	// Transclusion macro calls {{...||template}}
	var transclusionRe = /\{\{[^|{}]*\|\|([^}]+)\}\}/g;
	while((match = transclusionRe.exec(text)) !== null) {
		usages.add(match[1]);
	}

	// Function calls in filters [function[name]]
	var filterFuncRe = /\[function\[([^\]]+)\]/g;
	while((match = filterFuncRe.exec(text)) !== null) {
		usages.add(match[1]);
	}

	// Variable references in filters <name>
	var filterVarRe = /<([a-zA-Z][a-zA-Z0-9_-]*)>/g;
	while((match = filterVarRe.exec(text)) !== null) {
		usages.add(match[1]);
	}

	return usages;
}

/**
 * Find duplicate definitions (same name defined multiple times)
 */
function findDuplicateDefinitions(definitions) {
	var issues = [];
	var seen = {};

	definitions.forEach(function(def) {
		var key = def.name;
		if(seen[key]) {
			issues.push({
				from: def.nameFrom,
				to: def.nameTo,
				message: "Duplicate definition: '" + def.name + "' is already defined as \\" + seen[key].type + " on line " + seen[key].line,
				name: def.name,
				firstDef: seen[key]
			});
		} else {
			seen[key] = def;
		}
	});

	return issues;
}

/**
 * Find unused local definitions
 */
function findUnusedDefinitions(definitions, usages) {
	var issues = [];

	definitions.forEach(function(def) {
		if(!usages.has(def.name)) {
			issues.push({
				from: def.nameFrom,
				to: def.nameTo,
				message: "Unused " + def.type + ": '" + def.name + "' is defined but never used in this tiddler",
				name: def.name,
				type: def.type,
				defFrom: def.from,
				defTo: def.to
			});
		}
	});

	return issues;
}

// ============================================================================
// Known Filter Operators
// ============================================================================

var _knownFilterOperators = null;

/**
 * Get known filter operators from TiddlyWiki
 */
function _getKnownFilterOperators() {
	if(_knownFilterOperators) return _knownFilterOperators;

	var operators = new Set();

	if($tw && $tw.wiki && $tw.wiki.filterOperators) {
		Object.keys($tw.wiki.filterOperators).forEach(function(name) {
			operators.add(name);
		});
	}

	// Also add common operators as fallback
	var commonOps = [
		"title", "field", "has", "tag", "tags", "tagging",
		"is", "all", "filter", "subfilter", "function",
		"each", "eachday", "sort", "sortcs", "nsort", "reverse",
		"first", "last", "nth", "rest", "butfirst", "butlast",
		"count", "sum", "average", "min", "max", "minall", "maxall",
		"limit", "skip", "range", "list", "listed",
		"links", "backlinks", "transcludes",
		"search", "regexp", "prefix", "suffix", "contains", "match",
		"get", "getindex", "getvariable", "lookup", "index", "indexes",
		"add", "subtract", "multiply", "divide", "remainder", "negate", "abs", "ceil", "floor", "round",
		"addprefix", "addsuffix", "removeprefix", "removesuffix",
		"split", "join", "splitregexp", "trim", "lowercase", "uppercase", "titlecase", "sentencecase",
		"length", "charcode", "fromcharcode", "encodeuri", "decodeuri", "encodeuricomponent", "decodeuricomponent",
		"stringify", "jsonstringify", "jsonparse", "jsonget", "jsontype", "jsonindexes", "jsonextract",
		"format", "substitute",
		"else", "then", "compare", "log",
		"enlist", "enlist-input",
		"shadow", "shadowsource", "moduletypes", "modules", "plugintiddlers",
		"commands", "variables", "widgetclass"
	];
	commonOps.forEach(function(op) {
		operators.add(op);
	});

	_knownFilterOperators = operators;
	return operators;
}

// ============================================================================
// Known Tags
// ============================================================================

var _knownTags = null;
var _tagsCacheTime = 0;
var TAG_CACHE_DURATION = 5000; // 5 seconds

/**
 * Get known tags from TiddlyWiki using [all[tiddlers+shadows]is[tag]] filter
 */
function getKnownTags() {
	var now = Date.now();
	if(_knownTags && (now - _tagsCacheTime) < TAG_CACHE_DURATION) {
		return _knownTags;
	}

	var tags = new Set();

	if($tw && $tw.wiki) {
		try {
			var tagList = $tw.wiki.filterTiddlers("[all[tiddlers+shadows]is[tag]]");
			if(tagList && Array.isArray(tagList)) {
				tagList.forEach(function(tag) {
					tags.add(tag);
				});
			}
		} catch (_e) {
			// Ignore errors
		}
	}

	_knownTags = tags;
	_tagsCacheTime = now;
	return tags;
}

/**
 * Check if a tag exists
 */
function tagExists(tagName) {
	if(!$tw || !$tw.wiki) return true; // Assume exists if we can't check
	var knownTags = getKnownTags();
	return knownTags.has(tagName);
}

/**
 * Find invalid tag references in filter expressions
 * Looks for tag[...] and tagging[...] operators with non-existent tags
 */
function findInvalidTagReferences(tree, state) {
	var issues = [];

	tree.iterate({
		enter: function(node) {
			// Look for FilterOperator nodes
			if(node.type.name === "FilterOperator") {
				var text = state.doc.sliceString(node.from, node.to);

				// Match tag[...] or tagging[...] patterns
				// Handles: tag[TagName], !tag[TagName], tag:suffix[TagName]
				var tagMatch = text.match(/^(!?)tag(?::[^\[]*)?(\[[^\]]+\])/);
				var taggingMatch = text.match(/^(!?)tagging(?::[^\[]*)?(\[[^\]]+\])/);

				var match = tagMatch || taggingMatch;
				if(match) {
					var operatorName = tagMatch ? "tag" : "tagging";
					var bracketPart = match[2]; // e.g., [TagName]
					var tagName = bracketPart.slice(1, -1); // Remove [ and ]

					// Skip if empty, variable reference, or text reference
					if(!tagName || tagName.startsWith("<") || tagName.startsWith("{")) {
						return;
					}

					// Check if tag exists
					if(!tagExists(tagName)) {
						// Calculate position of the tag name within the operator
						var bracketStart = text.indexOf("[");
						var tagFrom = node.from + bracketStart + 1;
						var tagTo = tagFrom + tagName.length;

						issues.push({
							from: tagFrom,
							to: tagTo,
							tagName: tagName,
							operatorName: operatorName
						});
					}
				}
			}
		}
	});

	return issues;
}

// ============================================================================
// Bracket Matching Helpers
// ============================================================================

/**
 * Check for unmatched brackets in text
 * Returns array of {pos, char, type} for unmatched brackets
 */
function _findUnmatchedBrackets(text, openSeq, closeSeq, startPos) {
	var unmatched = [];
	var stack = [];
	var i = 0;
	var openLen = openSeq.length;
	var closeLen = closeSeq.length;

	while(i < text.length) {
		if(text.substring(i, i + openLen) === openSeq) {
			stack.push({
				pos: startPos + i,
				char: openSeq
			});
			i += openLen;
		} else if(text.substring(i, i + closeLen) === closeSeq) {
			if(stack.length > 0) {
				stack.pop();
			} else {
				unmatched.push({
					pos: startPos + i,
					char: closeSeq,
					type: "unexpected"
				});
			}
			i += closeLen;
		} else {
			i++;
		}
	}

	// Remaining in stack are unclosed
	stack.forEach(function(item) {
		unmatched.push({
			pos: item.pos,
			char: item.char,
			type: "unclosed"
		});
	});

	return unmatched;
}

/**
 * Check filter expression for balanced brackets
 */
function checkFilterBrackets(text, startPos) {
	var issues = [];
	var squareStack = [];
	var curlyStack = [];
	var angleStack = [];
	var i = 0;

	while(i < text.length) {
		var char = text[i];
		var nextChar = text[i + 1] || "";

		// Skip quoted strings
		if(char === '"') {
			i++;
			while(i < text.length && text[i] !== '"') {
				if(text[i] === "\\") i++;
				i++;
			}
			i++;
			continue;
		}
		if(char === "'") {
			i++;
			while(i < text.length && text[i] !== "'") {
				if(text[i] === "\\") i++;
				i++;
			}
			i++;
			continue;
		}

		// Check brackets
		if(char === "[") {
			squareStack.push(startPos + i);
		} else if(char === "]") {
			if(squareStack.length > 0) {
				squareStack.pop();
			} else {
				issues.push({
					pos: startPos + i,
					message: "Unexpected ']' in filter"
				});
			}
		} else if(char === "{") {
			curlyStack.push(startPos + i);
		} else if(char === "}") {
			if(curlyStack.length > 0) {
				curlyStack.pop();
			} else {
				issues.push({
					pos: startPos + i,
					message: "Unexpected '}' in filter"
				});
			}
		} else if(char === "<" && nextChar !== "%" && nextChar !== "!" && nextChar !== "/") {
			// < for variables, but not <% or <!-- or </
			angleStack.push(startPos + i);
		} else if(char === ">" && text[i - 1] !== "%" && text[i - 1] !== "-") {
			// > closing variable, but not %> or ->
			if(angleStack.length > 0) {
				angleStack.pop();
			}
			// Don't report unmatched > as it could be comparison operator
		}

		i++;
	}

	// Report unclosed brackets
	squareStack.forEach(function(pos) {
		issues.push({
			pos: pos,
			message: "Unclosed '[' in filter"
		});
	});
	curlyStack.forEach(function(pos) {
		issues.push({
			pos: pos,
			message: "Unclosed '{' in filter text reference"
		});
	});
	angleStack.forEach(function(pos) {
		issues.push({
			pos: pos,
			message: "Unclosed '<' in filter variable"
		});
	});

	return issues;
}

// ============================================================================
// Widget Matching
// ============================================================================

/**
 * Find the best insertion position for a closing tag
 * Priority: 1) next empty line, 2) before next tag, 3) container limit, 4) document end
 */
function findBestInsertPosition(state, afterPos, containerLimit, allTagPositions) {
	var docLength = state.doc.length;
	var limit = typeof containerLimit === "number" ? containerLimit : docLength;

	// 1. Look for next empty line after the opening tag
	var lineAfter = state.doc.lineAt(afterPos);
	for(var lineNum = lineAfter.number + 1; lineNum <= state.doc.lines; lineNum++) {
		var line = state.doc.line(lineNum);
		if(line.from >= limit) break;
		if(line.text.trim() === "") {
			// Found empty line - insert at start of this line
			return {
				pos: line.from,
				type: "emptyLine"
			};
		}
	}

	// 2. Look for next tag after the opening tag but before limit
	var nextTagPos = null;
	for(var i = 0; i < allTagPositions.length; i++) {
		var tagPos = allTagPositions[i];
		if(tagPos > afterPos && tagPos < limit) {
			if(nextTagPos === null || tagPos < nextTagPos) {
				nextTagPos = tagPos;
			}
		}
	}
	if(nextTagPos !== null) {
		return {
			pos: nextTagPos,
			type: "beforeTag"
		};
	}

	// 3. Use container limit if available
	if(typeof containerLimit === "number" && containerLimit < docLength) {
		return {
			pos: containerLimit,
			type: "containerEnd"
		};
	}

	// 4. Fall back to document end
	return {
		pos: docLength,
		type: "docEnd"
	};
}

/**
 * Find unclosed widgets and HTML tags in the syntax tree
 */
function findUnclosedWidgets(tree, state) {
	var issues = [];
	var widgetStack = [];
	var htmlStack = [];
	var orphanClosingTags = []; // Track closing tags without matching opening tags
	var containerStack = []; // Track containing structures (pragmas, widgets, conditionals)
	var allTagPositions = []; // Collect all tag start positions for insertion logic

	tree.iterate({
		enter: function(node) {
			var nodeType = node.type.name;

			// Collect tag positions for insertion logic
			if(nodeType === "Widget" || nodeType === "InlineWidget" ||
				nodeType === "WidgetEnd" || nodeType === "HTMLBlock" || nodeType === "HTMLTag") {
				allTagPositions.push(node.from);
			}

			// Track containing structures
			if(nodeType === "MacroDefinition" || nodeType === "ProcedureDefinition" ||
				nodeType === "FunctionDefinition" || nodeType === "WidgetDefinition" ||
				nodeType === "Widget" || nodeType === "InlineWidget" ||
				nodeType === "HTMLBlock" || nodeType === "HTMLTag" ||
				nodeType === "ConditionalBlock") {
				// For pragma definitions, find where to insert (before PragmaEnd)
				var insertBefore = node.to;
				if(nodeType.endsWith("Definition")) {
					// Look for PragmaEnd child
					var cursor = node.node.cursor();
					if(cursor.firstChild()) {
						do {
							if(cursor.name === "PragmaEnd") {
								insertBefore = cursor.from;
								break;
							}
						} while(cursor.nextSibling());
					}
				} else if(nodeType === "ConditionalBlock") {
					// Look for the closing <%endif%>
					var text = state.doc.sliceString(node.from, node.to);
					var endifMatch = text.match(/<%\s*endif\s*%>/);
					if(endifMatch) {
						insertBefore = node.from + endifMatch.index;
					}
				}
				containerStack.push({
					type: nodeType,
					from: node.from,
					to: node.to,
					insertBefore: insertBefore
				});
			}

			// Opening HTML tag (non-self-closing)
			if(nodeType === "HTMLBlock" || nodeType === "HTMLTag") {
				var tagText = state.doc.sliceString(node.from, node.to);
				// Check if it's a closing tag or self-closing (allow leading whitespace for block-level tags)
				var trimmedTagText = tagText.trimStart();
				if(!trimmedTagText.startsWith("</") && !/\/>\s*$/.test(trimmedTagText)) {
					// Extract tag name (allow leading whitespace for block-level tags)
					var tagMatch = tagText.match(/^\s*<([a-zA-Z][a-zA-Z0-9]*)/);
					if(tagMatch) {
						var tagName = tagMatch[1].toLowerCase();
						// Skip void elements that don't need closing
						var voidElements = ["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"];
						if(voidElements.indexOf(tagName) === -1) {
							// Count opening and closing tags to detect if block is properly balanced
							// This handles cases like <div>hello</div></div> where there's an orphan closing tag
							var openPattern = new RegExp("<" + tagName + "(?:\\s|>|/>)", "gi");
							var closePattern = new RegExp("</" + tagName + ">", "gi");
							var openCount = (tagText.match(openPattern) || []).length;
							var closeCount = (tagText.match(closePattern) || []).length;

							if(closeCount >= openCount && openCount > 0) {
								// Block contains at least as many closing tags as opening - the opening is matched
								// Don't add to htmlStack, but DO continue iterating children
								// because children may contain orphan closing tags for OTHER tag types
								// (e.g., an orphan </$set> inside a balanced <span>...</span>)
								return;
							}
							// Check if opening tag is complete (has closing >)
							// Incomplete tags like <div class="test" (missing >) shouldn't match with sibling closing tags
							var hasOpeningTagClose = false;
							var htmlCursor = node.node.cursor();
							if(htmlCursor.firstChild()) {
								do {
									if(htmlCursor.name === "TagMark") {
										var htmlMarkText = state.doc.sliceString(htmlCursor.from, htmlCursor.to);
										if(htmlMarkText === ">") {
											hasOpeningTagClose = true;
											break;
										}
									}
								} while(htmlCursor.nextSibling());
							}
							// Skip incomplete opening tags
							if(!hasOpeningTagClose) {
								return; // Don't add to htmlStack
							}
							// Find containing structure for limit
							var containerLimit = null;
							var containerType = null;
							for(var c = containerStack.length - 1; c >= 0; c--) {
								if(containerStack[c].from !== node.from) {
									containerLimit = containerStack[c].insertBefore;
									containerType = containerStack[c].type;
									break;
								}
							}
							htmlStack.push({
								name: tagName,
								from: node.from,
								to: node.to,
								closed: false,
								containerLimit: containerLimit,
								containerType: containerType
							});
						}
					}
				}
			}

			// Closing HTML tag (standalone closing tag as block)
			if((nodeType === "HTMLBlock" || nodeType === "HTMLTag")) {
				var tagText = state.doc.sliceString(node.from, node.to);
				// Allow leading whitespace for block-level tags
				var closeMatch = tagText.match(/^\s*<\/([a-zA-Z][a-zA-Z0-9]*)>/);
				if(closeMatch) {
					var closeName = closeMatch[1].toLowerCase();
					var foundMatch = false;
					for(var i = htmlStack.length - 1; i >= 0; i--) {
						if(htmlStack[i].name === closeName && !htmlStack[i].closed) {
							htmlStack[i].closed = true;
							foundMatch = true;
							break;
						}
					}
					// Track orphan closing tag (no matching opening tag)
					if(!foundMatch) {
						orphanClosingTags.push({
							name: closeName,
							from: node.from,
							to: node.to,
							isHTML: true
						});
					}
				}
			}

			// Standalone closing HTML tag (HTMLEndTag node)
			// Skip if this is a child of an HTMLBlock/HTMLTag with the same tag name
			// (those are properly matched closing tags handled by the parent)
			if(nodeType === "HTMLEndTag") {
				// Extract tag name from TagName child
				var closeName = null;
				var cursor = node.node.cursor();
				if(cursor.firstChild()) {
					do {
						if(cursor.name === "TagName") {
							closeName = state.doc.sliceString(cursor.from, cursor.to).toLowerCase();
							break;
						}
					} while(cursor.nextSibling());
				}
				if(closeName) {
					// Check if this HTMLEndTag is part of a self-contained parent block
					// by checking if the parent HTMLBlock/HTMLTag contains a matching opening tag
					var parent = node.node.parent;
					if(parent && (parent.name === "HTMLBlock" || parent.name === "HTMLTag")) {
						var parentText = state.doc.sliceString(parent.from, parent.to);
						// Check if parent starts with opening tag of same name (allow leading whitespace)
						var openingTagPattern = new RegExp("^\\s*<" + closeName + "(\\s|>|/>)", "i");
						if(openingTagPattern.test(parentText)) {
							// Count opening tags in parent
							var openPattern = new RegExp("<" + closeName + "(?:\\s|>|/>)", "gi");
							var openCount = (parentText.match(openPattern) || []).length;

							// Count closing tags that come BEFORE this node's position (within the parent)
							var textBeforeNode = state.doc.sliceString(parent.from, node.from);
							var closePattern = new RegExp("</" + closeName + ">", "gi");
							var closeCountBefore = (textBeforeNode.match(closePattern) || []).length;

							// If we haven't used up all opening tags yet, this closing tag matches one
							if(closeCountBefore < openCount) {
								return; // This is a properly matched closing tag - skip
							}
							// Otherwise, this is an orphan - fall through to orphan detection
						}
					}
					// Check against htmlStack for orphan detection
					var foundMatch = false;
					for(var i = htmlStack.length - 1; i >= 0; i--) {
						if(htmlStack[i].name === closeName && !htmlStack[i].closed) {
							htmlStack[i].closed = true;
							foundMatch = true;
							break;
						}
					}
					// Track orphan closing tag (no matching opening tag)
					if(!foundMatch) {
						orphanClosingTags.push({
							name: closeName,
							from: node.from,
							to: node.to,
							isHTML: true
						});
					}
				}
			}

			// Opening widget tag
			if(nodeType === "Widget" || nodeType === "InlineWidget") {
				// Find the widget name and check if opening tag is complete
				var nameNode = null;
				var hasOpeningTagClose = false; // Track if we have a closing > for the opening tag
				var cursor = node.node.cursor();
				if(cursor.firstChild()) {
					do {
						if(cursor.name === "WidgetName") {
							nameNode = cursor.node;
						}
						// Check for TagMark that closes the opening tag (the > after attributes)
						// This distinguishes complete <$widget attr="val"> from incomplete <$widget attr="val"
						if(cursor.name === "TagMark") {
							var markText = state.doc.sliceString(cursor.from, cursor.to);
							if(markText === ">") {
								hasOpeningTagClose = true;
							}
						}
					} while(cursor.nextSibling());
				}

				if(nameNode) {
					var widgetName = state.doc.sliceString(nameNode.from, nameNode.to);
					// Check if it's self-closing
					var tagText = state.doc.sliceString(node.from, node.to);
					var isSelfClosing = /\/>\s*$/.test(tagText);

					// Skip incomplete widgets (missing > on opening tag)
					// They already get parsed errors and shouldn't match with sibling closing tags
					if(!hasOpeningTagClose && !isSelfClosing) {
						return; // Don't add to widgetStack
					}

					if(!isSelfClosing) {
						// Find the containing structure (skip self - look at parent)
						var containerLimit = null;
						var containerType = null;
						var parentIdx = containerStack.length - 2;
						if(parentIdx >= 0) {
							containerLimit = containerStack[parentIdx].insertBefore;
							containerType = containerStack[parentIdx].type;
						}

						widgetStack.push({
							name: widgetName,
							from: node.from,
							to: node.to,
							closed: false,
							containerLimit: containerLimit,
							containerType: containerType
						});
					}
				}
			}

			// Closing widget tag
			if(nodeType === "WidgetEnd") {
				var closeText = state.doc.sliceString(node.from, node.to);
				var closeMatch = closeText.match(/<\/(\$[\w\-\.]+)>/);
				if(closeMatch) {
					var closeName = closeMatch[1];

					// Check if this WidgetEnd is properly paired using tree structure.
					// A closing tag is properly paired ONLY if its immediate Widget/InlineWidget
					// ancestor has a matching name. Walking up further would incorrectly match
					// orphan closing tags with outer widgets they shouldn't close.
					var isProperlyPairedByTree = false;
					var ancestor = node.node.parent;
					while(ancestor) {
						// Stop at definition boundaries
						if(ancestor.type.name === "MacroDefinition" || ancestor.type.name === "ProcedureDefinition" ||
							ancestor.type.name === "FunctionDefinition" || ancestor.type.name === "WidgetDefinition") {
							break;
						}
						if(ancestor.type.name === "Widget" || ancestor.type.name === "InlineWidget") {
							// Check if this widget has matching name
							var ancestorCursor = ancestor.cursor();
							if(ancestorCursor.firstChild()) {
								do {
									if(ancestorCursor.name === "WidgetName") {
										var ancestorWidgetName = state.doc.sliceString(ancestorCursor.from, ancestorCursor.to);
										if(ancestorWidgetName === closeName) {
											isProperlyPairedByTree = true;
										}
										break;
									}
								} while(ancestorCursor.nextSibling());
							}
							// Stop at first Widget/InlineWidget - only check immediate parent widget
							break;
						}
						ancestor = ancestor.parent;
					}

					// Tree-based check is authoritative for determining if a closing tag is
					// properly paired. If the parent widget name doesn't match, it's an orphan.
					if(isProperlyPairedByTree) {
						// Properly paired - mark the corresponding stack entry as closed
						for(var i = widgetStack.length - 1; i >= 0; i--) {
							if(widgetStack[i].name === closeName && !widgetStack[i].closed) {
								widgetStack[i].closed = true;
								break;
							}
						}
					} else {
						// Not properly paired according to tree structure.
						// This is an orphan/misplaced closing tag.
						orphanClosingTags.push({
							name: closeName,
							from: node.from,
							to: node.to,
							isWidget: true
						});
						// Also mark any matching stack entry as closed to prevent
						// false "unclosed widget" reports (the parser may have paired them)
						for(var i = widgetStack.length - 1; i >= 0; i--) {
							if(widgetStack[i].name === closeName && !widgetStack[i].closed) {
								widgetStack[i].closed = true;
								break;
							}
						}
					}
				}
			}
		},
		leave: function(node) {
			var nodeType = node.type.name;
			// Pop from container stack when leaving
			if(nodeType === "MacroDefinition" || nodeType === "ProcedureDefinition" ||
				nodeType === "FunctionDefinition" || nodeType === "WidgetDefinition" ||
				nodeType === "Widget" || nodeType === "InlineWidget" ||
				nodeType === "HTMLBlock" || nodeType === "HTMLTag" ||
				nodeType === "ConditionalBlock") {
				containerStack.pop();
			}
		}
	});

	// Report unclosed widgets with smart insertion positions
	widgetStack.forEach(function(widget) {
		if(!widget.closed) {
			// Skip unclosed warning for incomplete widgets like "<$ " (name is just "$")
			// These already get "Undefined widget ''" warning
			if(widget.name === "$") {
				return;
			}
			var insertInfo = findBestInsertPosition(state, widget.to, widget.containerLimit, allTagPositions);
			issues.push({
				from: widget.from,
				to: widget.to,
				message: "Unclosed widget: " + widget.name,
				name: widget.name,
				insertAt: insertInfo.pos,
				insertType: insertInfo.type,
				containerType: widget.containerType,
				isWidget: true
			});
		}
	});

	// Report unclosed HTML tags with smart insertion positions
	htmlStack.forEach(function(tag) {
		if(!tag.closed) {
			var insertInfo = findBestInsertPosition(state, tag.to, tag.containerLimit, allTagPositions);
			issues.push({
				from: tag.from,
				to: tag.to,
				message: "Unclosed HTML tag: <" + tag.name + ">",
				name: tag.name,
				insertAt: insertInfo.pos,
				insertType: insertInfo.type,
				containerType: tag.containerType,
				isHTML: true
			});
		}
	});

	// Report orphan closing tags (closing tags without matching opening tags)
	orphanClosingTags.forEach(function(tag) {
		if(tag.isWidget) {
			issues.push({
				from: tag.from,
				to: tag.to,
				message: "Unexpected closing tag: </" + tag.name + "> has no matching opening tag",
				name: tag.name,
				isOrphanClose: true,
				isWidget: true
			});
		} else if(tag.isHTML) {
			issues.push({
				from: tag.from,
				to: tag.to,
				message: "Unexpected closing tag: </" + tag.name + "> has no matching opening tag",
				name: tag.name,
				isOrphanClose: true,
				isHTML: true
			});
		}
	});

	return issues;
}

// ============================================================================
// Pragma Matching
// ============================================================================

/**
 * Find unclosed pragma definitions and ambiguous \end statements
 *
 * Single-line pragmas like `\define foo() content` don't need \end
 * Multi-line pragmas (where content is on following lines) need \end
 * Warns when \end without a name is used with multiple open pragmas (ambiguous)
 *
 * Note: Content inside triple-quoted (""") and single-quoted (') attribute values
 * is treated as isolated parsing contexts. Pragmas inside these contexts are
 * validated separately - they should not affect or be affected by the outer document.
 */
function findUnclosedPragmas(text, startPos) {
	var issues = [];
	// Stack of contexts: each context has { pragmaStack, isIsolated, quoteType }
	// The root context is not isolated
	var contextStack = [{
		pragmaStack: [],
		isIsolated: false,
		quoteType: null
	}];

	var lines = text.split("\n");
	var pos = startPos;

	// Helper to get current context
	function currentContext() {
		return contextStack[contextStack.length - 1];
	}

	// Helper to get current pragma stack
	function currentPragmaStack() {
		return currentContext().pragmaStack;
	}

	for(var i = 0; i < lines.length; i++) {
		var line = lines[i];
		var trimmed = line.trim();

		// Check for entering/exiting isolated contexts (""" or ')
		// Triple quotes first since they're longer
		var tripleQuoteIdx = line.indexOf('"""');
		var singleQuoteAttrIdx = -1;
		// Look for attribute='value' pattern where value might span multiple lines
		var attrMatch = line.match(/\s(\w+)='([^']*)$/);
		if(attrMatch && line.indexOf("'''") === -1) {
			// Starting a single-quoted attribute that doesn't end on this line
			singleQuoteAttrIdx = line.indexOf("='") + 2;
		}

		// Handle triple-quoted strings
		if(tripleQuoteIdx !== -1) {
			var afterTriple = line.substring(tripleQuoteIdx + 3);
			if(currentContext().quoteType === '"""') {
				// Exiting triple-quoted context
				// Check for unclosed pragmas in the isolated context
				var isolatedStack = currentPragmaStack();
				isolatedStack.forEach(function(pragma) {
					issues.push({
						from: pragma.pos,
						to: pragma.lineEnd,
						message: "Unclosed \\" + pragma.type + ": " + pragma.name + " (missing \\end) in attribute value",
						pragmaName: pragma.name,
						pragmaType: pragma.type
					});
				});
				contextStack.pop();
			} else if(afterTriple.indexOf('"""') === -1) {
				// Entering triple-quoted context (and it doesn't close on same line)
				contextStack.push({
					pragmaStack: [],
					isIsolated: true,
					quoteType: '"""'
				});
			}
			// If triple quotes open and close on same line, treat content as isolated but don't track
		}

		// Handle single-quoted attribute values that span lines
		// This is tricky because ' is also used in contractions
		// We only enter single-quote context for clear attribute patterns
		if(singleQuoteAttrIdx !== -1 && !currentContext().isIsolated) {
			contextStack.push({
				pragmaStack: [],
				isIsolated: true,
				quoteType: "'"
			});
		} else if(currentContext().quoteType === "'" && line.indexOf("'") !== -1) {
			// Check if this closes the single-quoted attribute
			// Look for closing ' that's followed by whitespace, / or >
			var closingQuoteMatch = line.match(/'[\s/>]/);
			if(closingQuoteMatch || line.endsWith("'")) {
				var isolatedStack = currentPragmaStack();
				isolatedStack.forEach(function(pragma) {
					issues.push({
						from: pragma.pos,
						to: pragma.lineEnd,
						message: "Unclosed \\" + pragma.type + ": " + pragma.name + " (missing \\end) in attribute value",
						pragmaName: pragma.name,
						pragmaType: pragma.type
					});
				});
				contextStack.pop();
			}
		}

		// Match opening pragmas: \define, \procedure, \function, \widget
		// Pattern: \keyword name(params) [optional inline content]
		// In isolated contexts, also match pragmas that aren't at line start
		var pragmaPattern = currentContext().isIsolated ?
			/\\(define|procedure|function|widget)\s+([^\s(]+)(\([^)]*\))?(.*)$/ :
			/^\\(define|procedure|function|widget)\s+([^\s(]+)(\([^)]*\))?(.*)$/;
		var openMatch = trimmed.match(pragmaPattern);
		if(openMatch) {
			var pragmaType = openMatch[1];
			var pragmaName = openMatch[2];
			var _params = openMatch[3] || "";
			var afterParams = openMatch[4] || "";

			// Single-line definition: has non-whitespace content after the params on the same line
			// Example: \define foo() some content here
			// Multi-line definition: nothing after params, or only whitespace
			// Example: \define foo()
			//          content here
			//          \end
			var isSingleLine = afterParams.trim().length > 0;

			if(!isSingleLine) {
				// Multi-line pragma needs \end
				currentPragmaStack().push({
					type: pragmaType,
					name: pragmaName,
					pos: pos,
					lineEnd: pos + line.length
				});
			}
			// Single-line pragmas don't need \end, so we don't push them to the stack
		}

		// Match closing pragmas
		// In isolated contexts, also match \end that isn't at line start
		var endPattern = currentContext().isIsolated ?
			/\\end\s*(\S*)/ :
			/^\\end\s*(\S*)/;
		var closeMatch = trimmed.match(endPattern);
		if(closeMatch) {
			var endName = closeMatch[1];
			var endPos = pos + line.indexOf("\\end");
			var endLength = closeMatch[0].length;
			var pragmaStack = currentPragmaStack();

			if(!endName && pragmaStack.length > 0) {
				// Bare \end - suggest using named form for clarity
				// Skip this hint for isolated contexts to reduce noise
				if(!currentContext().isIsolated) {
					var suggestedName = pragmaStack[pragmaStack.length - 1].name;
					if(pragmaStack.length > 1) {
						// Ambiguous: multiple pragmas open
						var openNames = pragmaStack.map(function(p) {
							return p.name;
						}).join(", ");
						issues.push({
							from: endPos,
							to: endPos + endLength,
							message: "Ambiguous \\end: multiple pragmas open (" + openNames + "). Use \\end " + suggestedName + " to be explicit.",
							suggestedName: suggestedName
						});
					} else {
						// Single pragma open - hint to use named form
						issues.push({
							from: endPos,
							to: endPos + endLength,
							message: "Bare \\end closes " + suggestedName + ". Consider using \\end " + suggestedName + " for clarity.",
							suggestedName: suggestedName,
							isHint: true
						});
					}
				}
			}

			if(pragmaStack.length > 0) {
				// Find matching pragma
				var foundIndex = -1;
				for(var j = pragmaStack.length - 1; j >= 0; j--) {
					if(!endName || pragmaStack[j].name === endName) {
						foundIndex = j;
						break;
					}
				}

				if(foundIndex >= 0) {
					// Check for any nested pragmas that weren't closed before this \end
					// These are pragmas at indices > foundIndex (opened after the one we're closing)
					for(var k = pragmaStack.length - 1; k > foundIndex; k--) {
						var unclosed = pragmaStack[k];
						var msgSuffix = currentContext().isIsolated ? " in attribute value" : "";
						issues.push({
							from: unclosed.pos,
							to: unclosed.lineEnd,
							message: "Unclosed \\" + unclosed.type + ": " + unclosed.name + " (not closed before \\end " + (endName || pragmaStack[foundIndex].name) + ")" + msgSuffix,
							pragmaName: unclosed.name,
							pragmaType: unclosed.type,
							insertEndAt: endPos // Insert \end before the parent's \end
						});
					}
					// Remove the matched pragma and all nested ones
					pragmaStack.splice(foundIndex);
				} else if(endName) {
					// Named \end but no matching pragma found
					var msgSuffix = currentContext().isIsolated ? " in attribute value" : "";
					issues.push({
						from: endPos,
						to: endPos + endLength,
						message: "Unmatched \\end " + endName + ": no open pragma with this name" + msgSuffix
					});
				}
			} else {
				// Stack is empty - this \end has nothing to close
				// In isolated contexts, this is expected if pragmas were balanced
				if(!currentContext().isIsolated) {
					issues.push({
						from: endPos,
						to: endPos + endLength,
						message: "Unexpected \\end" + (endName ? " " + endName : "") + ": no open pragma to close"
					});
				}
			}
		}

		pos += line.length + 1; // +1 for newline
	}

	// Report unclosed pragmas in the root context
	// (Isolated contexts are checked when they're closed)
	if(contextStack.length === 1) {
		currentPragmaStack().forEach(function(pragma) {
			issues.push({
				from: pragma.pos,
				to: pragma.lineEnd,
				message: "Unclosed \\" + pragma.type + ": " + pragma.name + " (missing \\end)",
				pragmaName: pragma.name,
				pragmaType: pragma.type
			});
		});
	}

	return issues;
}

/**
 * Find pragmas that appear after regular content (invalid position)
 *
 * Pragmas (\define, \procedure, \function, \widget, \import, \rules, \whitespace, \parameters)
 * must appear at the top of their scope before any regular content.
 * This applies both at document level AND within pragma bodies.
 *
 * Comments (<!-- ... -->) are NOT considered content and are ignored.
 *
 * Example of invalid:
 *   \define outer()
 *   \procedure inner()
 *   some text
 *   \procedure invalid() <- This is invalid because "some text" came first
 *   \end
 *   \end
 */
function findMisplacedPragmas(text, startPos) {
	var issues = [];
	var lines = text.split("\n");
	var pos = startPos;

	// Stack tracks: { type, name, foundContent, bodyStartPos }
	// foundContent tracks whether content has appeared at THIS nesting level
	// bodyStartPos is where the pragma's body starts (for quick-fix insertion)
	var pragmaStack = [];
	var foundContentAtRoot = false; // Track content at document root level
	var inMultiLineComment = false; // Track if we're inside a multi-line comment

	// Pragma patterns
	var pragmaOpenRe = /^\\(define|procedure|function|widget)\s+([^\s(]+)/;
	var pragmaSimpleRe = /^\\(import|rules|whitespace|parameters)\b/;
	var pragmaCloseRe = /^\\end\b/;

	for(var i = 0; i < lines.length; i++) {
		var line = lines[i];
		var trimmed = line.trim();

		// Skip blank lines
		if(trimmed === "") {
			pos += line.length + 1;
			continue;
		}

		// Handle multi-line comment tracking
		if(inMultiLineComment) {
			// Check if this line ends the comment
			if(trimmed.indexOf("-->") !== -1) {
				inMultiLineComment = false;
			}
			// Skip this line (it's part of a comment)
			pos += line.length + 1;
			continue;
		}

		// Check for single-line comment (contains both <!-- and -->)
		if(trimmed.indexOf("<!--") !== -1 && trimmed.indexOf("-->") !== -1) {
			// Single-line comment - skip it
			pos += line.length + 1;
			continue;
		}

		// Check for start of multi-line comment
		if(trimmed.indexOf("<!--") !== -1) {
			inMultiLineComment = true;
			pos += line.length + 1;
			continue;
		}

		// Check for pragma close
		if(pragmaCloseRe.test(trimmed)) {
			if(pragmaStack.length > 0) {
				pragmaStack.pop();
			}
			pos += line.length + 1;
			continue;
		}

		// Check for pragma open (multi-line ones)
		var pragmaOpenMatch = trimmed.match(pragmaOpenRe);
		if(pragmaOpenMatch) {
			var pragmaType = pragmaOpenMatch[1];
			var pragmaName = pragmaOpenMatch[2];

			// Check if it's single-line (has content after params)
			var afterMatch = trimmed.match(/^\\(?:define|procedure|function|widget)\s+[^\s(]+(\([^)]*\))?(.*)$/);
			var isSingleLine = afterMatch && afterMatch[2] && afterMatch[2].trim().length > 0;

			// Check if content has appeared at current scope
			var contentAppearedAtScope = pragmaStack.length > 0 ?
				pragmaStack[pragmaStack.length - 1].foundContent :
				foundContentAtRoot;

			if(contentAppearedAtScope) {
				// This pragma appears after content - invalid
				var containingPragma = pragmaStack.length > 0 ? pragmaStack[pragmaStack.length - 1] : null;
				var scopeDesc = containingPragma ?
					"within \\" + containingPragma.type + " " + containingPragma.name :
					"in the tiddler";
				issues.push({
					from: pos,
					to: pos + line.length,
					message: "Pragma \\" + pragmaType + " must appear before any content " + scopeDesc,
					containingPragma: containingPragma
				});
			}

			if(!isSingleLine) {
				// Body starts after this line (pos + line.length + 1 for the newline)
				var bodyStart = pos + line.length + 1;
				pragmaStack.push({
					type: pragmaType,
					name: pragmaName,
					foundContent: false, // New scope, no content yet
					bodyStartPos: bodyStart
				});
			}
			pos += line.length + 1;
			continue;
		}

		// Check for simple pragmas (single-line only)
		var pragmaSimpleMatch = trimmed.match(pragmaSimpleRe);
		if(pragmaSimpleMatch) {
			var contentAppearedAtScope = pragmaStack.length > 0 ?
				pragmaStack[pragmaStack.length - 1].foundContent :
				foundContentAtRoot;

			if(contentAppearedAtScope) {
				var containingPragma = pragmaStack.length > 0 ? pragmaStack[pragmaStack.length - 1] : null;
				var scopeDesc = containingPragma ?
					"within \\" + containingPragma.type + " " + containingPragma.name :
					"in the tiddler";
				issues.push({
					from: pos,
					to: pos + line.length,
					message: "Pragma \\" + pragmaSimpleMatch[1] + " must appear before any content " + scopeDesc,
					containingPragma: containingPragma
				});
			}
			pos += line.length + 1;
			continue;
		}

		// Line continuation (lone backslash)
		if(trimmed === "\\") {
			pos += line.length + 1;
			continue;
		}

		// This is regular content - mark that we've found content at current scope
		// (unless it's another backslash-something that we don't recognize)
		if(!trimmed.startsWith("\\")) {
			if(pragmaStack.length > 0) {
				pragmaStack[pragmaStack.length - 1].foundContent = true;
			} else {
				foundContentAtRoot = true;
			}
		}

		pos += line.length + 1;
	}

	return issues;
}

// ============================================================================
// Conditional Block Matching
// ============================================================================

/**
 * Check if conditionals are balanced within a given text
 * Returns true if <%if%> and <%endif%> are properly balanced
 */
function areConditionalsBalanced(text) {
	var depth = 0;
	var ifRe = /<%\s*if\b/g;
	var endifRe = /<%\s*endif\s*%>/g;

	// Count all <%if opens
	var ifMatch;
	while((ifMatch = ifRe.exec(text)) !== null) {
		depth++;
	}

	// Count all <%endif closes
	var endifMatch;
	var endifCount = 0;
	while((endifMatch = endifRe.exec(text)) !== null) {
		endifCount++;
	}

	return depth === endifCount;
}

/**
 * Find the enclosing AttributeString node if any
 * Returns the node or null if not inside an attribute string
 */
function findEnclosingAttributeString(node) {
	var current = node.parent;
	while(current) {
		if(current.name === "AttributeString" || current.name === "AttributeQuoted") {
			return current;
		}
		current = current.parent;
	}
	return null;
}

/**
 * Find unclosed conditional blocks with smart insertion positions
 *
 * Note: Conditionals inside attribute values (triple-quoted or single-quoted)
 * are treated as isolated parsing contexts and checked for balance separately.
 */
function findUnclosedConditionals(tree, state) {
	var issues = [];
	var docLength = state.doc.length;

	tree.iterate({
		enter: function(node) {
			var nodeType = node.type.name;

			// Skip nodes inside attribute values - they're isolated parsing contexts
			// We'll check them separately below
			if(isInsideAttributeValue(tree, node.from)) {
				return;
			}

			// Check ConditionalBlock nodes for missing <%endif%>
			if(nodeType === "ConditionalBlock") {
				var text = state.doc.sliceString(node.from, node.to);

				// Check if block has <%if but no <%endif
				var hasIf = /<%\s*if\b/.test(text);
				var hasEndif = /<%\s*endif\s*%>/.test(text);

				if(hasIf && !hasEndif) {
					// Find the <%if position for the error marker
					var ifMatch = text.match(/<%\s*if\b[^%]*%>/);
					var ifFrom = node.from;
					var ifTo = node.from + (ifMatch ? ifMatch[0].length : 10);

					// Find best insertion position
					var insertInfo = findBestInsertPosition(state, ifTo, docLength, []);

					issues.push({
						from: ifFrom,
						to: ifTo,
						message: "Unclosed <%if (missing <%endif%>)",
						insertAt: insertInfo.pos,
						insertType: insertInfo.type
					});
				}
			}

		}
	});

	// Check inline Conditional nodes (<%if%>, <%elseif%>, <%else%>, <%endif%> in inline mode)
	// These need to be matched as pairs since they're not grouped into ConditionalBlock
	var inlineConditionals = [];
	tree.iterate({
		enter: function(node) {
			if(node.type.name !== "Conditional") return;

			// Skip if inside attribute values
			if(isInsideAttributeValue(tree, node.from)) return;

			// Check if inside a ConditionalBlock
			var parent = node.node.parent;
			var inBlock = false;
			while(parent) {
				if(parent.name === "ConditionalBlock") {
					inBlock = true;
					break;
				}
				parent = parent.parent;
			}

			// If inside a ConditionalBlock, the block-level check handles it
			if(inBlock) return;

			var text = state.doc.sliceString(node.from, node.to);
			var type = null;
			if(/<%\s*if\b/.test(text)) type = "if";
			else if(/<%\s*elseif\b/.test(text)) type = "elseif";
			else if(/<%\s*else\s*%>/.test(text)) type = "else";
			else if(/<%\s*endif\s*%>/.test(text)) type = "endif";

			if(type) {
				inlineConditionals.push({
					type: type,
					from: node.from,
					to: node.to
				});
			}
		}
	});

	// Match inline conditionals using depth tracking
	// Sort by position
	inlineConditionals.sort(function(a, b) {
		return a.from - b.from;
	});

	var ifStack = []; // Stack of unmatched <%if%> nodes
	for(var i = 0; i < inlineConditionals.length; i++) {
		var cond = inlineConditionals[i];
		if(cond.type === "if") {
			ifStack.push(cond);
		} else if(cond.type === "endif") {
			if(ifStack.length > 0) {
				// Matched - pop the last <%if%>
				ifStack.pop();
			} else {
				// Unmatched <%endif%>
				issues.push({
					from: cond.from,
					to: cond.to,
					message: "Unexpected <%endif%> without matching <%if"
				});
			}
		}
		// <%elseif%> and <%else%> don't affect the stack - they're inside existing if blocks
	}

	// Any remaining items in ifStack are unmatched <%if%>
	for(var j = 0; j < ifStack.length; j++) {
		var unclosedIf = ifStack[j];
		var insertInfo = findBestInsertPosition(state, unclosedIf.to, docLength, []);
		issues.push({
			from: unclosedIf.from,
			to: unclosedIf.to,
			message: "Unclosed <%if (missing <%endif%>)",
			insertAt: insertInfo.pos,
			insertType: insertInfo.type
		});
	}

	// Check conditional balance inside attribute values (isolated contexts)
	// Find all AttributeString nodes and check their content
	tree.iterate({
		enter: function(node) {
			if(node.type.name === "AttributeString" || node.type.name === "AttributeQuoted") {
				var attrText = state.doc.sliceString(node.from, node.to);
				// Only check if there are conditionals in this attribute
				if(/<%\s*(if|endif)\b/.test(attrText)) {
					if(!areConditionalsBalanced(attrText)) {
						var hasMoreIfs = (attrText.match(/<%\s*if\b/g) || []).length >
							(attrText.match(/<%\s*endif\s*%>/g) || []).length;
						if(hasMoreIfs) {
							issues.push({
								from: node.from,
								to: node.to,
								message: "Unclosed <%if (missing <%endif%>) in attribute value"
							});
						} else {
							issues.push({
								from: node.from,
								to: node.to,
								message: "Unexpected <%endif%> without matching <%if in attribute value"
							});
						}
					}
				}
			}
		}
	});

	return issues;
}

// ============================================================================
// Code Block Matching
// ============================================================================

/**
 * Find unclosed code blocks with smart insertion positions
 */
function findUnclosedCodeBlocks(state) {
	var issues = [];
	var stack = [];
	var text = state.doc.toString();
	var lines = text.split("\n");
	var pos = 0;

	for(var i = 0; i < lines.length; i++) {
		var line = lines[i];
		var trimmed = line.trim();

		// Check for ``` at start of line
		if(trimmed.startsWith("```")) {
			if(stack.length > 0 && trimmed === "```") {
				// Closing
				stack.pop();
			} else if(trimmed.startsWith("```")) {
				// Opening (possibly with language)
				stack.push({
					pos: pos + line.indexOf("```"),
					lineNum: i,
					lineEnd: pos + line.length
				});
			}
		}

		// Check for $$$ typed blocks
		if(trimmed.startsWith("$$$")) {
			if(stack.length > 0 && stack[stack.length - 1].type === "$$$" && trimmed === "$$$") {
				stack.pop();
			} else if(trimmed.startsWith("$$$")) {
				stack.push({
					pos: pos + line.indexOf("$$$"),
					lineNum: i,
					lineEnd: pos + line.length,
					type: "$$$"
				});
			}
		}

		pos += line.length + 1;
	}

	// Report unclosed code blocks with smart insertion positions
	stack.forEach(function(item) {
		var marker = item.type || "```";

		// Find best insertion position: next empty line, or end of document
		var insertPos = state.doc.length;
		var insertType = "docEnd";

		// Look for next empty line after the opening marker
		var lineAfter = state.doc.lineAt(item.lineEnd);
		for(var lineNum = lineAfter.number + 1; lineNum <= state.doc.lines; lineNum++) {
			var line = state.doc.line(lineNum);
			if(line.text.trim() === "") {
				insertPos = line.from;
				insertType = "emptyLine";
				break;
			}
		}

		issues.push({
			from: item.pos,
			to: item.pos + 3,
			message: "Unclosed code block (missing closing " + marker + ")",
			marker: marker,
			insertAt: insertPos,
			insertType: insertType
		});
	});

	return issues;
}

// ============================================================================
// Empty Filter Operator Check
// ============================================================================

/**
 * Find empty filter operators like []
 */
function findEmptyFilterOperators(tree, state) {
	var issues = [];

	tree.iterate({
		enter: function(node) {
			if(node.type.name === "FilterOperator") {
				var text = state.doc.sliceString(node.from, node.to);
				// Check for empty operator []
				if(/^\[\s*\]$/.test(text)) {
					issues.push({
						from: node.from,
						to: node.to,
						message: "Empty filter operator []"
					});
				}
			}
		}
	});

	return issues;
}

// ============================================================================
// Main Linting Logic
// ============================================================================

/**
 * Create linter function
 * @param {EditorView} view - The CodeMirror editor view
 * @param {Set<string>} widgetScopeVars - Variables from the widget tree scope (parent widgets)
 */
function createTiddlyWikiLinter(view, widgetScopeVars) {
	if(!_syntaxTree) return [];

	var diagnostics = [];
	var state = view.state;
	var tree = _syntaxTree(state);
	var docText = state.doc.toString();

	// Ensure widgetScopeVars is a Set
	widgetScopeVars = widgetScopeVars || new Set();

	// Get local definitions
	var localDefs = extractLocalDefinitions(docText);

	// Build call-site analysis for dynamic scope resolution
	var callAnalysis = buildCallSiteAnalysis(tree, docText);

	// ========================================
	// Syntax Tree Based Checks
	// ========================================

	tree.iterate({
		enter: function(node) {
			var nodeType = node.type.name;
			var from = node.from;
			var to = node.to;
			var text = state.doc.sliceString(from, to);

			// Check WikiLinks for missing tiddlers
			if(nodeType === "LinkTarget" && isRuleEnabled("missingLinks")) {
				// Skip external URLs (http://, https://, file://, mailto:, etc.)
				var isExternalLink = /^[a-zA-Z][a-zA-Z0-9+.\-]*:/.test(text);
				if(!isExternalLink && !tiddlerExists(text)) {
					diagnostics.push({
						from: from,
						to: to,
						severity: "warning",
						message: "Link to missing tiddler: " + text,
						source: "tiddlywiki"
					});
				}
			}

			// Check CamelCase links
			if(nodeType === "CamelCaseLink" && isRuleEnabled("missingLinks")) {
				if(isCamelCaseEnabled() && !tiddlerExists(text)) {
					diagnostics.push({
						from: from,
						to: to,
						severity: "warning",
						message: "CamelCase link to missing tiddler: " + text,
						source: "tiddlywiki"
					});
				}
			}

			// Check transclusion targets
			if(nodeType === "TransclusionTarget" && isRuleEnabled("missingLinks")) {
				var tiddlerName = text;
				var sepIdx = text.indexOf("!!");
				if(sepIdx === -1) sepIdx = text.indexOf("##");
				if(sepIdx > 0) {
					tiddlerName = text.substring(0, sepIdx);
				}
				if(tiddlerName && !tiddlerExists(tiddlerName)) {
					diagnostics.push({
						from: from,
						to: to,
						severity: "warning",
						message: "Transclusion of missing tiddler: " + tiddlerName,
						source: "tiddlywiki"
					});
				}
			}

			// Check macro calls
			if(nodeType === "MacroName" && isRuleEnabled("undefinedMacros")) {
				var macroName = text.trim();
				// Check global definitions first (macros, procedures, functions)
				// Also check widget tree scope (variables from parent widgets wrapping the editor)
				// Note: localDefs.variables is NOT checked here because those are scoped variables
				// that must be validated via getVariablesInScope and getCallSiteReachableScope
				var isGloballyDefined = isDefinitionKnown(macroName, "any") ||
					localDefs.macros.has(macroName) ||
					localDefs.procedures.has(macroName) ||
					localDefs.functions.has(macroName) ||
					builtInVariables.has(macroName) ||
					widgetScopeVars.has(macroName);

				if(!isGloballyDefined) {
					// Check scope-aware variable detection
					// Get the actual SyntaxNode for parent traversal
					var syntaxNode = node.node;
					var scopeVars = getVariablesInScope(syntaxNode, docText);
					var isInScope = isVarInScope(macroName, scopeVars);

					// If not in direct scope, check call-site reachable scope (dynamic scoping)
					if(!isInScope) {
						var containingDef = callAnalysis.getDefinitionAtPosition(from);
						if(containingDef) {
							var reachableScope = getCallSiteReachableScope(containingDef, callAnalysis);
							isInScope = isVarInScope(macroName, reachableScope);
						}
					}

					if(!isInScope) {
						diagnostics.push({
							from: from,
							to: to,
							severity: "info",
							message: "Possibly undefined or out-of-scope variable / macro / procedure / function: " + macroName,
							source: "tiddlywiki"
						});
					}
				}
			}

			// Check filter variable references <varName>
			if(nodeType === "FilterVariable" && isRuleEnabled("undefinedMacros")) {
				// FilterVariable includes the angle brackets, extract the name
				var varName = text.replace(/^<|>$/g, "").trim();
				if(varName) {
					// Check global definitions first, plus widget tree scope
					// Note: localDefs.variables is NOT checked here because those are scoped variables
					// that must be validated via getVariablesInScope and getCallSiteReachableScope
					var isGloballyDefined = isDefinitionKnown(varName, "any") ||
						localDefs.macros.has(varName) ||
						localDefs.procedures.has(varName) ||
						localDefs.functions.has(varName) ||
						builtInVariables.has(varName) ||
						widgetScopeVars.has(varName);

					if(!isGloballyDefined) {
						// Check scope-aware variable detection
						var syntaxNode = node.node;
						var scopeVars = getVariablesInScope(syntaxNode, docText);
						var isInScope = isVarInScope(varName, scopeVars);

						// If not in direct scope, check call-site reachable scope (dynamic scoping)
						if(!isInScope) {
							var containingDef = callAnalysis.getDefinitionAtPosition(from);
							if(containingDef) {
								var reachableScope = getCallSiteReachableScope(containingDef, callAnalysis);
								isInScope = isVarInScope(varName, reachableScope);
							}
						}

						if(!isInScope) {
							diagnostics.push({
								from: from,
								to: to,
								severity: "info",
								message: "Possibly undefined or out-of-scope variable in filter: " + varName,
								source: "tiddlywiki"
							});
						}
					}
				}
			}

			// Check $(variable)$ substitution references
			// Note: $(variable)$ syntax is ONLY valid inside \define blocks OR substituted attributes
			if(nodeType === "VariableName" && isRuleEnabled("undefinedMacros")) {
				// Check if parent is a Variable node ($(variable)$ syntax)
				var parentNode = node.node.parent;
				if(parentNode && parentNode.type.name === "Variable") {
					// First, check if we're inside a substituted attribute (backticks)
					// $(variable)$ is ALWAYS valid inside attr=`...` because it's processed
					// by the widget at render time, not by macro substitution
					var insideSubstitutedAttr = false;
					var attrCheckParent = node.node.parent;
					while(attrCheckParent) {
						if(attrCheckParent.type.name === "AttributeSubstituted") {
							insideSubstitutedAttr = true;
							break;
						}
						// Don't check beyond the attribute level
						if(attrCheckParent.type.name === "Attribute") {
							break;
						}
						attrCheckParent = attrCheckParent.parent;
					}

					// Skip the \define check if inside substituted attribute
					if(!insideSubstitutedAttr) {
						// Check if we're inside a \define block
						// $(variable)$ is only valid in \define, not \procedure, \function, \widget
						var containingDefine = null;
						var invalidContext = null;
						var checkParent = node.node.parent;
						while(checkParent) {
							if(checkParent.type.name === "MacroDefinition") {
								containingDefine = checkParent;
								break;
							}
							// If inside \procedure, \function, or \widget - that's invalid
							if(checkParent.type.name === "ProcedureDefinition") {
								invalidContext = "\\procedure";
								break;
							}
							if(checkParent.type.name === "FunctionDefinition") {
								invalidContext = "\\function";
								break;
							}
							if(checkParent.type.name === "WidgetDefinition") {
								invalidContext = "\\widget";
								break;
							}
							checkParent = checkParent.parent;
						}

						// Warn if $(variable)$ is used outside \define (and not in substituted attr)
						if(!containingDefine) {
							var message = invalidContext ?
								"$(variable)$ substitution is not valid in " + invalidContext + " (only in \\define)" :
								"$(variable)$ substitution is only valid inside \\define macros";
							diagnostics.push({
								from: parentNode.from,
								to: parentNode.to,
								severity: "warning",
								message: message,
								source: "tiddlywiki"
							});
							// Skip further checks for this node (return from iterate callback)
							return;
						}
					}

					var varName = text.trim();
					if(varName) {
						// Check global definitions first, plus widget tree scope
						// Note: localDefs.variables is NOT checked here because those are scoped variables
						// that must be validated via getVariablesInScope and getCallSiteReachableScope
						var isGloballyDefined = isDefinitionKnown(varName, "any") ||
							localDefs.macros.has(varName) ||
							localDefs.procedures.has(varName) ||
							localDefs.functions.has(varName) ||
							builtInVariables.has(varName) ||
							widgetScopeVars.has(varName);

						if(!isGloballyDefined) {
							// Check scope-aware variable detection
							var syntaxNode = node.node;
							var scopeVars = getVariablesInScope(syntaxNode, docText);
							var isInScope = isVarInScope(varName, scopeVars);

							// If not in direct scope, check call-site reachable scope (dynamic scoping)
							// $(variable)$ looks back through the call chain for scope
							if(!isInScope) {
								var containingDef = callAnalysis.getDefinitionAtPosition(from);
								if(containingDef) {
									var reachableScope = getCallSiteReachableScope(containingDef, callAnalysis);
									isInScope = isVarInScope(varName, reachableScope);
								}
							}

							if(!isInScope) {
								diagnostics.push({
									from: from,
									to: to,
									severity: "info",
									message: "Possibly undefined or out-of-scope variable substitution: " + varName,
									source: "tiddlywiki"
								});
							}
						}
					}
				}
			}

			// Check $param$ placeholders in \define macros
			if(nodeType === "Placeholder" && isRuleEnabled("undefinedMacros")) {
				// Find the VariableName child to get the parameter name
				var paramName = null;
				var cursor = node.node.cursor();
				if(cursor.firstChild()) {
					do {
						if(cursor.name === "VariableName") {
							paramName = state.doc.sliceString(cursor.from, cursor.to);
							break;
						}
					} while(cursor.nextSibling());
				}

				if(paramName) {
					// Find the containing MacroDefinition (if any)
					var containingMacro = null;
					var parent = node.node.parent;
					while(parent) {
						if(parent.type.name === "MacroDefinition") {
							containingMacro = parent;
							break;
						}
						// Stop at other definition types - $param$ is only valid in \define
						if(parent.type.name === "ProcedureDefinition" ||
							parent.type.name === "FunctionDefinition" ||
							parent.type.name === "WidgetDefinition") {
							break;
						}
						parent = parent.parent;
					}

					if(containingMacro) {
						// Extract valid parameters from the containing macro
						var validParams = extractPragmaScopeVariables(containingMacro, docText);
						var validParamsSet = new Set(validParams);

						// Check if the placeholder name is valid
						if(!validParamsSet.has(paramName) && !builtInVariables.has(paramName)) {
							diagnostics.push({
								from: from,
								to: to,
								severity: "error",
								message: "Unknown parameter \"$" + paramName + "$\". Available: " +
									(validParams.length > 0 ? validParams.join(", ") : "(none)"),
								source: "tiddlywiki"
							});
						}
					} else {
						// $param$ used outside of \define - this is invalid
						diagnostics.push({
							from: from,
							to: to,
							severity: "error",
							message: "Placeholder \"$" + paramName + "$\" can only be used inside \\define macros",
							source: "tiddlywiki"
						});
					}
				}
			}

			// Check widget names
			if(nodeType === "WidgetName" && isRuleEnabled("unknownWidgets")) {
				var widgetName = text;
				// Normalize to check both with and without $ prefix
				var widgetWithDollar = widgetName.startsWith("$") ? widgetName : "$" + widgetName;
				var widgetWithoutDollar = widgetName.startsWith("$") ? widgetName.substring(1) : widgetName;

				// Check global definitions (already handles normalization)
				var isKnown = isDefinitionKnown(widgetName, "widget");

				// Check local definitions (might be stored with or without $)
				var isLocallyDefined = localDefs.widgets.has(widgetName) ||
					localDefs.widgets.has(widgetWithDollar) ||
					localDefs.widgets.has(widgetWithoutDollar);

				if(!isKnown && !isLocallyDefined) {
					diagnostics.push({
						from: from,
						to: to,
						severity: "info",
						message: "Undefined widget '" + widgetWithoutDollar + "'",
						source: "tiddlywiki"
					});
				}

				// Check $macrocall $name and $transclude $variable for undefined macros/variables
				if(isRuleEnabled("undefinedMacros") && (widgetName.toLowerCase() === "$macrocall" || widgetName.toLowerCase() === "$transclude")) {
					var isMacrocall = widgetName.toLowerCase() === "$macrocall";
					var attrToFind = isMacrocall ? "\\$name" : "\\$variable";

					// Find the parent widget node and extract attributes
					var widgetNode = node.node.parent;
					if(widgetNode) {
						var cursor = widgetNode.cursor();
						cursor.firstChild();
						var firstAttrStart = -1;
						var lastAttrEnd = -1;
						var attrNode = null;
						do {
							if(cursor.name === "Attribute") {
								if(firstAttrStart === -1) firstAttrStart = cursor.from;
								lastAttrEnd = cursor.to;
								// Check if this is the $name or $variable attribute
								var attrText = docText.slice(cursor.from, cursor.to);
								var attrNameMatch = isMacrocall ?
									/^\s*\$name\s*=/i.test(attrText) :
									/^\s*\$variable\s*=/i.test(attrText);
								if(attrNameMatch) {
									attrNode = {
										from: cursor.from,
										to: cursor.to
									};
								}
							}
						} while(cursor.nextSibling());

						if(firstAttrStart !== -1 && attrNode) {
							var attrs = docText.slice(firstAttrStart, lastAttrEnd);
							var calledName = extractAttrValue(attrs, attrToFind);

							if(calledName) {
								// Check if the macro/variable is defined
								var isDefined = isDefinitionKnown(calledName, "any") ||
									localDefs.macros.has(calledName) ||
									localDefs.procedures.has(calledName) ||
									localDefs.functions.has(calledName) ||
									builtInVariables.has(calledName) ||
									widgetScopeVars.has(calledName);

								if(!isDefined) {
									// Check scope-aware variable detection
									var syntaxNode = node.node;
									var scopeVars = getVariablesInScope(syntaxNode, docText);
									var isInScope = isVarInScope(calledName, scopeVars);

									// If not in direct scope, check call-site reachable scope (dynamic scoping)
									if(!isInScope) {
										var containingDef = callAnalysis.getDefinitionAtPosition(from);
										if(containingDef) {
											var reachableScope = getCallSiteReachableScope(containingDef, callAnalysis);
											isInScope = isVarInScope(calledName, reachableScope);
										}
									}

									if(!isInScope) {
										// Find the actual attribute value position for better error location
										var msgType = isMacrocall ? "macro/procedure/function" : "variable";
										diagnostics.push({
											from: attrNode.from,
											to: attrNode.to,
											severity: "info",
											message: "Possibly undefined " + msgType + ": " + calledName,
											source: "tiddlywiki"
										});
									}
								}
							}
						}
					}
				}
			}

			// Check for InvalidWidget nodes (<$ followed by space - invalid widget syntax)
			if(nodeType === "InvalidWidget" && isRuleEnabled("unknownWidgets")) {
				diagnostics.push({
					from: from,
					to: to,
					severity: "info",
					message: "Undefined widget ''",
					source: "tiddlywiki"
				});
			}

			// Check filter expressions for bracket issues
			if(nodeType === "FilterExpression" && isRuleEnabled("filterSyntax")) {
				var filterIssues = checkFilterBrackets(text, from);
				// Insert closing bracket at end of actual content (before trailing whitespace)
				var trimmedLength = text.trimEnd().length;
				var filterEnd = from + trimmedLength;
				filterIssues.forEach(function(issue) {
					// Determine the closing bracket based on the message
					var closingBracket = null;
					if(issue.message.indexOf("'['") !== -1) {
						closingBracket = "]";
					} else if(issue.message.indexOf("'{'") !== -1) {
						closingBracket = "}";
					} else if(issue.message.indexOf("'<'") !== -1) {
						closingBracket = ">";
					}

					var actions = [];
					if(closingBracket) {
						(function(bracket, endPos) {
							actions.push({
								name: "Add closing '" + bracket + "'",
								apply: function(view, _from, _to) {
									view.dispatch({
										changes: {
											from: endPos,
											to: endPos,
											insert: bracket
										}
									});
								}
							});
						})(closingBracket, filterEnd);
					}

					diagnostics.push({
						from: issue.pos,
						to: issue.pos + 1,
						severity: "error",
						message: issue.message,
						source: "tiddlywiki",
						actions: actions
					});
				});
			}
		}
	});

	// ========================================
	// Empty Filter Operators (with quick-fix)
	// ========================================

	if(isRuleEnabled("filterSyntax")) {
		var emptyOps = findEmptyFilterOperators(tree, state);
		emptyOps.forEach(function(issue) {
			diagnostics.push({
				from: issue.from,
				to: issue.to,
				severity: "warning",
				message: issue.message,
				source: "tiddlywiki",
				actions: [{
					name: "Remove empty operator",
					apply: function(view, from, to) {
						view.dispatch({
							changes: {
								from: from,
								to: to,
								insert: ""
							}
						});
					}
				}]
			});
		});
	}

	// ========================================
	// Unknown Filter Operators/Functions
	// ========================================

	if(isRuleEnabled("filterSyntax")) {
		var knownOperators = _getKnownFilterOperators();
		tree.iterate({
			enter: function(node) {
				if(node.type.name === "FilterOperatorName") {
					var opName = docText.slice(node.from, node.to).trim();
					// Skip empty names
					if(!opName) return;
					// Skip negation prefix
					if(opName.startsWith("!")) {
						opName = opName.substring(1);
					}
					// Strip suffixes (e.g., search:all:anchored -> search)
					// Suffixes are flags/modifiers after the base operator name
					var colonIndex = opName.indexOf(":");
					if(colonIndex > 0) {
						opName = opName.substring(0, colonIndex);
					}
					// Skip if it's a known filter operator
					if(knownOperators.has(opName)) return;
					// Skip if it's a known function (globally defined)
					if(isDefinitionKnown(opName, "any")) return;
					// Skip if it's a locally defined function
					if(localDefs.functions.has(opName)) return;
					// Unknown operator/function
					diagnostics.push({
						from: node.from,
						to: node.to,
						severity: "warning",
						message: "Unknown filter operator or function: " + opName,
						source: "tiddlywiki"
					});
				}
			}
		});
	}

	// ========================================
	// Unclosed Widgets (with quick-fix)
	// ========================================

	if(isRuleEnabled("unclosedWidgets")) {
		var widgetIssues = findUnclosedWidgets(tree, state);
		widgetIssues.forEach(function(issue) {
			var tagName = issue.name || "";
			var isHTML = issue.isHTML;
			var closeTag = isHTML ? "</" + tagName + ">" : "</" + tagName + ">";
			var insertAt = issue.insertAt;
			var insertType = issue.insertType;

			// Create actions with captured values
			var actions = [];

			// Handle orphan closing tags (extra closing tags without matching opening)
			if(issue.isOrphanClose) {
				actions.push({
					name: "Remove closing tag",
					apply: function(view, from, to) {
						var docLength = view.state.doc.length;
						var line = view.state.doc.lineAt(from);
						var lineText = view.state.doc.sliceString(line.from, line.to);

						// Check if the tag is the only non-whitespace content on the line
						var tagText = view.state.doc.sliceString(from, to);
						var textWithoutTag = lineText.replace(tagText, "");
						var isOnlyContentOnLine = textWithoutTag.trim() === "";

						var removeFrom = from;
						var removeTo = to;

						if(isOnlyContentOnLine) {
							// Tag is alone on line - remove the whole line including newline
							removeFrom = line.from;
							removeTo = Math.min(line.to + 1, docLength);
							// If this is the last line (no newline after), also remove preceding newline if exists
							if(line.to === docLength && line.from > 0) {
								removeFrom = line.from - 1; // Include preceding newline
							}
						}
						// Otherwise just remove the tag itself (from, to)

						view.dispatch({
							changes: {
								from: removeFrom,
								to: removeTo,
								insert: ""
							}
						});
					}
				});

				diagnostics.push({
					from: issue.from,
					to: issue.to,
					severity: "error",
					message: issue.message,
					source: "tiddlywiki",
					actions: actions
				});
				return; // Skip the normal unclosed tag handling
			}

			if(tagName) {
				(function(name, tag, pos, type, html) {
					// Describe where it will be inserted based on insertType
					var actionName = "Add " + tag;
					if(type === "emptyLine") {
						actionName = "Add " + tag + " (at empty line)";
					} else if(type === "beforeTag") {
						actionName = "Add " + tag + " (before next tag)";
					} else if(type === "containerEnd") {
						actionName = "Add " + tag + " (before container end)";
					}
					// "docEnd" just uses the default "Add <tag>"

					actions.push({
						name: actionName,
						apply: function(view, _from, _to) {
							view.dispatch({
								changes: {
									from: pos,
									to: pos,
									insert: tag + "\n"
								}
							});
						}
					});

					// Only add "Make self-closing" for widgets, not HTML tags
					if(!html) {
						actions.push({
							name: "Make self-closing",
							apply: function(view, _from, _to) {
								// Find the > that closes the tag (not inside quoted attributes)
								// Also track bracket stack for unclosed filters
								var text = view.state.doc.sliceString(_from, _to);
								var closePos = -1;
								var inQuote = null;
								var bracketStack = []; // Track [, {, < that need closing
								var closingChars = {
									"[": "]",
									"{": "}",
									"<": ">"
								};
								for(var i = 0; i < text.length; i++) {
									var ch = text[i];
									if(inQuote) {
										if(ch === inQuote) {
											inQuote = null;
										} else if(ch === "[" || ch === "{" || ch === "<") {
											bracketStack.push(ch);
										} else if(ch === "]" || ch === "}" || ch === ">") {
											// Pop matching bracket from stack
											if(bracketStack.length > 0) {
												var last = bracketStack[bracketStack.length - 1];
												if(closingChars[last] === ch) {
													bracketStack.pop();
												}
											}
										}
									} else {
										if(ch === '"' || ch === "'") {
											inQuote = ch;
										} else if(ch === ">") {
											closePos = i;
										}
									}
								}
								if(closePos !== -1) {
									// Found closing >, insert / before it
									var insertPos = _from + closePos;
									view.dispatch({
										changes: {
											from: insertPos,
											to: insertPos,
											insert: "/"
										}
									});
								} else {
									// No closing > found, need to add it
									// Build the insert string: close brackets in reverse order, close quote, self-close tag
									var insert = "";
									if(inQuote) {
										// Add missing closing brackets in reverse order
										for(var j = bracketStack.length - 1; j >= 0; j--) {
											insert += closingChars[bracketStack[j]];
										}
										insert += inQuote + "/>";
									} else {
										insert = "/>";
									}
									view.dispatch({
										changes: {
											from: _to,
											to: _to,
											insert: insert
										}
									});
								}
							}
						});
					}
				})(tagName, closeTag, insertAt, insertType, isHTML);
			}

			diagnostics.push({
				from: issue.from,
				to: issue.to,
				severity: "warning",
				message: issue.message,
				source: "tiddlywiki",
				actions: actions
			});
		});
	}

	// ========================================
	// Unclosed Pragmas (with quick-fix)
	// ========================================

	if(isRuleEnabled("unclosedPragmas")) {
		var pragmaIssues = findUnclosedPragmas(docText, 0);
		// Filter out issues that are inside attribute values (e.g., src='...\end...')
		// These are wikitext strings that will be processed later, not actual pragmas
		pragmaIssues = pragmaIssues.filter(function(issue) {
			return !isInsideAttributeValue(tree, issue.from);
		});
		pragmaIssues.forEach(function(issue) {
			var isAmbiguous = issue.message.startsWith("Ambiguous");
			var isBareEndHint = issue.message.startsWith("Bare \\end");
			var pragmaName = issue.pragmaName || "";
			var insertAt = issue.insertEndAt; // Position to insert \end (before parent's \end)

			var actions = [];
			if((isAmbiguous || isBareEndHint) && issue.suggestedName) {
				// Quick-fix: add the name to the bare \end
				(function(name) {
					actions.push({
						name: "Use \\end " + name,
						apply: function(view, from, to) {
							view.dispatch({
								changes: {
									from: to,
									to: to,
									insert: " " + name
								}
							});
						}
					});
				})(issue.suggestedName);
			}

			if(!isAmbiguous && !isBareEndHint && pragmaName) {
				// Use IIFE to capture insertAt value
				(function(targetPos, name) {
					if(typeof targetPos === "number") {
						// Insert before parent's \end
						actions.push({
							name: "Add \\end " + name + " (before parent)",
							apply: function(view, _from, _to) {
								view.dispatch({
									changes: {
										from: targetPos,
										to: targetPos,
										insert: "\\end " + name + "\n"
									}
								});
							}
						});
					} else {
						// No specific position - insert at document end
						actions.push({
							name: "Add \\end " + name,
							apply: function(view, _from, _to) {
								var docLength = view.state.doc.length;
								view.dispatch({
									changes: {
										from: docLength,
										to: docLength,
										insert: "\n\\end " + name + "\n"
									}
								});
							}
						});
					}
					actions.push({
						name: "Add \\end",
						apply: function(view, _from, _to) {
							var pos = typeof targetPos === "number" ? targetPos : view.state.doc.length;
							var prefix = typeof targetPos === "number" ? "" : "\n";
							view.dispatch({
								changes: {
									from: pos,
									to: pos,
									insert: prefix + "\\end\n"
								}
							});
						}
					});
				})(insertAt, pragmaName);
			}

			// Determine severity: hint for "Bare \end" suggestions, warning for others
			var severity = issue.isHint ? "hint" : "warning";
			// Unexpected/unmatched \end is an error
			if(issue.message.startsWith("Unexpected") || issue.message.startsWith("Unmatched")) {
				severity = "error";
			}

			diagnostics.push({
				from: issue.from,
				to: issue.to,
				severity: severity,
				message: issue.message,
				source: "tiddlywiki",
				actions: actions
			});
		});
	}

	// ========================================
	// Misplaced Pragmas (after content)
	// ========================================

	if(isRuleEnabled("misplacedPragmas")) {
		var misplacedIssues = findMisplacedPragmas(docText, 0);
		misplacedIssues.forEach(function(issue) {
			var actionName = issue.containingPragma ?
				"Move to top of \\" + issue.containingPragma.type + " " + issue.containingPragma.name :
				"Move to top of tiddler";
			// Capture the insertion position (body start of containing pragma, or 0 for document root)
			var insertPos = issue.containingPragma ? issue.containingPragma.bodyStartPos : 0;
			diagnostics.push({
				from: issue.from,
				to: issue.to,
				severity: "error",
				message: issue.message,
				source: "tiddlywiki",
				actions: [{
					name: actionName,
					apply: (function(targetPos) {
						return function(view, from, _to) {
							var docLength = view.state.doc.length;
							var startLine = view.state.doc.lineAt(from);
							var pragmaStart = startLine.from;
							var pragmaEnd = startLine.to;

							// Check if this is a multi-line pragma that needs \end
							var firstLineText = view.state.doc.sliceString(startLine.from, startLine.to);
							var multiLineMatch = firstLineText.match(/^\\(define|procedure|function|widget)\s+[^\s(]+(\([^)]*\))?\s*$/);

							if(multiLineMatch) {
								// Multi-line pragma - find the matching \end
								var searchStart = startLine.to + 1;
								var depth = 1;
								var pos = searchStart;

								// Search for matching \end, handling nested pragmas
								while(pos < docLength && depth > 0) {
									var line = view.state.doc.lineAt(pos);
									var lineText = view.state.doc.sliceString(line.from, line.to).trim();

									// Check for nested pragma open
									if(/^\\(define|procedure|function|widget)\s+\S+/.test(lineText) &&
										!/^\\(define|procedure|function|widget)\s+[^\s(]+(\([^)]*\))?\s+\S/.test(lineText)) {
										depth++;
									}
									// Check for \end
									else if(/^\\end\b/.test(lineText)) {
										depth--;
										if(depth === 0) {
											pragmaEnd = line.to;
										}
									}

									pos = line.to + 1;
									if(pos > docLength) break;
								}
							}

							// Get the full pragma text
							var pragmaText = view.state.doc.sliceString(pragmaStart, pragmaEnd);

							// Check if this is at the end of document (no trailing newline)
							var deleteEnd = Math.min(pragmaEnd + 1, docLength);
							var hasTrailingNewline = pragmaEnd + 1 <= docLength;

							// Calculate adjusted insert position if removal happens before it
							var adjustedInsertPos = targetPos;
							var deleteStart = pragmaStart;

							// If removing from end without trailing newline, remove preceding newline
							if(!hasTrailingNewline && deleteStart > 0) {
								deleteStart = deleteStart - 1;
							}

							if(deleteStart < targetPos) {
								// Removal is before insert point, adjust for removed length
								adjustedInsertPos = targetPos - (deleteEnd - deleteStart);
							}

							// Remove from current position and insert at target position
							view.dispatch({
								changes: [{
										from: deleteStart,
										to: deleteEnd,
										insert: ""
									},
									{
										from: adjustedInsertPos,
										to: adjustedInsertPos,
										insert: pragmaText + "\n"
									}
								]
							});
						};
					})(insertPos)
				}]
			});
		});
	}

	// ========================================
	// Unclosed Conditionals (with quick-fix)
	// ========================================

	if(isRuleEnabled("unclosedConditionals")) {
		var condIssues = findUnclosedConditionals(tree, state);
		// Filter out issues inside attribute values (they are isolated parsing contexts)
		condIssues = condIssues.filter(function(issue) {
			return !isInsideAttributeValue(tree, issue.from);
		});
		condIssues.forEach(function(issue) {
			var insertAt = issue.insertAt;
			var insertType = issue.insertType;

			var actions = [];
			// Only add quick-fix for unclosed <%if, not for unexpected <%endif
			if(typeof insertAt === "number") {
				// Use IIFE to capture values
				(function(pos, type) {
					// Describe where it will be inserted based on insertType
					var actionName = "Add <%endif%>";
					if(type === "emptyLine") {
						actionName = "Add <%endif%> (at empty line)";
					} else if(type === "beforeTag") {
						actionName = "Add <%endif%> (before next tag)";
					} else if(type === "containerEnd") {
						actionName = "Add <%endif%> (before container end)";
					}

					actions.push({
						name: actionName,
						apply: function(view, _from, _to) {
							view.dispatch({
								changes: {
									from: pos,
									to: pos,
									insert: "<%endif%>\n"
								}
							});
						}
					});
				})(insertAt, insertType);
			}

			diagnostics.push({
				from: issue.from,
				to: issue.to,
				severity: "error",
				message: issue.message,
				source: "tiddlywiki",
				actions: actions
			});
		});
	}

	// ========================================
	// Unclosed Code Blocks (with quick-fix)
	// ========================================

	if(isRuleEnabled("unclosedCodeBlocks")) {
		var codeIssues = findUnclosedCodeBlocks(state);
		codeIssues.forEach(function(issue) {
			var marker = issue.marker || "```";
			var insertAt = issue.insertAt;
			var insertType = issue.insertType;

			var actions = [];
			// Use IIFE to capture values
			(function(m, pos, type) {
				var actionName = "Add closing " + m;
				if(type === "emptyLine") {
					actionName = "Add " + m + " (at empty line)";
				}

				actions.push({
					name: actionName,
					apply: function(view, _from, _to) {
						view.dispatch({
							changes: {
								from: pos,
								to: pos,
								insert: m + "\n"
							}
						});
					}
				});
			})(marker, insertAt, insertType);

			diagnostics.push({
				from: issue.from,
				to: issue.to,
				severity: "error",
				message: issue.message,
				source: "tiddlywiki",
				actions: actions
			});
		});
	}

	// ========================================
	// Incomplete Tags (missing closing >)
	// ========================================

	if(isRuleEnabled("incompleteTags")) {
		tree.iterate({
			enter: function(node) {
				var nodeType = node.type.name;
				if(nodeType === "IncompleteWidget" ||
					nodeType === "IncompleteHTMLTag" ||
					nodeType === "IncompleteHTMLBlock") {
					// Find the tag name for a better error message
					var tagName = "";
					var cursor = node.node.cursor();
					if(cursor.firstChild()) {
						do {
							if(cursor.name === "WidgetName" || cursor.name === "TagName") {
								tagName = state.doc.sliceString(cursor.from, cursor.to);
								break;
							}
						} while(cursor.nextSibling());
					}

					var isWidget = nodeType === "IncompleteWidget";
					var message = isWidget ?
						"Incomplete widget: <" + tagName + " is missing closing '>'" :
						"Incomplete HTML tag: <" + tagName + " is missing closing '>'";

					// Build actions for completing the tag
					var actions = [];
					var nodeEnd = node.to;
					var textAfterNode = state.doc.sliceString(nodeEnd, state.doc.length);

					// Check if this is a self-closing tag type
					var isSelfClosingType = isSelfClosingTag(tagName, isWidget);

					// Check if there's already a matching closing tag in the document
					var hasExistingClose = hasMatchingClosingTag(textAfterNode, tagName, isWidget);

					if(isSelfClosingType) {
						// Self-closing tags: offer to make self-closing
						actions.push({
							name: "Make self-closing",
							apply: function(view, from, to) {
								view.dispatch({
									changes: {
										from: to,
										to: to,
										insert: "/>"
									}
								});
							}
						});
					} else if(hasExistingClose) {
						// Has matching closing tag: just add >
						actions.push({
							name: "Add closing '>'",
							apply: function(view, from, to) {
								view.dispatch({
									changes: {
										from: to,
										to: to,
										insert: ">"
									}
								});
							}
						});
					} else {
						// No matching closing tag: add > and closing tag
						var closingTagText = "</" + tagName + ">";
						actions.push({
							name: "Complete tag",
							apply: function(view, from, to) {
								view.dispatch({
									changes: {
										from: to,
										to: to,
										insert: ">" + closingTagText
									},
									selection: {
										anchor: to + 1
									}
								});
							}
						});
						// Also offer just adding > in case user wants to add closing tag elsewhere
						actions.push({
							name: "Add '>' only",
							apply: function(view, from, to) {
								view.dispatch({
									changes: {
										from: to,
										to: to,
										insert: ">"
									}
								});
							}
						});
					}

					// For widgets, always offer make self-closing as alternative
					if(isWidget && !isSelfClosingType) {
						actions.push({
							name: "Make self-closing",
							apply: function(view, from, to) {
								view.dispatch({
									changes: {
										from: to,
										to: to,
										insert: "/>"
									}
								});
							}
						});
					}

					diagnostics.push({
						from: node.from,
						to: node.to,
						severity: "error",
						message: message,
						source: "tiddlywiki",
						actions: actions
					});
				}
			}
		});
	}

	// ========================================
	// Duplicate Definitions
	// ========================================

	if(isRuleEnabled("duplicateDefinitions")) {
		var defsWithPos = extractLocalDefinitionsWithPositions(docText);
		var duplicateIssues = findDuplicateDefinitions(defsWithPos);
		duplicateIssues.forEach(function(issue) {
			diagnostics.push({
				from: issue.from,
				to: issue.to,
				severity: "warning",
				message: issue.message,
				source: "tiddlywiki"
			});
		});
	}

	// ========================================
	// Unused Definitions
	// ========================================

	if(isRuleEnabled("unusedDefinitions")) {
		var defsWithPos = extractLocalDefinitionsWithPositions(docText);
		var usages = findDefinitionUsages(docText);
		var unusedIssues = findUnusedDefinitions(defsWithPos, usages);
		unusedIssues.forEach(function(issue) {
			// Capture values in IIFE to ensure closure works correctly
			(function(defFrom, defTo) {
				diagnostics.push({
					from: issue.from,
					to: issue.to,
					severity: "hint",
					message: issue.message,
					source: "tiddlywiki",
					actions: [{
						name: "Remove definition",
						apply: function(view, _from, _to) {
							// Find the full pragma block and remove it
							var docLength = view.state.doc.length;
							var startLine = view.state.doc.lineAt(defFrom);
							var endLine = startLine;

							// Check if this is a multi-line pragma (ends with just the pragma name, no body on same line)
							var startLineText = view.state.doc.sliceString(startLine.from, startLine.to);
							var isMultiLine = /^\\(define|procedure|function|widget)\s+[^\s(]+(\([^)]*\))?\s*$/.test(startLineText);

							if(isMultiLine) {
								// Find the matching \end, handling nested pragmas
								var depth = 1;
								var pos = startLine.to + 1;
								while(pos < docLength && depth > 0) {
									var line = view.state.doc.lineAt(pos);
									var lineText = view.state.doc.sliceString(line.from, line.to).trim();

									// Check for nested pragma open
									if(/^\\(define|procedure|function|widget)\s+\S+/.test(lineText) &&
										!/^\\(define|procedure|function|widget)\s+[^\s(]+(\([^)]*\))?\s+\S/.test(lineText)) {
										depth++;
									}
									// Check for \end
									else if(/^\\end\b/.test(lineText)) {
										depth--;
										if(depth === 0) {
											endLine = line;
										}
									}

									pos = line.to + 1;
								}
							}

							// Calculate deletion range
							var deleteFrom = startLine.from;
							var deleteTo = Math.min(endLine.to + 1, docLength);

							// If this is the last line with no newline, remove preceding newline instead
							if(endLine.to === docLength && deleteFrom > 0) {
								deleteFrom = startLine.from - 1;
								deleteTo = docLength;
							}

							view.dispatch({
								changes: {
									from: deleteFrom,
									to: deleteTo,
									insert: ""
								}
							});
						}
					}]
				});
			})(issue.defFrom, issue.defTo);
		});
	}

	// ========================================
	// Invalid Tag References
	// ========================================

	if(isRuleEnabled("invalidTags")) {
		var tagIssues = findInvalidTagReferences(tree, state);
		tagIssues.forEach(function(issue) {
			diagnostics.push({
				from: issue.from,
				to: issue.to,
				severity: "warning",
				message: "Unknown tag in " + issue.operatorName + "[]: " + issue.tagName,
				source: "tiddlywiki"
			});
		});
	}

	return diagnostics;
}

// ============================================================================
// Plugin Definition
// ============================================================================

/**
 * Check if linting is globally enabled
 * @param {object} wiki - The wiki object (defaults to $tw.wiki)
 */
function isLintEnabled(wiki) {
	wiki = wiki || $tw.wiki;
	if(wiki) {
		var enabled = (wiki.getTiddlerText("$:/config/codemirror-6/lint/enabled", "yes") || "").trim();
		return enabled === "yes";
	}
	return true;
}

/**
 * Check if linting is disabled for a specific tiddler
 * @param {string} tiddlerTitle - The tiddler title
 * @param {object} wiki - The wiki object (defaults to $tw.wiki)
 */
function isLintDisabledForTiddler(tiddlerTitle, wiki) {
	wiki = wiki || $tw.wiki;
	if(!wiki || !tiddlerTitle) return false;
	// Check for per-tiddler disable via temp tiddler
	return wiki.tiddlerExists("$:/temp/codemirror-6/lint-disabled/" + tiddlerTitle);
}

/**
 * Create a linter function with widget context
 * @param {object} widget - The TiddlyWiki widget containing the editor
 * @returns {function} Linter function for CodeMirror
 */
function createLinterWithContext(widget) {
	// Extract widget tree variables once and cache them
	var widgetScopeVars = extractWidgetTreeVariables(widget);

	return function(view) {
		return createTiddlyWikiLinter(view, widgetScopeVars);
	};
}

/**
 * Build lint extensions array
 */
function buildLintExtensions(core, context) {
	var extensions = [];

	// Get widget from engine for widget tree scope detection
	var widget = context.engine && context.engine.widget;

	// Add linter with widget context
	extensions.push(_linter(createLinterWithContext(widget), {
		delay: 750 // Debounce linting by 750ms
	}));

	// Add gutter with lint markers
	if(_lintGutter && context.options.lintGutter !== false) {
		extensions.push(_lintGutter());
	}

	// Add keyboard shortcuts for navigating lint issues
	if(_lintKeymap && core.view && core.view.keymap) {
		extensions.push(core.view.keymap.of(_lintKeymap));
	}

	return extensions;
}

exports.plugin = {
	name: "lint",
	description: "Highlight potential issues in TiddlyWiki content",
	priority: 300,

	// Only check content type - config-based toggling is handled via compartment
	condition: function(context) {
		// Disabled by default in simple editors (inputs/textareas)
		if(context.isSimpleEditor) {
			return false;
		}
		var type = context.tiddlerType;
		if(context.options.lint === false) return false;
		return !type || type === "" || type === "text/vnd.tiddlywiki" || type === "text/x-tiddlywiki";
	},

	// Register compartment for dynamic enable/disable
	registerCompartments: function() {
		if(!_Compartment) return {};
		return {
			lint: new _Compartment()
		};
	},

	init: function(cm6Core) {
		this._core = cm6Core;
		// Store Compartment constructor
		if(cm6Core.state && cm6Core.state.Compartment) {
			_Compartment = cm6Core.state.Compartment;
		}
		// Store syntaxTree function
		if(cm6Core.language && cm6Core.language.syntaxTree) {
			_syntaxTree = cm6Core.language.syntaxTree;
		}
	},

	getExtensions: function(context) {
		if(!_linter || !_syntaxTree) return [];

		// Get compartment from engine (not module-level variable)
		var compartment = context.engine && context.engine._compartments && context.engine._compartments.lint;
		if(!compartment) return [];

		var core = this._core;

		// If globally disabled, return empty compartment
		if(!isLintEnabled()) {
			return [compartment.of([])];
		}

		// If disabled for this specific tiddler, return empty compartment
		var tiddlerTitle = context.tiddlerTitle;
		if(tiddlerTitle && isLintDisabledForTiddler(tiddlerTitle)) {
			return [compartment.of([])];
		}

		// Build and wrap extensions in compartment
		var extensions = buildLintExtensions(core, context);
		return [compartment.of(extensions)];
	},

	// Return raw content for compartment reconfiguration
	getCompartmentContent: function(context) {
		if(!_linter || !_syntaxTree) return [];
		if(!isLintEnabled()) return [];
		// Check per-tiddler disable
		var tiddlerTitle = context.tiddlerTitle;
		if(tiddlerTitle && isLintDisabledForTiddler(tiddlerTitle)) return [];
		return buildLintExtensions(this._core, context);
	},

	destroy: function(_engine) {
		// Clear cache on destroy
		_knownDefinitions = null;
	},

	/**
	 * Called when tiddlers change - re-lint or reconfigure if lint config changed
	 */
	onRefresh: function(widget, changedTiddlers) {
		if(!widget || !widget.engine || !widget.engine.view) {
			return;
		}

		var engine = widget.engine;
		var context = engine._pluginContext || {};
		var tiddlerTitle = context.tiddlerTitle;

		// Check if any lint config tiddlers changed
		var lintConfigChanged = false;
		var globalConfigChanged = false;
		var perTiddlerChanged = false;
		var contentTiddlerChanged = false;
		var perTiddlerDisableTiddler = tiddlerTitle ? "$:/temp/codemirror-6/lint-disabled/" + tiddlerTitle : null;

		for(var title in changedTiddlers) {
			if(title === "$:/config/codemirror-6/lint/enabled") {
				globalConfigChanged = true;
				lintConfigChanged = true;
			} else if(title.indexOf("$:/config/codemirror-6/lint/") === 0) {
				lintConfigChanged = true;
			} else if(perTiddlerDisableTiddler && title === perTiddlerDisableTiddler) {
				perTiddlerChanged = true;
			} else {
				// Check if it's a draft tiddler (has draft.of field)
				var tiddler = $tw.wiki.getTiddler(title);
				var isDraft = tiddler && tiddler.fields["draft.of"];
				if(!isDraft) {
					// A non-draft tiddler changed - may affect missing links lint
					contentTiddlerChanged = true;
				}
			}
		}

		if(globalConfigChanged || perTiddlerChanged) {
			// Global lint toggle or per-tiddler toggle changed - reconfigure compartment
			var compartment = engine._compartments && engine._compartments.lint;

			if(compartment) {
				var globalEnabled = isLintEnabled();
				var perTiddlerDisabled = tiddlerTitle && isLintDisabledForTiddler(tiddlerTitle);
				var enabled = globalEnabled && !perTiddlerDisabled;
				var newContent = enabled ? buildLintExtensions(this._core, context) : [];

				try {
					engine.view.dispatch({
						effects: compartment.reconfigure(newContent)
					});
				} catch (_e) {}

				// Clear cache
				_knownDefinitions = null;

				// If enabling, trigger linting after a short delay to let extensions initialize
				if(enabled && _forceLinting) {
					setTimeout(function() {
						_forceLinting(engine.view);
					}, 50);
				}
			}
		} else if(lintConfigChanged) {
			// Individual rule changed - reconfigure to force fresh linter
			var compartment = engine._compartments && engine._compartments.lint;

			if(compartment) {
				// Check if lint is actually enabled for this tiddler
				var globalEnabled = isLintEnabled();
				var perTiddlerDisabled = tiddlerTitle && isLintDisabledForTiddler(tiddlerTitle);
				if(!globalEnabled || perTiddlerDisabled) return;

				var newContent = buildLintExtensions(this._core, context);
				_knownDefinitions = null;

				try {
					engine.view.dispatch({
						effects: compartment.reconfigure(newContent)
					});
				} catch (_e) {}

				// Trigger linting after reconfigure
				if(_forceLinting) {
					setTimeout(function() {
						_forceLinting(engine.view);
					}, 50);
				}
			}
		} else if(contentTiddlerChanged) {
			// A tiddler was created/deleted/modified - re-lint to update missing links
			if(_forceLinting && isLintEnabled() && isRuleEnabled("missingLinks")) {
				// Use setTimeout to ensure the wiki state is fully updated
				setTimeout(function() {
					if(engine.view) {
						_forceLinting(engine.view);
					}
				}, 100);
			}
		}
	},

	/**
	 * Message handlers for toolbar button interactions
	 */
	onMessage: {
		/**
		 * Handle tm-cm6-toggle-lint message from toolbar button
		 * Toggles the per-tiddler lint setting and reconfigures the compartment
		 */
		"tm-cm6-toggle-lint": function(widget, _event) {
			if(!widget || !widget.engine || !widget.engine.view) {
				return;
			}

			var engine = widget.engine;
			var context = engine._pluginContext || {};
			var tiddlerTitle = context.tiddlerTitle;
			var compartment = engine._compartments && engine._compartments.lint;

			if(!compartment || !tiddlerTitle) {
				return;
			}

			var globalEnabled = isLintEnabled();
			var perTiddlerDisabled = isLintDisabledForTiddler(tiddlerTitle);
			var _currentlyEnabled = globalEnabled && !perTiddlerDisabled;

			// Toggle the per-tiddler state by creating/deleting the temp tiddler
			var disableTiddler = "$:/temp/codemirror-6/lint-disabled/" + tiddlerTitle;
			if(perTiddlerDisabled) {
				// Currently disabled for this tiddler - delete the temp tiddler to enable
				$tw.wiki.deleteTiddler(disableTiddler);
			} else {
				// Currently enabled - create the temp tiddler to disable
				$tw.wiki.addTiddler({
					title: disableTiddler,
					text: "disabled"
				});
			}

			// Calculate the NEW state after toggle
			var newPerTiddlerDisabled = !perTiddlerDisabled;
			var newEnabled = globalEnabled && !newPerTiddlerDisabled;

			// Get the plugin instance to access _core
			var lintPlugin = null;
			if($tw && $tw.modules) {
				var plugins = $tw.modules.types["codemirror6-plugin"];
				for(var moduleName in plugins) {
					var mod = plugins[moduleName];
					if(mod && mod.plugin && mod.plugin.name === "lint") {
						lintPlugin = mod.plugin;
						break;
					}
				}
			}

			if(!lintPlugin || !lintPlugin._core) {
				return;
			}

			var newContent = newEnabled ? buildLintExtensions(lintPlugin._core, context) : [];

			try {
				engine.view.dispatch({
					effects: compartment.reconfigure(newContent)
				});
			} catch (_e) {}

			// Clear cache
			_knownDefinitions = null;

			// If enabling, trigger linting after a short delay
			if(newEnabled && _forceLinting) {
				setTimeout(function() {
					_forceLinting(engine.view);
				}, 50);
			}
		}
	}
};
