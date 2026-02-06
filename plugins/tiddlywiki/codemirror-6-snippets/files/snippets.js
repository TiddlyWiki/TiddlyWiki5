/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/snippets/snippets.js
type: application/javascript
module-type: codemirror6-plugin

User-configurable snippets plugin.
Allows users to define custom snippets via tiddlers tagged with $:/tags/CodeMirror/Snippet.
Uses CodeMirror's built-in snippet system for proper Tab navigation between placeholders.

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// ============================================================================
// Constants
// ============================================================================

var SNIPPET_TAG = "$:/tags/CodeMirror/Snippet";
var _snippetCache = null;
var _cacheTime = 0;
var CACHE_TTL = 5000; // 5 seconds

// CodeMirror snippet function (loaded in init)
var _snippetFn = null;
var _core = null;


// ============================================================================
// Template Conversion
// ============================================================================

/**
 * Convert user template format to CodeMirror snippet format
 * - $0 becomes ${} (final cursor position)
 * - ${1}, ${2}, ${1:default} stay the same
 * - Escape ${ that shouldn't be placeholders
 */
function convertTemplate(template) {
	// Replace $0 with ${} (CodeMirror's final position syntax)
	// But be careful not to replace ${0} or ${0:...}
	return template.replace(/\$0(?!\d|{)/g, "${}");
}

// ============================================================================
// User Snippet Loading
// ============================================================================

/**
 * Load user-defined snippets from tagged tiddlers
 * @param {object} wiki - The wiki object (defaults to $tw.wiki)
 */
function loadUserSnippets(wiki) {
	var now = Date.now();
	if(_snippetCache && (now - _cacheTime) < CACHE_TTL) {
		return _snippetCache;
	}

	wiki = wiki || $tw.wiki;
	var snippets = [];
	var tiddlers = wiki.getTiddlersWithTag(SNIPPET_TAG);

	tiddlers.forEach(function(title) {
		var tiddler = wiki.getTiddler(title);
		if(!tiddler) return;

		var fields = tiddler.fields;
		var trigger = fields.trigger;
		var template = fields.text;

		if(!trigger || !template) return;

		snippets.push({
			trigger: trigger,
			label: fields.caption || trigger,
			detail: fields.description || "",
			template: template,
			scope: fields.scope || null,
			priority: parseInt(fields.priority, 10) || 0
		});
	});

	_snippetCache = snippets;
	_cacheTime = now;
	return snippets;
}

/**
 * Clear the snippet cache (call when snippets change)
 */
function clearCache() {
	_snippetCache = null;
	_cacheTime = 0;
}

/**
 * Get user snippets filtered by content type
 * @param {string} contentType - Optional content type for scope filtering
 */
function getSnippets(contentType) {
	var userSnippets = loadUserSnippets();

	// Filter by scope if content type is specified
	var filtered = userSnippets.filter(function(s) {
		if(!s.scope || !contentType) {
			return true; // No scope restriction
		}
		// Support comma-separated scopes
		var scopes = s.scope.split(",").map(function(sc) {
			return sc.trim();
		});
		return scopes.indexOf(contentType) !== -1;
	});

	// Sort by priority (higher first), then alphabetically
	filtered.sort(function(a, b) {
		var priorityDiff = (b.priority || 0) - (a.priority || 0);
		if(priorityDiff !== 0) return priorityDiff;
		return a.trigger.localeCompare(b.trigger);
	});

	return filtered;
}

// ============================================================================
// Completion Source
// ============================================================================

/**
 * Check if we're in a context where snippets should not appear
 * (inside attribute values, code blocks, comments, etc.)
 */
function isInRestrictedContext(context) {
	if(!_core || !_core.language || !_core.language.syntaxTree) {
		return false; // Can't check, allow snippets
	}

	var state = context.state;
	var pos = context.pos;
	var tree = _core.language.syntaxTree(state);
	var node = tree.resolveInner(pos, -1);

	// Walk up the tree to check for restricted contexts
	while(node && !node.type.isTop) {
		var name = node.name;
		// Don't show snippets inside these contexts
		if(name === "AttributeValue" ||
			name === "StringToken" ||
			name === "FencedCode" ||
			name === "CodeBlock" ||
			name === "TypedBlock" ||
			name === "CommentBlock" ||
			name === "CodeText" ||
			name === "InlineCode") {
			return true;
		}
		node = node.parent;
	}

	// Also check if we're inside an attribute value by looking at text pattern
	var textBefore = state.sliceDoc(Math.max(0, pos - 100), pos);
	// Check for unclosed attribute value: attr="... or attr='...
	var attrMatch = /[\w\-$]+\s*=\s*(["'])(?:[^"'\\]|\\.)*$/.exec(textBefore);
	if(attrMatch) {
		return true; // Inside an attribute value
	}

	// Check for transclusion field/index completion context: {{tiddler!! or {{tiddler##
	if(/\{\{[^{}]*!![^{}]*$/.test(textBefore) || /\{\{[^{}]*##[^{}]*$/.test(textBefore)) {
		return true; // Inside transclusion field/index completion
	}

	return false;
}

/**
 * Snippet completion source for autocompletion
 */
function snippetCompletions(context) {
	// Don't show snippets in restricted contexts (attribute values, code blocks, etc.)
	if(isInRestrictedContext(context)) {
		return null;
	}

	// Match word-like characters plus special chars used in triggers
	var word = context.matchBefore(/[\w\-\\$\[<`|]+/);
	if(!word || word.from === word.to) return null;

	var prefix = word.text.toLowerCase();

	// Get content type from context if available
	var contentType = null;
	// Try to get from engine context
	if(context.state && context.state.field) {
		// Could access content type through state fields if needed
	}

	var snippets = getSnippets(contentType);

	var options = snippets
		.filter(function(s) {
			return s.trigger.toLowerCase().startsWith(prefix);
		})
		.map(function(s) {
			var cmTemplate = convertTemplate(s.template);

			// Apply function that handles all selections
			var applyFn = function(view, completion, from, to) {
				var selections = view.state.selection.ranges;
				var mainIndex = view.state.selection.mainIndex;
				var triggerLen = word.text.length;

				if(_snippetFn && selections.length === 1) {
					// Single cursor: use CodeMirror's snippet system for Tab navigation
					_snippetFn(cmTemplate)(view, completion, from, to);
				} else {
					// Multi-cursor: insert plain text at all cursors
					var plainText = s.template
						.replace(/\$\{(\d+)(?::([^}]*))?\}/g, function(m, num, def) {
							return def || "";
						})
						.replace(/\$0/g, "");

					// Build changes for all selections
					var changes = selections.map(function(range, idx) {
						if(idx === mainIndex) {
							return {
								from: from,
								to: to,
								insert: plainText
							};
						} else {
							// Other cursors: replace the same trigger length
							return {
								from: range.from - triggerLen,
								to: range.from,
								insert: plainText
							};
						}
					});
					view.dispatch({
						changes: changes
					});
				}
			};

			return {
				label: s.trigger,
				displayLabel: s.label,
				type: "snippet",
				detail: s.detail,
				boost: (s.priority || 0) + 2,
				apply: applyFn
			};
		});

	if(options.length === 0) return null;

	return {
		from: word.from,
		options: options,
		validFor: /^[\w\-\\$\[<`|]*$/
	};
}

// ============================================================================
// Plugin Definition
// ============================================================================

exports.plugin = {
	name: "user-snippets",
	description: "User-configurable code snippets",
	priority: 560, // After emoji-picker (550), after tw-snippets (540)

	// Check if enabled in config
	condition: function(context) {
		var wiki = context.options && context.options.widget && context.options.widget.wiki;
		var enabled = wiki && wiki.getTiddlerText("$:/config/codemirror-6/snippets/enabled", "yes");
		return enabled === "yes";
	},

	init: function(cm6Core) {
		this._core = cm6Core;
		_core = cm6Core;
		// Load the snippet function from CodeMirror's autocomplete module
		if(cm6Core.autocomplete && cm6Core.autocomplete.snippet) {
			_snippetFn = cm6Core.autocomplete.snippet;
		}
	},

	getExtensions: function(context) {
		var engine = context.engine;

		// Register completion source with the engine
		// Use lower priority than tw-snippets so user snippets appear first
		// Pass config tiddler for dynamic enable/disable
		if(engine && engine.registerCompletionSource) {
			engine.registerCompletionSource(
				snippetCompletions,
				18,
				"$:/config/codemirror-6/snippets/enabled"
			);
		}

		return [];
	},

	extendAPI: function(_engine, _context) {
		return {
			/**
			 * Get list of user-defined snippets
			 */
			getUserSnippets: function() {
				return loadUserSnippets().map(function(s) {
					return {
						trigger: s.trigger,
						label: s.label,
						detail: s.detail,
						scope: s.scope,
						priority: s.priority
					};
				});
			},

			/**
			 * Get all user snippets (optionally filtered by content type)
			 */
			getSnippets: function(contentType) {
				return getSnippets(contentType).map(function(s) {
					return {
						trigger: s.trigger,
						label: s.label,
						detail: s.detail,
						scope: s.scope,
						priority: s.priority
					};
				});
			},

			/**
			 * Clear snippet cache (call after modifying snippet tiddlers)
			 */
			clearSnippetCache: function() {
				clearCache();
			},

			/**
			 * Insert a snippet by trigger (handles all selections)
			 */
			insertUserSnippet: function(trigger, contentType) {
				if(this._destroyed) return false;

				var snippets = getSnippets(contentType);
				for(var i = 0; i < snippets.length; i++) {
					if(snippets[i].trigger === trigger) {
						var s = snippets[i];
						var view = this.view;
						var selections = view.state.selection.ranges;

						if(_snippetFn && selections.length === 1) {
							// Use CodeMirror's snippet system for single cursor
							var cmTemplate = convertTemplate(s.template);
							_snippetFn(cmTemplate)(view, null, selections[0].from, selections[0].to);
						} else {
							// Multi-cursor or fallback: plain text insertion at all cursors
							var plainText = s.template
								.replace(/\$\{(\d+)(?::([^}]*))?\}/g, function(m, num, def) {
									return def || "";
								})
								.replace(/\$0/g, "");
							var changes = selections.map(function(range) {
								return {
									from: range.from,
									to: range.to,
									insert: plainText
								};
							});
							view.dispatch({
								changes: changes
							});
						}
						return true;
					}
				}
				return false;
			}
		};
	}
};

// ============================================================================
// Exports for other plugins
// ============================================================================

exports.loadUserSnippets = loadUserSnippets;
exports.getSnippets = getSnippets;
exports.clearCache = clearCache;
exports.convertTemplate = convertTemplate;
