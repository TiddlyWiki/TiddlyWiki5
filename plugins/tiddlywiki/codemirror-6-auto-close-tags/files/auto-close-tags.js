/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/auto-close-tags/auto-close-tags.js
type: application/javascript
module-type: codemirror6-plugin

Auto-close tags plugin - automatically inserts closing tags for HTML and TiddlyWiki widgets

\*/
"use strict";

if(!$tw.browser) return;

// HTML void elements that should not be auto-closed
var voidElements = new Set([
	"area", "base", "br", "col", "embed", "hr", "img", "input",
	"link", "meta", "param", "source", "track", "wbr"
]);

// TiddlyWiki self-closing widgets (no content allowed)
var selfClosingWidgets = new Set([
	// Action widgets
	"$action-confirm", "$action-createtiddler", "$action-deletetiddler",
	"$action-deletefield", "$action-listops", "$action-log",
	"$action-navigate", "$action-popup", "$action-sendmessage",
	"$action-setfield", "$action-setmultiplefields",
	// Widgets that don't process children
	"$audio", "$codeblock", "$count", "$data", "$edit-text",
	"$encrypt", "$entity", "$error", "$image", "$jsontiddler",
	"$raw", "$text"
]);

exports.plugin = {
	name: "auto-close-tags",
	description: "Auto-close HTML and TiddlyWiki widget tags",
	priority: 650,

	// Load if autoCloseTags option is enabled
	condition: function(context) {
		var wiki = context.options && context.options.widget && context.options.widget.wiki;
		var enabled = wiki && wiki.getTiddlerText("$:/config/codemirror-6/auto-close-tags/enabled") !== "no";
		return enabled;
	},

	init: function(cm6Core) {
		this._core = cm6Core;
		this._autoCloseTagsHandlers = null;
	},

	registerCompartments: function() {
		var core = this._core;
		var Compartment = core.state.Compartment;
		return {
			autoCloseTags: new Compartment()
		};
	},

	// Lazily create and cache the auto-close handlers
	_getOrCreateAutoCloseHandlers: function() {
		if(this._autoCloseTagsHandlers) return this._autoCloseTagsHandlers;

		var core = this._core;
		var EditorView = core.view.EditorView;
		var EditorSelection = core.state.EditorSelection;
		var syntaxTree = core.language.syntaxTree;
		var handlers = [];

		// Input handler for auto-closing tags
		var autoCloseTagsHandler = EditorView.inputHandler.of(function(view, from, to, text, _insert) {
			// Only handle ">" character
			if(text !== ">") return false;

			var state = view.state;
			var doc = state.doc;
			var pos = from;

			// Check what's before the cursor
			var lineStart = doc.lineAt(pos).from;
			var textBefore = doc.sliceString(lineStart, pos);

			// Check if we're completing a self-closing tag (/>)
			if(textBefore.endsWith("/")) {
				return false; // Let default handling occur
			}

			// Check if we're completing a macro close (>>)
			// If text ends with single > (not >>) and there's an unclosed <<, we're typing second > of >>
			if(textBefore.endsWith(">") && !textBefore.endsWith(">>")) {
				// Check if there's an unclosed << before this >
				var lastMacroOpen = textBefore.lastIndexOf("<<");
				var lastMacroClose = textBefore.lastIndexOf(">>");
				if(lastMacroOpen > lastMacroClose) {
					// There's an unclosed macro - this > completes the >>
					return false;
				}
			}

			// Check if we're inside an unclosed filter or macro context
			// This handles cases where the parser couldn't properly nest the <tag
			// inside the filter (e.g., {{{ [tag<tag or <<macro<tag)
			var textBeforeFull = doc.sliceString(0, pos);
			var filterBrackets = 0;
			var squareBrackets = 0;
			var macroBrackets = 0;
			var inQuote = false;
			var quoteChar = null;

			for(var i = 0; i < textBeforeFull.length; i++) {
				var ch = textBeforeFull[i];
				var next = textBeforeFull[i + 1] || "";
				var next2 = textBeforeFull[i + 2] || "";

				// Track quoted strings
				if(!inQuote && (ch === '"' || ch === "'")) {
					inQuote = true;
					quoteChar = ch;
					continue;
				}
				if(inQuote && ch === quoteChar && textBeforeFull[i - 1] !== "\\") {
					inQuote = false;
					quoteChar = null;
					continue;
				}
				if(inQuote) continue;

				// Track {{{ }}} filtered transclusion brackets
				if(ch === "{" && next === "{" && next2 === "{") {
					filterBrackets++;
					i += 2;
					continue;
				}
				if(ch === "}" && next === "}" && next2 === "}") {
					filterBrackets--;
					i += 2;
					continue;
				}

				// Track [ ] filter brackets (only when inside {{{ or in filter context)
				if(filterBrackets > 0) {
					if(ch === "[") {
						squareBrackets++;
						continue;
					}
					if(ch === "]") {
						squareBrackets--;
						continue;
					}
				}

				// Track << >> macro brackets
				if(ch === "<" && next === "<") {
					macroBrackets++;
					i++;
					continue;
				}
				if(ch === ">" && next === ">") {
					macroBrackets--;
					i++;
					continue;
				}
			}

			// If we're inside unclosed filter/macro context, don't auto-close
			// The > is likely closing a filter variable like <tag> not an HTML tag
			if(filterBrackets > 0 || squareBrackets > 0 || macroBrackets > 0) {
				return false;
			}

			// Use the syntax tree to detect incomplete widget/HTML tags
			var tree = syntaxTree(state);
			if(!tree) return false;

			var node = tree.resolveInner(pos, -1);

			// Walk up to find an incomplete Widget or HTMLTag
			var tagNode = null;
			var tagName = null;
			var isWidget = false;
			var current = node;

			while(current) {
				var nodeName = current.name;

				// If we're inside a macro call, don't auto-close
				if(nodeName === "MacroCall" || nodeName === "MacroCallBlock") {
					// Check if the macro is unclosed (no closing >>)
					var hasClose = false;
					var cursor = current.cursor();
					if(cursor.firstChild()) {
						do {
							if(cursor.name === "MacroCallMark") {
								var markText = doc.sliceString(cursor.from, cursor.to);
								if(markText === ">>") {
									hasClose = true;
								}
							}
						} while(cursor.nextSibling());
					}
					if(!hasClose) {
						return false;
					}
				}

				// Check for Widget or InlineWidget
				if(nodeName === "Widget" || nodeName === "InlineWidget" || nodeName === "BlockWidget") {
					// Check if this widget has a closing TagMark ">"
					var hasClosingMark = false;
					var widgetNameNode = null;
					var cursor = current.cursor();
					if(cursor.firstChild()) {
						do {
							if(cursor.name === "WidgetName") {
								widgetNameNode = cursor.node;
							}
							if(cursor.name === "TagMark") {
								var markText = doc.sliceString(cursor.from, cursor.to);
								if(markText === ">") {
									hasClosingMark = true;
								}
							}
						} while(cursor.nextSibling());
					}

					if(!hasClosingMark && widgetNameNode) {
						tagNode = current;
						tagName = doc.sliceString(widgetNameNode.from, widgetNameNode.to);
						isWidget = true;
						break;
					}
				}

				// Check for HTML tags
				if(nodeName === "HTMLTag" || nodeName === "HTMLBlock") {
					// Check if this tag has a closing TagMark ">"
					var hasClosingMark = false;
					var tagNameNode = null;
					var cursor = current.cursor();
					if(cursor.firstChild()) {
						do {
							if(cursor.name === "TagName") {
								tagNameNode = cursor.node;
							}
							if(cursor.name === "TagMark") {
								var markText = doc.sliceString(cursor.from, cursor.to);
								if(markText === ">") {
									hasClosingMark = true;
								}
							}
						} while(cursor.nextSibling());
					}

					if(!hasClosingMark && tagNameNode) {
						tagNode = current;
						tagName = doc.sliceString(tagNameNode.from, tagNameNode.to);
						isWidget = false;
						break;
					}
				}

				current = current.parent;
			}

			// No incomplete tag found
			if(!tagNode || !tagName) {
				return false;
			}

			var tagNameLower = tagName.toLowerCase();

			// Don't auto-close void HTML elements
			if(!isWidget && voidElements.has(tagNameLower)) {
				return false;
			}

			// Don't auto-close known self-closing widgets
			if(isWidget && selfClosingWidgets.has(tagNameLower)) {
				return false;
			}

			// Check if there's already a balanced closing tag using the syntax tree
			// Look for WidgetEnd or HTMLEndTag nodes with matching names
			var closingTag = "</" + tagName + ">";
			var hasBalancedClose = false;

			// Walk the syntax tree to find all closing tags with this name after our position
			// and track balance with any nested opening tags
			var balance = 0;
			var nameToMatch = isWidget ? tagName : tagName.toLowerCase();
			var tagNodeFrom = tagNode.from;
			var tagNodeTo = tagNode.to;

			tree.iterate({
				from: to,
				enter: function(nodeRef) {
					var nodeName = nodeRef.name;

					// Skip the incomplete widget/tag we're closing (it would falsely increment balance)
					if(nodeRef.from === tagNodeFrom && nodeRef.to === tagNodeTo) {
						return;
					}

					// Check for opening tags of the same type
					// Only count COMPLETE tags (those that have a closing TagMark ">")
					if(isWidget && (nodeName === "Widget" || nodeName === "InlineWidget" || nodeName === "BlockWidget")) {
						// Skip if this node started before our position (likely the parent we're closing)
						if(nodeRef.from < to) {
							return;
						}
						// Look for WidgetName child and check if complete
						var cursor = nodeRef.node.cursor();
						var hasClosingMark = false;
						var matchedName = false;
						if(cursor.firstChild()) {
							do {
								if(cursor.name === "WidgetName") {
									var widgetName = doc.sliceString(cursor.from, cursor.to);
									if(widgetName === nameToMatch) {
										matchedName = true;
									}
								}
								if(cursor.name === "TagMark") {
									var markText = doc.sliceString(cursor.from, cursor.to);
									if(markText === ">") {
										hasClosingMark = true;
									}
								}
								if(cursor.name === "SelfCloseEndTag") {
									// Self-closing, don't count
									return;
								}
							} while(cursor.nextSibling());
						}
						// Only count complete widgets with matching name
						if(matchedName && hasClosingMark) {
							balance++;
						}
					} else if(!isWidget && (nodeName === "HTMLTag" || nodeName === "HTMLBlock")) {
						// Skip if this node started before our position
						if(nodeRef.from < to) {
							return;
						}
						// Look for TagName child and check if complete
						var cursor = nodeRef.node.cursor();
						var hasClosingMark = false;
						var matchedName = false;
						if(cursor.firstChild()) {
							do {
								if(cursor.name === "TagName") {
									var htmlTagName = doc.sliceString(cursor.from, cursor.to).toLowerCase();
									if(htmlTagName === nameToMatch) {
										matchedName = true;
									}
								}
								if(cursor.name === "TagMark") {
									var markText = doc.sliceString(cursor.from, cursor.to);
									if(markText === ">") {
										hasClosingMark = true;
									}
								}
								if(cursor.name === "SelfCloseEndTag") {
									// Self-closing, don't count
									return;
								}
							} while(cursor.nextSibling());
						}
						// Only count complete tags with matching name
						if(matchedName && hasClosingMark) {
							balance++;
						}
					}

					// Check for closing tags
					if(nodeName === "WidgetEnd" && isWidget) {
						var cursor = nodeRef.node.cursor();
						if(cursor.firstChild()) {
							do {
								if(cursor.name === "WidgetName") {
									var widgetName = doc.sliceString(cursor.from, cursor.to);
									if(widgetName === nameToMatch) {
										if(balance === 0) {
											// Found unmatched closing tag
											hasBalancedClose = true;
											return false; // Stop iteration
										}
										balance--;
									}
									break;
								}
							} while(cursor.nextSibling());
						}
					} else if(nodeName === "HTMLEndTag" && !isWidget) {
						var cursor = nodeRef.node.cursor();
						if(cursor.firstChild()) {
							do {
								if(cursor.name === "TagName") {
									var htmlTagName = doc.sliceString(cursor.from, cursor.to).toLowerCase();
									if(htmlTagName === nameToMatch) {
										if(balance === 0) {
											// Found unmatched closing tag
											hasBalancedClose = true;
											return false; // Stop iteration
										}
										balance--;
									}
									break;
								}
							} while(cursor.nextSibling());
						}
					}
				}
			});

			// Insert > and optionally the closing tag (if not already balanced)
			var insertText = hasBalancedClose ? ">" : (">" + closingTag);
			var changes = {
				from: from,
				to: to,
				insert: insertText
			};

			view.dispatch({
				changes: changes,
				selection: EditorSelection.cursor(from + 1), // Position after >
				userEvent: "input.complete"
			});

			return true;
		});

		handlers.push(autoCloseTagsHandler);

		// Handler for completing closing tags when typing </
		var closeTagHandler = EditorView.inputHandler.of(function(view, from, to, text, _insert) {
			// Only handle "/" after "<"
			if(text !== "/") return false;

			var state = view.state;
			var doc = state.doc;

			// Check if previous char is "<"
			if(from === 0 || doc.sliceString(from - 1, from) !== "<") {
				return false;
			}

			// Find the nearest unclosed opening tag
			var tree = syntaxTree(state);
			if(!tree) return false;

			// Walk up the tree to find an unclosed element
			var node = tree.resolveInner(from, -1);
			var unclosedTag = null;

			// Look for parent Element nodes
			while(node) {
				if(node.name === "Element" || node.name === "InlineWidget" ||
					node.name === "BlockWidget" || node.name === "HTMLTag" ||
					node.name === "HTMLBlock") {
					// Check if this element has a closing tag
					var lastChild = node.lastChild;
					if(lastChild && (lastChild.name === "CloseTag" ||
							lastChild.name === "WidgetEnd" || lastChild.name === "HTMLEndTag" ||
							lastChild.name === "SelfClosingTag" || lastChild.name === "SelfCloseEndTag")) {
						// This element is closed, continue looking
					} else {
						// Find the tag name
						var openTag = node.firstChild;
						if(openTag) {
							var tagNameNode = openTag.getChild("TagName") ||
								openTag.getChild("WidgetName");
							if(tagNameNode) {
								unclosedTag = doc.sliceString(tagNameNode.from, tagNameNode.to);
								break;
							}
						}
					}
				}
				node = node.parent;
			}

			if(unclosedTag) {
				// Insert the closing tag
				var closingText = "/" + unclosedTag + ">";
				view.dispatch({
					changes: {
						from: from,
						to: to,
						insert: closingText
					},
					selection: EditorSelection.cursor(from + closingText.length),
					userEvent: "input.complete"
				});
				return true;
			}

			return false;
		});

		handlers.push(closeTagHandler);

		this._autoCloseTagsHandlers = handlers;
		return handlers;
	},

	getExtensions: function(context) {
		var handlers = this._getOrCreateAutoCloseHandlers();
		if(!handlers || handlers.length === 0) return [];

		// Wrap in compartment if available
		var engine = context.engine;
		var compartments = engine && engine._compartments;
		if(compartments && compartments.autoCloseTags) {
			return [compartments.autoCloseTags.of(handlers)];
		}

		return handlers;
	},

	registerEvents: function(engine, _context) {
		var self = this;

		return {
			settingsChanged: function(settings) {
				if(engine._destroyed) return;

				if(settings.autoCloseTags !== undefined) {
					if(settings.autoCloseTags) {
						var handlers = self._getOrCreateAutoCloseHandlers();
						if(handlers) {
							engine.reconfigure("autoCloseTags", handlers);
						}
					} else {
						engine.reconfigure("autoCloseTags", []);
					}
				}
			}
		};
	},

	extendAPI: function(_engine, _context) {
		return {};
	}
};
