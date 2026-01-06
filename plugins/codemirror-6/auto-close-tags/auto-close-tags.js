/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/auto-close-tags/auto-close-tags.js
type: application/javascript
module-type: codemirror6-plugin

Auto-close tags plugin - automatically inserts closing tags for HTML and TiddlyWiki widgets

\*/
(function() {
	"use strict";

	if(!$tw.browser) return;

	// HTML void elements that should not be auto-closed
	var voidElements = new Set([
		"area", "base", "br", "col", "embed", "hr", "img", "input",
		"link", "meta", "param", "source", "track", "wbr"
	]);

	// TiddlyWiki self-closing widgets (no content allowed)
	var selfClosingWidgets = new Set([
		"$action-confirm", "$action-createtiddler", "$action-deletetiddler",
		"$action-deletefield", "$action-listops", "$action-log",
		"$action-navigate", "$action-popup", "$action-sendmessage",
		"$action-setfield", "$action-setmultiplefields"
	]);

	exports.plugin = {
		name: "auto-close-tags",
		description: "Auto-close HTML and TiddlyWiki widget tags",
		priority: 650,

		// Load if autoCloseTags option is enabled
		condition: function(context) {
			var wiki = context.options && context.options.widget && context.options.widget.wiki;
			var enabled = wiki && wiki.getTiddlerText("$:/config/codemirror-6/autoCloseTags") !== "no";
			return enabled;
		},

		init: function(cm6Core) {
			this._core = cm6Core;
		},

		getExtensions: function(context) {
			var core = this._core;
			var EditorView = core.view.EditorView;
			var EditorSelection = core.state.EditorSelection;
			var syntaxTree = core.language.syntaxTree;
			var extensions = [];

			// Input handler for auto-closing tags
			var autoCloseTagsHandler = EditorView.inputHandler.of(function(view, from, to, text, insert) {
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

				// Check if we're inside a macro call (<<macro ...>)
				// Don't auto-close if this > is closing a macro
				var lastMacroOpen = textBefore.lastIndexOf("<<");
				var lastMacroClose = textBefore.lastIndexOf(">>");
				if(lastMacroOpen > -1 && lastMacroOpen > lastMacroClose) {
					// We're inside an unclosed macro - don't auto-close
					return false;
				}

				// Look for an opening tag pattern
				// Match: <tagname or <$widgetname with optional attributes
				var tagMatch = textBefore.match(/<(\$?[a-zA-Z][a-zA-Z0-9\-\.]*)(?:\s[^>]*)?$/);
				if(!tagMatch) return false;

				var tagName = tagMatch[1];
				var tagNameLower = tagName.toLowerCase();

				// Don't auto-close void HTML elements
				if(voidElements.has(tagNameLower)) {
					return false;
				}

				// Don't auto-close known self-closing widgets
				if(selfClosingWidgets.has(tagNameLower)) {
					return false;
				}

				// Check using syntax tree if available
				var tree = syntaxTree(state);
				if(tree) {
					var node = tree.resolveInner(pos, -1);
					// Walk up the tree to check context
					while(node) {
						var nodeName = node.name;
						// If we're in an attribute value, don't auto-close
						if(nodeName === "AttributeValue" || nodeName === "AttributeString") {
							return false;
						}
						// If we're inside a filter expression, don't auto-close
						// In filters, <variable> is a variable reference, not a tag
						if(nodeName === "FilterExpression" || nodeName === "FilterRun" ||
							nodeName === "FilteredTransclusion" || nodeName === "FilteredTransclusionBlock" ||
							nodeName === "AttributeFiltered") {
							return false;
						}
						node = node.parent;
					}
				}

				// Insert > and the closing tag
				var closingTag = "</" + tagName + ">";
				var changes = {
					from: from,
					to: to,
					insert: ">" + closingTag
				};

				view.dispatch({
					changes: changes,
					selection: EditorSelection.cursor(from + 1), // Position after >
					userEvent: "input.complete"
				});

				return true;
			});

			extensions.push(autoCloseTagsHandler);

			// Handler for completing closing tags when typing </
			var closeTagHandler = EditorView.inputHandler.of(function(view, from, to, text, insert) {
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

			extensions.push(closeTagHandler);

			return extensions;
		},

		registerEvents: function(engine, context) {
			return {};
		},

		extendAPI: function(engine, context) {
			return {};
		}
	};

})();
