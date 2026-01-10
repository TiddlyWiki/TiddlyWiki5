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

// ============================================================================
// Link Detection using Syntax Tree
// ============================================================================

/**
 * Extract link target and type from position in document using syntax tree
 */
function getLinkAtPos(state, pos) {
	if(!_syntaxTree) return null;

	var tree = _syntaxTree(state);
	if(!tree) return null;

	var node = tree.resolveInner(pos, 0);
	if(!node) return null;

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

		// Check for filter operand - only if operator takes tiddler titles
		if(current.name === "FilterOperand") {
			var opName = getFilterOperatorName(state, current);
			if(opName && TIDDLER_TITLE_OPERATORS[opName]) {
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

		// Check for macro name
		if(current.name === "MacroName") {
			var macroName = state.doc.sliceString(current.from, current.to);
			var defTiddler = findMacroDefinition(macroName);
			if(defTiddler) {
				// Find the parent MacroCall for bounds
				var macroCall = current.parent;
				while(macroCall && macroCall.name !== "MacroCall") {
					macroCall = macroCall.parent;
				}
				return {
					type: "macro",
					target: defTiddler,
					macroName: macroName,
					from: macroCall ? macroCall.from : current.from,
					to: macroCall ? macroCall.to : current.to
				};
			}
		}

		// Check for widget name
		if(current.name === "WidgetName") {
			var widgetName = state.doc.sliceString(current.from, current.to);
			// Remove $ prefix if present
			if(widgetName.startsWith("$")) {
				widgetName = widgetName.slice(1);
			}
			// Find the parent widget tag for bounds
			var widgetTag = current.parent;
			while(widgetTag && !widgetTag.name.includes("Widget")) {
				widgetTag = widgetTag.parent;
			}
			return {
				type: "widget",
				target: "$:/core/ui/WidgetInfo/" + widgetName,
				widgetName: widgetName,
				from: widgetTag ? widgetTag.from : current.from,
				to: widgetTag ? widgetTag.to : current.to
			};
		}

		current = current.parent;
	}

	return null;
}

/**
 * Find tiddler that defines a macro
 */
function findMacroDefinition(macroName) {
	if(!$tw || !$tw.wiki) return null;

	// Search in shadows first (core macros)
	var shadows = $tw.wiki.filterTiddlers("[all[shadows]has[text]]");
	for(var i = 0; i < shadows.length; i++) {
		var tiddler = $tw.wiki.getTiddler(shadows[i]);
		if(tiddler && tiddler.fields.text) {
			var regex = new RegExp("\\\\define\\s+" + macroName + "\\s*\\(");
			if(regex.test(tiddler.fields.text)) {
				return shadows[i];
			}
		}
	}

	// Search in regular tiddlers
	var tiddlers = $tw.wiki.filterTiddlers("[all[tiddlers]has[text]]");
	for(var i = 0; i < tiddlers.length; i++) {
		var tiddler = $tw.wiki.getTiddler(tiddlers[i]);
		if(tiddler && tiddler.fields.text) {
			var regex = new RegExp("\\\\define\\s+" + macroName + "\\s*\\(");
			if(regex.test(tiddler.fields.text)) {
				return tiddlers[i];
			}
		}
	}

	return null;
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
 * Remove highlight
 */
function clearHighlight(view) {
	if(view && view.dom) {
		view.dom.classList.remove("cm6-ctrl-held");
	}
	_currentHighlight = null;
}

// ============================================================================
// Event Handlers
// ============================================================================

var ctrlHeld = false;
var lastMousePos = null;

function handleKeyDown(event, view) {
	if(event.key === "Control" || event.key === "Meta") {
		ctrlHeld = true;

		// If we have a mouse position, check for link
		if(lastMousePos) {
			var pos = view.posAtCoords(lastMousePos);
			if(pos !== null) {
				var link = getLinkAtPos(view.state, pos);
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

	var pos = view.posAtCoords(lastMousePos);
	if(pos === null) {
		clearHighlight(view);
		return;
	}

	var link = getLinkAtPos(view.state, pos);
	if(link) {
		highlightLink(view, link.from, link.to);
		view.dom.style.cursor = "pointer";
	} else {
		clearHighlight(view);
		view.dom.style.cursor = "";
	}
}

function handleMouseLeave(event, view) {
	lastMousePos = null;
	clearHighlight(view);
	view.dom.style.cursor = "";
}

function handleClick(event, view) {
	// Check for Ctrl+Click (Cmd+Click on Mac)
	var ctrlKey = event.ctrlKey || event.metaKey;
	if(!ctrlKey) return false;

	var pos = view.posAtCoords({
		x: event.clientX,
		y: event.clientY
	});
	if(pos === null) return false;

	var link = getLinkAtPos(view.state, pos);
	if(!link) return false;

	// Prevent default click behavior
	event.preventDefault();

	// Handle external URLs - always open in new browser tab
	if(link.isExternal) {
		window.open(link.target, "_blank", "noopener,noreferrer");
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
			 */
			navigateToLinkAtCursor: function() {
				if(this._destroyed) return false;

				var pos = this.view.state.selection.main.head;
				var link = getLinkAtPos(this.view.state, pos);
				if(!link) return false;

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
				return getLinkAtPos(this.view.state, pos);
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
