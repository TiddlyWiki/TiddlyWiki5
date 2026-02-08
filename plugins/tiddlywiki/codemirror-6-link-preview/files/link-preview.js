/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/link-preview.js
type: application/javascript
module-type: codemirror6-plugin

TiddlyWiki Link Preview Plugin - shows tiddler preview on hover over links.

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var HOVER_DELAY = 300; // ms before showing preview
var MAX_PREVIEW_LENGTH = 500;

var _syntaxTree = null;
var _document = null; // Reference to widget.document

// Node types that contain tiddler titles
var TIDDLER_TITLE_NODES = {
	"LinkTarget": true,
	"LinkText": true,
	"TransclusionTarget": true,
	"FilterTextRef": true,
	"FilterTextRefTarget": true,
	"CamelCaseLink": true,
	"SystemLink": true,
	"ImageSource": true
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
 */
function isCamelCaseEnabled() {
	if(!$tw || !$tw.wiki) return true; // Default to enabled
	var config = $tw.wiki.getTiddlerText("$:/config/WikiParserRules/Inline/wikilink", "enable");
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
						widgetNameNode: child,
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
// Preview Tooltip
// ============================================================================

var tooltipElement = null;
var hideTimeout = null;
var currentTarget = null;
var contextMenuOpen = false;

function createTooltip() {
	if(tooltipElement) return tooltipElement;
	var doc = _document || document;

	tooltipElement = doc.createElement("div");
	tooltipElement.className = "cm6-tw-link-preview";
	tooltipElement.style.cssText = [
		"position: fixed",
		"z-index: 10000",
		"max-width: 400px",
		"max-height: 300px",
		"overflow: hidden",
		"display: none",
		"flex-direction: column",
		"padding: 8px 12px",
		"border-radius: 4px",
		"box-shadow: 0 2px 8px rgba(0,0,0,0.15)",
		"font-size: 13px",
		"line-height: 1.4"
	].join(";");

	doc.body.appendChild(tooltipElement);

	// Hide on mouse leave
	tooltipElement.addEventListener("mouseleave", function() {
		if(!contextMenuOpen) {
			hideTooltip();
		}
	});

	// Keep visible on mouse enter
	tooltipElement.addEventListener("mouseenter", function() {
		if(hideTimeout) {
			clearTimeout(hideTimeout);
			hideTimeout = null;
		}
	});

	// Track context menu state
	tooltipElement.addEventListener("contextmenu", function() {
		contextMenuOpen = true;
	});

	// Close context menu detection - any click closes it
	doc.addEventListener("click", function() {
		if(contextMenuOpen) {
			contextMenuOpen = false;
		}
	});
	doc.addEventListener("contextmenu", function(e) {
		// If context menu opened outside tooltip, allow hiding
		if(contextMenuOpen && tooltipElement && !tooltipElement.contains(e.target)) {
			contextMenuOpen = false;
		}
	});

	return tooltipElement;
}

function showTooltip(content, x, y) {
	var tooltip = createTooltip();

	// Clean up previous content and widgets
	if(tooltip._currentWidget) {
		// Destroy previous widget tree to prevent memory leaks
		tooltip._currentWidget = null;
	}
	tooltip.innerHTML = "";

	// Handle DOM element (from getTiddlerPreview) or HTML string
	if(content && content.nodeType === 1) {
		tooltip.appendChild(content);
		// Store widget reference for cleanup
		if(content._previewWidget) {
			tooltip._currentWidget = content._previewWidget;
		}
	} else if(typeof content === "string") {
		tooltip.innerHTML = content;
	}

	tooltip.style.display = "flex";

	// Adjust body height to account for CSS scale(0.75) transform
	// The inner content is rendered at 133.33% width then scaled to 75%,
	// so we need to set the container height to 75% of the inner's layout height
	var bodyInner = tooltip.querySelector(".cm6-preview-body-inner");
	if(bodyInner) {
		var bodyDiv = bodyInner.parentNode;
		if(bodyDiv) {
			bodyDiv.style.height = (bodyInner.offsetHeight * 0.75) + "px";
		}
	}

	// Position tooltip
	var rect = tooltip.getBoundingClientRect();
	var viewWidth = window.innerWidth;
	var viewHeight = window.innerHeight;

	// Adjust horizontal position
	if(x + rect.width > viewWidth - 10) {
		x = viewWidth - rect.width - 10;
	}
	if(x < 10) x = 10;

	// Adjust vertical position
	if(y + rect.height > viewHeight - 10) {
		y = y - rect.height - 20; // Show above cursor
	}
	if(y < 10) y = 10;

	tooltip.style.left = x + "px";
	tooltip.style.top = y + "px";
}

function hideTooltip() {
	if(hideTimeout) {
		clearTimeout(hideTimeout);
	}
	hideTimeout = setTimeout(function() {
		if(tooltipElement) {
			tooltipElement.style.display = "none";
			// Clean up widget when hiding
			if(tooltipElement._currentWidget) {
				tooltipElement._currentWidget = null;
			}
			tooltipElement.innerHTML = "";
		}
		currentTarget = null;
		hideTimeout = null;
	}, 100);
}

function scheduleHide() {
	if(contextMenuOpen) return;
	if(hideTimeout) {
		clearTimeout(hideTimeout);
	}
	hideTimeout = setTimeout(function() {
		if(!contextMenuOpen) {
			hideTooltip();
		}
	}, 200);
}

// ============================================================================
// Link Detection using Syntax Tree
// ============================================================================

/**
 * Extract link target from position in document using syntax tree
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
		if(TIDDLER_TITLE_NODES[current.name]) {
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

			return target;
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
				return target;
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
					return target;
				}
			}
		}

		current = current.parent;
	}

	return null;
}

/**
 * Get tiddler preview by rendering through $:/core/ui/ViewTemplate/body
 * Returns a DOM element (not HTML string) for proper widget rendering
 */
function getTiddlerPreview(title) {
	if(!$tw || !$tw.wiki) return null;
	var doc = _document || document;

	var tiddler = $tw.wiki.getTiddler(title);

	// Handle shadow tiddlers (e.g., $:/core/ui/ViewTemplate)
	if(!tiddler && $tw.wiki.isShadowTiddler(title)) {
		var pluginTitle = $tw.wiki.getShadowSource(title);
		if(pluginTitle) {
			var pluginInfo = $tw.wiki.getPluginInfo(pluginTitle);
			if(pluginInfo && pluginInfo.tiddlers && pluginInfo.tiddlers[title]) {
				tiddler = new $tw.Tiddler(pluginInfo.tiddlers[title]);
			}
		}
	}

	// Create container
	var container = doc.createElement("div");
	container.className = "cm6-preview-content";
	container.style.cssText = "display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden;";

	if(!tiddler) {
		// Don't show preview for missing tiddlers
		return null;
	}

	var fields = tiddler.fields;

	// Title header
	var titleDiv = doc.createElement("div");
	titleDiv.className = "cm6-preview-title";
	titleDiv.innerHTML = "<strong>" + $tw.utils.htmlEncode(fields.title) + "</strong>";
	container.appendChild(titleDiv);

	// Tags
	if(fields.tags) {
		var tags = $tw.utils.parseStringArray(fields.tags);
		if(tags.length > 0) {
			var tagsDiv = doc.createElement("div");
			tagsDiv.className = "cm6-preview-tags";
			tags.forEach(function(tag) {
				var tagSpan = doc.createElement("span");
				tagSpan.className = "cm6-preview-tag";
				tagSpan.textContent = tag;
				tagsDiv.appendChild(tagSpan);
				tagsDiv.appendChild(doc.createTextNode(" "));
			});
			container.appendChild(tagsDiv);
		}
	}

	// Type indicator for non-wikitext
	if(fields.type && fields.type !== "text/vnd.tiddlywiki" && fields.type !== "") {
		var typeDiv = doc.createElement("div");
		typeDiv.className = "cm6-preview-type";
		typeDiv.textContent = fields.type;
		container.appendChild(typeDiv);
	}

	// Render body through $:/core/ui/ViewTemplate/body
	var bodyDiv = doc.createElement("div");
	bodyDiv.className = "cm6-preview-body";
	container.appendChild(bodyDiv);

	// Inner wrapper for scaled content (transform doesn't affect layout)
	var bodyInner = doc.createElement("div");
	bodyInner.className = "cm6-preview-body-inner";
	bodyDiv.appendChild(bodyInner);

	try {
		// Render through ViewTemplate/body for proper formatting
		var parser = $tw.wiki.parseText("text/vnd.tiddlywiki",
			"<$transclude tiddler='$:/core/ui/ViewTemplate/body'/>");
		var widgetNode = $tw.wiki.makeWidget(parser, {
			document: doc,
			parentWidget: $tw.rootWidget,
			variables: {
				currentTiddler: title
			}
		});
		widgetNode.render(bodyInner, null);

		// Store widget reference for cleanup
		container._previewWidget = widgetNode;
	} catch (e) {
		// Fallback to raw text if rendering fails
		var text = fields.text || "";
		if(text.length > MAX_PREVIEW_LENGTH) {
			text = text.substring(0, MAX_PREVIEW_LENGTH) + "...";
		}
		bodyInner.textContent = text;
	}

	// Modified date
	if(fields.modified) {
		var metaDiv = doc.createElement("div");
		metaDiv.className = "cm6-preview-meta";
		metaDiv.textContent = "Modified: " + $tw.utils.formatDateString(fields.modified, "YYYY-0MM-0DD 0hh:0mm");
		container.appendChild(metaDiv);
	}

	return container;
}

// ============================================================================
// Hover Handler
// ============================================================================

var hoverTimeout = null;

function handleMouseMove(event, view) {
	// Clear any pending hover
	if(hoverTimeout) {
		clearTimeout(hoverTimeout);
		hoverTimeout = null;
	}

	// Get position from coordinates
	var pos;
	try {
		pos = view.posAtCoords({
			x: event.clientX,
			y: event.clientY
		});
	} catch (e) {
		// posAtCoords can throw "Invalid child in posBefore" if the view
		// structure is inconsistent during hover checking
		scheduleHide();
		return;
	}
	if(pos === null) {
		scheduleHide();
		return;
	}

	// Check if we're still on the same target
	var target = getLinkAtPos(view.state, pos);
	if(!target) {
		scheduleHide();
		return;
	}

	if(target === currentTarget) {
		// Cancel hide if still on same target
		if(hideTimeout) {
			clearTimeout(hideTimeout);
			hideTimeout = null;
		}
		return;
	}

	// Schedule showing new tooltip
	hoverTimeout = setTimeout(function() {
		currentTarget = target;
		var preview = getTiddlerPreview(target);
		if(preview) {
			showTooltip(preview, event.clientX + 10, event.clientY + 10);
		}
		hoverTimeout = null;
	}, HOVER_DELAY);
}

function handleMouseLeave(_event, _view) {
	if(hoverTimeout) {
		clearTimeout(hoverTimeout);
		hoverTimeout = null;
	}
	scheduleHide();
}

// ============================================================================
// Plugin Definition
// ============================================================================

exports.plugin = {
	name: "link-preview",
	description: "Show tiddler preview on hover over links and transclusions",
	priority: 400,

	// Only load for TiddlyWiki content when enabled
	condition: function(context) {
		var type = context.tiddlerType;
		if(context.options.linkPreview === false) return false;
		// Check config tiddler
		var wiki = context.options && context.options.widget && context.options.widget.wiki;
		var enabled = wiki && wiki.getTiddlerText("$:/config/codemirror-6/link-preview/enabled", "yes");
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
			linkPreview: new Compartment()
		};
	},

	// Lazily create and cache the link-preview handlers
	_getOrCreateLinkPreviewHandlers: function() {
		if(this._linkPreviewHandlers) return this._linkPreviewHandlers;

		var core = this._core;
		var EditorView = core.view.EditorView;

		this._linkPreviewHandlers = EditorView.domEventHandlers({
			mousemove: handleMouseMove,
			mouseleave: handleMouseLeave
		});

		return this._linkPreviewHandlers;
	},

	getExtensions: function(context) {
		// Store widget.document reference for DOM operations
		var widget = context.options && context.options.widget;
		if(widget && widget.document) {
			_document = widget.document;
		}

		var handlers = this._getOrCreateLinkPreviewHandlers();
		if(!handlers) return [];

		// Wrap in compartment if available
		var engine = context.engine;
		var compartments = engine && engine._compartments;
		if(compartments && compartments.linkPreview) {
			return [compartments.linkPreview.of(handlers)];
		}

		return [handlers];
	},

	// Return raw content for compartment reconfiguration (without compartment.of wrapper)
	getCompartmentContent: function(context) {
		// Store widget.document reference for DOM operations
		var widget = context.options && context.options.widget;
		if(widget && widget.document) {
			_document = widget.document;
		}

		var handlers = this._getOrCreateLinkPreviewHandlers();
		return handlers ? [handlers] : [];
	},

	registerEvents: function(engine, _context) {
		var self = this;

		return {
			settingsChanged: function(settings) {
				if(engine._destroyed) return;

				if(settings.linkPreview !== undefined) {
					if(settings.linkPreview) {
						var handlers = self._getOrCreateLinkPreviewHandlers();
						if(handlers) {
							engine.reconfigure("linkPreview", handlers);
						}
					} else {
						engine.reconfigure("linkPreview", []);
						// Hide any open tooltip
						hideTooltip();
					}
				}
			}
		};
	},

	extendAPI: function(_engine, _context) {
		return {
			/**
			 * Show preview for a specific tiddler at position
			 */
			showLinkPreview: function(title, x, y) {
				var preview = getTiddlerPreview(title);
				if(preview) {
					showTooltip(preview, x, y);
				}
			},

			/**
			 * Hide the link preview tooltip
			 */
			hideLinkPreview: function() {
				hideTooltip();
			},

			/**
			 * Get link target at current cursor position
			 */
			getLinkAtCursor: function() {
				if(this._destroyed) return null;
				var pos = this.view.state.selection.main.head;
				return getLinkAtPos(this.view.state, pos);
			}
		};
	},

	destroy: function(_engine) {
		// Clean up tooltip
		if(tooltipElement && tooltipElement.parentNode) {
			tooltipElement.parentNode.removeChild(tooltipElement);
			tooltipElement = null;
		}
		if(hoverTimeout) {
			clearTimeout(hoverTimeout);
			hoverTimeout = null;
		}
		if(hideTimeout) {
			clearTimeout(hideTimeout);
			hideTimeout = null;
		}
		_document = null;
		contextMenuOpen = false;
	},

	/**
	 * Called when tiddlers change - refresh preview if currently displayed tiddler changed
	 */
	onRefresh: function(_widget, changedTiddlers) {
		// If tooltip is visible and the displayed tiddler changed, refresh it
		if(currentTarget && tooltipElement && tooltipElement.parentNode) {
			if(changedTiddlers[currentTarget]) {
				// The currently displayed tiddler changed - refresh preview
				var preview = getTiddlerPreview(currentTarget);
				if(preview) {
					// Get current position from tooltip
					var rect = tooltipElement.getBoundingClientRect();
					showTooltip(preview, rect.left, rect.top);
				}
			}
		}
	}
};
