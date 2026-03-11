/*\
title: $:/plugins/tiddlywiki/codemirror-6/engine.js
type: application/javascript
module-type: library

Modular CodeMirror 6 engine for TiddlyWiki5.

The engine provides a minimal core and allows plugins to:
- Add API methods to the engine instance
- Register compartments for dynamic reconfiguration
- Provide CodeMirror 6 extensions
- Register event handlers
- Switch language modes dynamically based on tiddler type

Plugin module-type: codemirror6-plugin

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// ============================================================================
// Constants
// ============================================================================

var CORE_LIB_TITLE = "$:/plugins/tiddlywiki/codemirror-6/lib/core.js";
var PLUGIN_MODULE_TYPE = "codemirror6-plugin";

// ============================================================================
// Caches
// ============================================================================

var _pluginCache = null;
var _coreCache = null;
var _plainTextLanguage = null;

// Stateless extension caches - these are identical across all editor instances
var _historyExtension = null;
var _historyKeymapExtension = null;
var _bracketMatchingExtension = null;
var _closeBracketsExtension = null;
var _closeBracketsKeymapExtension = null;
var _completionKeymapExtension = null;
var _syntaxHighlightingExtension = null;
var _defaultKeymapExtension = null;

/**
 * Get or create cached stateless extensions.
 * These extensions don't vary between instances and can be safely shared.
 */
function getCachedExtensions() {
	var core = getCM6Core();
	var cmKeymap = core.view.keymap;

	// History extension (undo/redo)
	if(!_historyExtension) {
		var history = (core.commands || {}).history;
		if(history) {
			_historyExtension = history();
		}
	}

	// History keymap
	if(!_historyKeymapExtension && cmKeymap) {
		var historyKeymap = (core.commands || {}).historyKeymap;
		if(historyKeymap) {
			_historyKeymapExtension = cmKeymap.of(historyKeymap);
		}
	}

	// Bracket matching
	if(!_bracketMatchingExtension) {
		var bracketMatching = (core.language || {}).bracketMatching;
		if(bracketMatching) {
			_bracketMatchingExtension = bracketMatching();
		}
	}

	// Close brackets with TiddlyWiki-specific config
	if(!_closeBracketsExtension) {
		var closeBrackets = (core.autocomplete || {}).closeBrackets;
		if(closeBrackets) {
			_closeBracketsExtension = closeBrackets({
				brackets: ["()", "[]", "{}", "''", '""', "``", "\u201c\u201d", "\u2018\u2019", "\u201e\u201d", "\u201a\u2019"]
			});
		}
	}

	// Close brackets keymap
	if(!_closeBracketsKeymapExtension && cmKeymap) {
		var closeBracketsKeymap = (core.autocomplete || {}).closeBracketsKeymap;
		if(closeBracketsKeymap) {
			_closeBracketsKeymapExtension = cmKeymap.of(closeBracketsKeymap);
		}
	}

	// Completion keymap (Tab/Enter to accept completions)
	if(!_completionKeymapExtension && cmKeymap) {
		var completionKeymap = (core.autocomplete || {}).completionKeymap;
		if(completionKeymap) {
			_completionKeymapExtension = cmKeymap.of(completionKeymap);
		}
	}

	// NOTE: Snippet keymap (Tab/Shift-Tab) is NOT added manually here.
	// CodeMirror automatically adds it via StateEffect.appendConfig when a snippet is applied.
	// The snippetKeymap export is a Facet for customization, not a keymap array.

	// Syntax highlighting with class highlighter
	if(!_syntaxHighlightingExtension) {
		var syntaxHighlighting = (core.language || {}).syntaxHighlighting;
		var classHighlighter = (core.lezerHighlight || {}).classHighlighter;
		if(syntaxHighlighting && classHighlighter) {
			_syntaxHighlightingExtension = syntaxHighlighting(classHighlighter, {
				fallback: true
			});
		}
	}

	// Default keymap (without focus navigation - that needs wiki reference)
	if(!_defaultKeymapExtension && cmKeymap) {
		var defaultKeymap = (core.commands || {}).defaultKeymap || [];
		var indentWithTab = (core.commands || {}).indentWithTab;
		var km = [];
		if(defaultKeymap.length) km = km.concat(defaultKeymap);
		if(indentWithTab) km.push(indentWithTab);
		if(km.length) {
			_defaultKeymapExtension = cmKeymap.of(km);
		}
	}

	return {
		history: _historyExtension,
		historyKeymap: _historyKeymapExtension,
		bracketMatching: _bracketMatchingExtension,
		closeBrackets: _closeBracketsExtension,
		closeBracketsKeymap: _closeBracketsKeymapExtension,
		completionKeymap: _completionKeymapExtension,
		syntaxHighlighting: _syntaxHighlightingExtension,
		defaultKeymap: _defaultKeymapExtension
	};
}

// ============================================================================
// Utility Functions
// ============================================================================

function isNumber(n) {
	return typeof n === "number" && isFinite(n);
}

function isString(s) {
	return typeof s === "string";
}

function isFunction(f) {
	return typeof f === "function";
}

function isArray(a) {
	return Array.isArray(a);
}

function isObject(o) {
	return o !== null && typeof o === "object" && !isArray(o);
}

function clamp(n, min, max) {
	return Math.max(min, Math.min(max, n));
}

/**
 * Convert TiddlyWiki shortcut format to CodeMirror format
 * TW format: "ctrl-shift-Z" (lowercase modifiers)
 * CM format: "Ctrl-Shift-Z" (PascalCase modifiers)
 */
function twShortcutToCM(twShortcut) {
	if(!twShortcut) return null;
	// Split by space for multiple shortcuts, take first one
	var shortcuts = twShortcut.trim().split(/\s+/);
	if(shortcuts.length === 0) return null;

	var shortcut = shortcuts[0];
	// Convert each part to proper case
	return shortcut.split("-").map(function(part) {
		var lower = part.toLowerCase();
		if(lower === "ctrl") return "Ctrl";
		if(lower === "alt") return "Alt";
		if(lower === "shift") return "Shift";
		if(lower === "cmd" || lower === "meta" || lower === "mod") return "Mod";
		// For keys like "enter", "tab", etc., capitalize first letter
		if(part.length > 1 && /^[a-z]+$/.test(part)) {
			return part.charAt(0).toUpperCase() + part.slice(1);
		}
		return part;
	}).join("-");
}

/**
 * Get a keyboard shortcut from wiki config
 * Returns the shortcut in CodeMirror format, or the default if not configured
 */
function getShortcut(wiki, name, defaultShortcut) {
	if(!wiki) return defaultShortcut;
	var configValue = wiki.getTiddlerText("$:/config/shortcuts/cm6-" + name);
	if(configValue) {
		return twShortcutToCM(configValue);
	}
	return defaultShortcut;
}

function hasWindowTimers() {
	return typeof window !== "undefined" &&
		typeof window.setTimeout === "function" &&
		typeof window.clearTimeout === "function";
}

// ============================================================================
// VS Code-style Keymap (for default keymap)
// ============================================================================

/**
 * Build VS Code-style keybindings not included in CodeMirror's defaultKeymap.
 * Only used when keymap setting is "default" (not vim/emacs).
 */
function buildVSCodeKeymap(core) {
	var commands = core.commands || {};
	var km = [];

	// Line operations
	if(commands.copyLineDown) km.push({
		key: "Ctrl-Shift-d",
		run: commands.copyLineDown
	});
	if(commands.copyLineUp) km.push({
		key: "Ctrl-Shift-Alt-d",
		run: commands.copyLineUp
	});
	if(commands.deleteLine) km.push({
		key: "Ctrl-Shift-k",
		run: commands.deleteLine
	});
	if(commands.moveLineUp) km.push({
		key: "Alt-ArrowUp",
		run: commands.moveLineUp
	});
	if(commands.moveLineDown) km.push({
		key: "Alt-ArrowDown",
		run: commands.moveLineDown
	});
	if(commands.insertBlankLine) km.push({
		key: "Ctrl-Enter",
		run: commands.insertBlankLine
	});

	// Selection
	if(commands.selectLine) km.push({
		key: "Ctrl-l",
		run: commands.selectLine
	});

	// Navigation
	if(commands.cursorMatchingBracket) km.push({
		key: "Ctrl-Shift-\\",
		run: commands.cursorMatchingBracket
	});

	// Comments
	if(commands.toggleComment) km.push({
		key: "Ctrl-/",
		run: commands.toggleComment
	});
	if(commands.toggleBlockComment) km.push({
		key: "Ctrl-Shift-a",
		run: commands.toggleBlockComment
	});

	return km;
}

// ============================================================================
// Focus Navigation (Ctrl+. / Ctrl+Shift+.)
// ============================================================================

// All focusable elements for focus navigation (respects tabindex)
var FOCUSABLE_SELECTOR = [
	'input:not([disabled]):not([tabindex="-1"])',
	'textarea:not([disabled]):not([tabindex="-1"])',
	'select:not([disabled]):not([tabindex="-1"])',
	'button:not([disabled]):not([tabindex="-1"])',
	'a[href]:not([tabindex="-1"])',
	'[tabindex]:not([tabindex="-1"]):not([disabled])',
	'[contenteditable="true"]:not([tabindex="-1"])'
].join(", ");

/**
 * Get all visible focusable elements sorted by tabindex (browser tab order)
 * @param {Document} doc - The document to search in
 * @returns {Element[]} Array of focusable elements in tab order
 */
function getFocusableElements(doc) {
	var allFocusables = Array.prototype.slice.call(
		doc.querySelectorAll(FOCUSABLE_SELECTOR)
	).filter(function(el) {
		// Filter out hidden elements
		return el.offsetParent !== null;
	});

	// Sort by tabindex (browser order: positive tabindex first in order, then 0/none in DOM order)
	var withPositiveTabindex = [];
	var withZeroOrNoTabindex = [];

	for(var i = 0; i < allFocusables.length; i++) {
		var el = allFocusables[i];
		var ti = parseInt(el.getAttribute("tabindex"), 10);
		if(ti > 0) {
			withPositiveTabindex.push({
				el: el,
				tabindex: ti
			});
		} else {
			withZeroOrNoTabindex.push(el);
		}
	}

	// Sort positive tabindex elements by their tabindex value
	withPositiveTabindex.sort(function(a, b) {
		return a.tabindex - b.tabindex;
	});

	// Build final ordered list: positive tabindex first, then zero/none in DOM order
	var result = [];
	for(var j = 0; j < withPositiveTabindex.length; j++) {
		result.push(withPositiveTabindex[j].el);
	}
	for(var k = 0; k < withZeroOrNoTabindex.length; k++) {
		result.push(withZeroOrNoTabindex[k]);
	}

	return result;
}

/**
 * Find the editor's index in the focusable elements list
 * @param {Element[]} focusables - Array of focusable elements
 * @param {Element} editorDOM - The editor's DOM element
 * @returns {number} Index of the editor, or -1 if not found
 */
function findEditorIndex(focusables, editorDOM) {
	for(var i = 0; i < focusables.length; i++) {
		if(focusables[i] === editorDOM ||
			editorDOM.contains(focusables[i]) ||
			focusables[i].contains(editorDOM)) {
			return i;
		}
	}
	return -1;
}

/**
 * Focus the next focusable element after the editor
 */
function focusNextElement(view) {
	var doc = view.dom.ownerDocument || document;
	var focusables = getFocusableElements(doc);
	var editorDOM = view.dom;

	// Find the editor in the focusables list
	var editorIndex = findEditorIndex(focusables, editorDOM);

	// Focus the next element after the editor
	var nextIndex = editorIndex + 1;
	if(nextIndex >= 0 && nextIndex < focusables.length) {
		focusables[nextIndex].focus();
	} else if(focusables.length > 0) {
		// Wrap around to first element
		focusables[0].focus();
	}

	return true;
}

/**
 * Focus the previous focusable element before the editor
 */
function focusPrevElement(view) {
	var doc = view.dom.ownerDocument || document;
	var focusables = getFocusableElements(doc);
	var editorDOM = view.dom;

	// Find the editor in the focusables list
	var editorIndex = findEditorIndex(focusables, editorDOM);

	// Focus the previous element before the editor
	var prevIndex = editorIndex - 1;
	if(prevIndex >= 0) {
		focusables[prevIndex].focus();
	} else if(focusables.length > 0) {
		// Wrap around to last element
		focusables[focusables.length - 1].focus();
	}

	return true;
}

// ============================================================================
// Core Library Loading
// ============================================================================

function getCM6Core() {
	if(_coreCache) return _coreCache;

	try {
		var core = require(CORE_LIB_TITLE);
		if(core && core.state && core.view) {
			_coreCache = core;
			return core;
		}
	} catch (_e) {
		// Fall through
	}

	if($tw && $tw.browser && typeof window !== "undefined") {
		if(window.CM6CORE && window.CM6CORE.state && window.CM6CORE.view) {
			_coreCache = window.CM6CORE;
			return _coreCache;
		}
		if(window.CM && window.CM.state && window.CM.view) {
			_coreCache = window.CM;
			return _coreCache;
		}
	}

	throw new Error(
		"CM6 core library not found. Provide " + CORE_LIB_TITLE +
		" exporting {state, view, commands, history, ...}."
	);
}

/**
 * Get or create a "plain text" language with no syntax highlighting.
 * This is used when switching away from a language to clear highlighting.
 * @returns {Language|null} A Language that produces no syntax tokens
 */
function getPlainTextLanguage() {
	if(_plainTextLanguage) return _plainTextLanguage;

	var core = getCM6Core();
	var Language = core.language && core.language.Language;
	var defineLanguageFacet = core.language && core.language.defineLanguageFacet;
	var NodeType = core.lezerCommon && core.lezerCommon.NodeType;
	var Tree = core.lezerCommon && core.lezerCommon.Tree;

	if(!Language || !defineLanguageFacet || !NodeType || !Tree) {
		return null;
	}

	// Create a minimal parser that produces an empty tree (just Document node)
	var docType = NodeType.define({
		id: 0,
		name: "Document",
		top: true
	});

	// Implement the Parser interface with startParse method
	var plainParser = {
		startParse: function(input, fragments, ranges) {
			// Calculate total length from ranges or input
			var length = 0;
			if(ranges && ranges.length > 0) {
				for(var i = 0; i < ranges.length; i++) {
					length = Math.max(length, ranges[i].to);
				}
			} else {
				length = input.length;
			}

			// Create the final tree immediately
			var tree = new Tree(docType, [], [], length);

			// Return a PartialParse that is already done
			return {
				stoppedAt: null,
				parsedPos: length,
				stopAt: function() {},
				advance: function() {
					return tree;
				}
			};
		}
	};

	// Create the Language
	var facet = defineLanguageFacet();
	_plainTextLanguage = new Language(facet, plainParser, [], "plaintext");

	return _plainTextLanguage;
}

// ============================================================================
// Plugin System
// ============================================================================

/**
 * Plugin Definition Interface:
 * 
 * {
 *   name: string,                    // Unique plugin name
 *   description?: string,            // Plugin description
 *   priority?: number,               // Load order (higher = first, default 0)
 *   
 *   // Condition for activation (if present, plugin can be dynamically toggled)
 *   condition?: (context) => boolean,
 *   
 *   // Called once when plugin is discovered
 *   init?: (cm6Core) => void,
 *   
 *   // Register compartments (ALWAYS called, even if condition is false)
 *   registerCompartments?: () => { [name: string]: Compartment },
 *   
 *   // Get CM6 extensions (only called when condition is true or no condition)
 *   getExtensions?: (context) => Extension[],
 *   
 *   // Extend engine API (called after view creation, only if active)
 *   extendAPI?: (engine, context) => { [methodName: string]: Function },
 *   
 *   // Register event handlers (only if active)
 *   registerEvents?: (engine, context) => { [eventName: string]: Function },
 *   
 *   // Cleanup when engine is destroyed
 *   destroy?: (engine) => void
 * }
 */

function discoverPlugins() {
	if(_pluginCache) return _pluginCache;

	var plugins = [];
	var seenPluginNames = {}; // Track plugin names to prevent duplicates
	var core = getCM6Core();

	// Use TiddlyWiki's official module iteration API
	if($tw && $tw.modules && isFunction($tw.modules.forEachModuleOfType)) {
		$tw.modules.forEachModuleOfType(PLUGIN_MODULE_TYPE, function(title, pluginModule) {
			try {
				var pluginDef = pluginModule.default || pluginModule.plugin || pluginModule;

				if(pluginDef && (isFunction(pluginDef.getExtensions) ||
						isFunction(pluginDef.extendAPI) ||
						isFunction(pluginDef.registerCompartments) ||
						isFunction(pluginDef.registerEvents))) {
					pluginDef.name = pluginDef.name || title;
					pluginDef.priority = isNumber(pluginDef.priority) ? pluginDef.priority : 0;
					pluginDef._moduleName = title;

					// Check for duplicate plugin names
					if(seenPluginNames[pluginDef.name]) {
						return; // Skip this duplicate
					}
					seenPluginNames[pluginDef.name] = title;

					// Call init if present
					if(isFunction(pluginDef.init)) {
						try {
							pluginDef.init(core);
						} catch (_e) {}
					}

					plugins.push(pluginDef);
				}
			} catch (_e) {}
		});
	} else {}

	// Sort by priority (higher first)
	plugins.sort(function(a, b) {
		return (b.priority || 0) - (a.priority || 0);
	});

	_pluginCache = plugins;
	return plugins;
}

function clearPluginCache() {
	_pluginCache = null;
}

function buildPluginContext(options, engine, overrideType) {
	var context = {
		tiddlerTitle: null,
		tiddlerType: null,
		tiddlerFields: null,
		readOnly: !!options.readOnly,
		cm6Core: getCM6Core(),
		engine: engine,
		options: options,
		hasTagOverride: false // Will be set below if any tag override is active
	};

	if(options.widget) {
		var widget = options.widget;

		if(widget.editTitle) {
			context.tiddlerTitle = widget.editTitle;
		} else if(widget.getAttribute) {
			context.tiddlerTitle = widget.getAttribute("tiddler");
		}

		var wiki = widget.wiki;
		if(context.tiddlerTitle && wiki) {
			var tiddler = wiki.getTiddler(context.tiddlerTitle);
			if(tiddler) {
				context.tiddlerFields = tiddler.fields;
				context.tiddlerType = tiddler.fields.type || "";

				// Check for codemirror-type field override (persistent language switch)
				if(tiddler.fields["codemirror-type"]) {
					context.tiddlerType = tiddler.fields["codemirror-type"];
				}
			}
		}

		if(widget.editField === "text" && !context.tiddlerType) {
			context.tiddlerType = "";
		}
	}

	// Explicit overrides
	if(options.tiddlerType !== undefined) {
		context.tiddlerType = options.tiddlerType;
	}
	if(options.tiddlerTitle !== undefined) {
		context.tiddlerTitle = options.tiddlerTitle;
	}

	// Runtime type override (for setType calls)
	if(overrideType !== undefined) {
		context.tiddlerType = overrideType;
	}

	// Check if any language plugin has a tag override for this tiddler
	// When a tag override is active, type-based language detection is skipped
	// tagOverrideWinner contains the config tiddler path of the winning plugin
	try {
		var utils = require("$:/plugins/tiddlywiki/codemirror-6/utils.js");
		if(utils && utils.getTagOverrideWinner) {
			context.tagOverrideWinner = utils.getTagOverrideWinner(context);
			context.hasTagOverride = context.tagOverrideWinner !== null;
		}
	} catch (_e) {}

	return context;
}

// ============================================================================
// CodeMirror Engine
// ============================================================================

/**
 * CodeMirror 6 Engine for TiddlyWiki5
 */
class CodeMirrorEngine {
	constructor(options) {
		options = options || {};
		var self = this;

		// ========================================================================
		// Validation
		// ========================================================================

		if(!$tw || !$tw.browser) {
			throw new Error("CodeMirrorEngine can only run in the browser.");
		}
		if(!options.parentNode) {
			throw new Error("CodeMirrorEngine requires options.parentNode.");
		}
		if(!hasWindowTimers()) {
			throw new Error("No window timers available.");
		}

		// ========================================================================
		// Instance State
		// ========================================================================

		this.widget = options.widget || null;
		this.parentNode = options.parentNode;
		this.nextSibling = options.nextSibling || null;
		this.options = options;

		// Add registered languages to options for mixed parsing in code blocks
		var core = getCM6Core();
		if(core.getLanguages) {
			this.options.codeLanguages = core.getLanguages();
		}

		// Add placeholder from widget
		if(this.widget && this.widget.editPlaceholder) {
			this.options.placeholder = this.widget.editPlaceholder;
		}

		this._destroyed = false;
		this._pendingChange = false;
		this._debounceMs = isNumber(options.changeDebounceMs) ? clamp(options.changeDebounceMs, 0, 2000) : 50;
		this._debounceHandle = null;
		this._lastEmittedText = isString(options.value) ? options.value : "";

		// Current content type (for language switching)
		this._currentType = null;

		// Callbacks
		this._onChange = isFunction(options.onChange) ? options.onChange : null;
		this._onBlurSave = isFunction(options.onBlurSave) ? options.onBlurSave : null;

		// Event handlers from plugins
		this._eventHandlers = {};

		// All discovered plugins
		this._allPlugins = [];

		// Currently active plugins (condition met)
		this._activePlugins = [];

		// Conditional plugins (have a condition function) - for dynamic switching
		this._conditionalPlugins = [];

		// Completion source registry - plugins register sources here
		this._completionSources = [];

		// completeAnyWord fallback - enabled/disabled via config
		this._completeAnyWordEnabled = false;

		// ========================================================================
		// Load CM6 Core
		// ========================================================================

		var core = getCM6Core();
		this.cm = core;

		var EditorState = core.state.EditorState;
		var EditorView = core.view.EditorView;
		var Compartment = core.state.Compartment;
		var Prec = core.state.Prec;
		var cmKeymap = core.view.keymap;

		this._EditorState = EditorState;
		this._EditorView = EditorView;
		this._Compartment = Compartment;

		// ========================================================================
		// Compartments
		// ========================================================================

		this._compartments = {
			readOnly: new Compartment(),
			indentUnit: new Compartment(),
			tabSize: new Compartment(),
			bracketMatching: new Compartment(),
			closeBrackets: new Compartment(),
			keymap: new Compartment(),
			multiCursor: new Compartment(),
			trailingWhitespace: new Compartment(),
			whitespace: new Compartment(),
			spellcheck: new Compartment(),
			bidi: new Compartment(),
			autocompletion: new Compartment()
		};

		// Track registered keymap plugins for dynamic switching
		this._keymapPlugins = {};

		// ========================================================================
		// Build Initial Context
		// ========================================================================

		var context = buildPluginContext(options, this);
		this._pluginContext = context;
		this._currentType = context.tiddlerType;

		// ========================================================================
		// Process Plugins
		// ========================================================================

		var plugins = options.loadPlugins !== false ? discoverPlugins() : [];
		this._allPlugins = plugins;

		for(var i = 0; i < plugins.length; i++) {
			var plugin = plugins[i];
			var hasCondition = isFunction(plugin.condition);

			try {
				// ALWAYS register compartments (so we can reconfigure later)
				if(isFunction(plugin.registerCompartments)) {
					var pluginCompartments = plugin.registerCompartments();
					if(isObject(pluginCompartments)) {
						for(var compName in pluginCompartments) {
							if(pluginCompartments.hasOwnProperty(compName) && !this._compartments[compName]) {
								this._compartments[compName] = pluginCompartments[compName];
							}
						}
					}
				}

				// Track keymap plugins by their keymapId
				if(isString(plugin.keymapId)) {
					this._keymapPlugins[plugin.keymapId] = plugin;
				}

				// Track conditional plugins separately
				if(hasCondition) {
					this._conditionalPlugins.push(plugin);
				}

				// Check if plugin should be active
				var shouldActivate = true;
				if(hasCondition) {
					shouldActivate = plugin.condition(context);
				}

				if(shouldActivate) {
					this._activePlugins.push(plugin);
				}
			} catch (_e) {}
		}


		// ========================================================================
		// Build Extensions
		// ========================================================================

		var extensions = [];

		// Get cached stateless extensions (shared across all instances)
		var cached = getCachedExtensions();

		// Core: Read-only compartment
		extensions.push(
			this._compartments.readOnly.of(
				EditorState.readOnly.of(!!options.readOnly)
			)
		);

		// Core: Tab/Shift-Tab key handler for completion and snippet navigation
		// Uses Prec.highest to ensure these run before indentWithTab
		var Prec = (core.state || {}).Prec;
		var acceptCompletion = (core.autocomplete || {}).acceptCompletion;
		var completionStatus = (core.autocomplete || {}).completionStatus;
		var nextSnippetField = (core.autocomplete || {}).nextSnippetField;
		var prevSnippetField = (core.autocomplete || {}).prevSnippetField;
		if(Prec && cmKeymap && acceptCompletion && completionStatus) {
			extensions.push(Prec.highest(cmKeymap.of([
				{
					key: "Tab",
					run: function(view) {
						// First: accept completion if popup is active
						if(completionStatus(view.state) === "active") {
							return acceptCompletion(view);
						}
						// Second: navigate to next snippet field if in a snippet
						if(nextSnippetField) {
							return nextSnippetField(view);
						}
						return false; // Let other handlers (indentWithTab) handle it
					}
				},
				{
					key: "Shift-Tab",
					run: function(view) {
						// Navigate to previous snippet field if in a snippet
						if(prevSnippetField) {
							return prevSnippetField(view);
						}
						return false; // Let other handlers handle it
					}
				}
			])));
		}

		// Core: Completion keymap (Enter to accept, Escape to close, arrows to navigate)
		if(cached.completionKeymap) {
			extensions.push(cached.completionKeymap);
		}

		// NOTE: Snippet keymap (Tab/Shift-Tab) is added automatically by CodeMirror
		// when a snippet is applied via StateEffect.appendConfig.

		// Core: Basic keymap (cached) + focus navigation (instance-specific)
		if(cached.defaultKeymap) {
			extensions.push(cached.defaultKeymap);
		}

		// Focus navigation: configurable shortcuts (instance-specific, depends on wiki)
		var focusNextKey = getShortcut(wiki, "focus-next", "Ctrl-.");
		var focusPrevKey = getShortcut(wiki, "focus-prev", "Ctrl-Shift-.");
		var focusNavKeymap = [];
		if(focusNextKey) {
			focusNavKeymap.push({
				key: focusNextKey,
				run: focusNextElement
			});
		}
		if(focusPrevKey) {
			focusNavKeymap.push({
				key: focusPrevKey,
				run: focusPrevElement
			});
		}
		if(focusNavKeymap.length && cmKeymap) {
			extensions.push(cmKeymap.of(focusNavKeymap));
		}

		// Core: Line wrapping
		var lineWrapping = EditorView.lineWrapping;
		if(lineWrapping) {
			extensions.push(lineWrapping);
		}

		// Core: Tooltips configuration - append to document.body to prevent clipping
		// This affects autocomplete popups, hover tooltips, lint markers, etc.
		var tooltips = (core.view || {}).tooltips;
		if(tooltips) {
			var tooltipParent = this.widget && this.widget.document ? this.widget.document.body : document.body;
			extensions.push(tooltips({
				parent: tooltipParent
			}));
		}

		// Core: Set tabindex on the editor content element
		var tabIndex = this.widget && this.widget.editTabIndex;
		if(tabIndex !== undefined && tabIndex !== null) {
			extensions.push(EditorView.contentAttributes.of({
				tabindex: String(tabIndex)
			}));
		}

		// Core: Placeholder text (shown when editor is empty)
		var placeholderFn = (core.view || {}).placeholder;
		if(placeholderFn && this.options.placeholder) {
			extensions.push(placeholderFn(this.options.placeholder));
		}

		// Core: Spellcheck (with compartment for dynamic toggle)
		// Note: Browser spellcheck requires both spellcheck="true" AND a lang attribute
		// to know which dictionary to use. Without lang, most browsers won't underline words.
		var wiki = this.widget && this.widget.wiki;
		var spellcheckEnabled = wiki && wiki.getTiddlerText("$:/config/codemirror-6/editor/spellcheck") === "yes";
		// Get language from spellcheck config, default to "en"
		var spellcheckLang = (wiki && wiki.getTiddlerText("$:/config/codemirror-6/editor/spellcheck-lang")) || "en";
		if(this._compartments.spellcheck) {
			extensions.push(
				this._compartments.spellcheck.of(
					spellcheckEnabled ?
					EditorView.contentAttributes.of({
						spellcheck: "true",
						lang: spellcheckLang,
						autocorrect: "on",
						autocapitalize: "on"
					}) :
					EditorView.contentAttributes.of({
						spellcheck: "false"
					})
				)
			);
		}

		// Core: Undo/redo history (cached)
		if(cached.history) {
			extensions.push(cached.history);
		}
		if(cached.historyKeymap) {
			extensions.push(cached.historyKeymap);
		}

		// Core: Bracket matching (cached extension, compartment for dynamic toggle)
		if(cached.bracketMatching && this._compartments.bracketMatching) {
			extensions.push(this._compartments.bracketMatching.of(cached.bracketMatching));
		}

		// Custom: Auto-close triple braces {{{ → {{{  }}}
		// This handles TiddlyWiki filtered transclusion syntax
		// MUST be before closeBrackets so it gets first chance to handle {
		if(EditorView.inputHandler) {
			extensions.push(EditorView.inputHandler.of(function(view, from, to, text) {
				// Only handle single { insertion
				if(text !== "{") return false;

				// Check if we're completing {{{ (already have {{ before cursor)
				var before = view.state.sliceDoc(Math.max(0, from - 2), from);
				if(before !== "{{") return false;

				// Check what's after the cursor
				var after = view.state.sliceDoc(to, to + 3);

				// Check how many closing braces are already present
				var afterTwo = view.state.sliceDoc(to, to + 2);
				var afterOne = view.state.sliceDoc(to, to + 1);

				var insert;
				if(after === "}}}") {
					// Already have }}}, just add { + spaces to make {{{  }}}
					insert = "{  ";
				} else if(afterTwo === "}}") {
					// Already have }}, just add { + space + one } to complete {{{  }}}
					insert = "{  }";
				} else if(afterOne === "}") {
					// Already have one }, add { + space + two }} to complete {{{  }}}
					insert = "{  }}";
				} else {
					// No closing braces yet, add full {  }}}
					insert = "{  }}}";
				}

				view.dispatch({
					changes: {
						from: from,
						to: to,
						insert: insert
					},
					selection: {
						anchor: from + 2
					} // Position after "{ " (the space)
				});
				return true;
			}));
		}

		// Custom: Auto-close $( → $()$ for TiddlyWiki variable substitution
		// MUST be before closeBrackets so it gets first chance to handle (
		if(EditorView.inputHandler) {
			extensions.push(EditorView.inputHandler.of(function(view, from, to, text) {
				// Only handle ( insertion
				if(text !== "(") return false;

				// Check if $ is before the cursor
				var charBefore = view.state.sliceDoc(Math.max(0, from - 1), from);
				if(charBefore !== "$") return false;

				// Check what's after the cursor
				var textAfter = view.state.sliceDoc(from, from + 2);

				var insert;
				var cursorPos;

				if(textAfter.indexOf(")$") === 0) {
					// Already has )$ - just insert (
					insert = "(";
					cursorPos = from + 1;
				} else if(textAfter.indexOf(")") === 0) {
					// Has ) but not $ - insert ( and add $ after the )
					view.dispatch({
						changes: [{
								from: from,
								to: from,
								insert: "("
							},
							{
								from: from + 1,
								to: from + 1,
								insert: "$"
							}
						],
						selection: {
							anchor: from + 1
						}
					});
					return true;
				} else {
					// No ) after cursor - insert ()$
					insert = "()$";
					cursorPos = from + 1;
				}

				view.dispatch({
					changes: {
						from: from,
						to: from,
						insert: insert
					},
					selection: {
						anchor: cursorPos
					}
				});
				return true;
			}));
		}

		// Trigger completion when typing inside $(...) variable substitution context
		// BUT only when inside a \define block ($(variable)$ is NOT valid in \procedure, \function, \widget)
		if(EditorView.inputHandler) {
			extensions.push(EditorView.inputHandler.of(function(view, from, _to, text) {
				// Only trigger on word characters (variable names)
				if(!/^\w$/.test(text)) return false;

				var textBefore = view.state.sliceDoc(Math.max(0, from - 20), from);
				// Check if we're inside $( ... pattern (with optional partial name)
				if(!/\$\([\w]*$/.test(textBefore)) return false;

				// Check what's after cursor - should be ) or )$ or empty
				var textAfter = view.state.sliceDoc(from, Math.min(view.state.doc.length, from + 3));
				if(textAfter && textAfter.indexOf(")") !== 0 && textAfter.indexOf(")$") !== 0) {
					return false;
				}

				// Check if we're inside a \define block (NOT \procedure, \function, \widget)
				// $(variable)$ substitution is ONLY valid in \define macros
				var docText = view.state.doc.toString();
				var cursorPos = from;

				// Find the enclosing pragma - must be \define for $(...)$ to be valid
				var isInDefine = false;
				var pragmaRegex = /^\\(define|procedure|function|widget)\s+([^\s(]+)/gm;
				var match;

				while((match = pragmaRegex.exec(docText)) !== null) {
					var pragmaStart = match.index;
					var pragmaType = match[1];
					var pragmaName = match[2];

					// Only \define supports $(variable)$ substitution
					if(pragmaType !== "define") continue;

					// Find the end of this pragma
					var lineEnd = docText.indexOf("\n", pragmaStart);
					if(lineEnd === -1) lineEnd = docText.length;

					var lineText = docText.slice(pragmaStart, lineEnd);

					// Check if it's a multi-line pragma (has \end)
					var endMarker = "\\end";
					var endPos;

					// Look for matching \end (either generic or named)
					var searchStart = lineEnd + 1;
					var endRegex = new RegExp("^\\\\end(?:\\s+" + pragmaName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")?\\s*$", "gm");
					endRegex.lastIndex = searchStart;
					var endMatch = endRegex.exec(docText);

					if(endMatch) {
						endPos = endMatch.index + endMatch[0].length;
					} else {
						// Single-line pragma - content is between ) and end of line
						endPos = lineEnd;
					}

					// Check if cursor is within this pragma body
					if(cursorPos > pragmaStart && cursorPos <= endPos) {
						isInDefine = true;
						break;
					}
				}

				if(!isInDefine) {
					return false; // Not in a \define block, don't trigger completion
				}

				// Let the character be inserted normally, then trigger completion
				var startCompletion = (core.autocomplete || {}).startCompletion;
				var completionStatus = (core.autocomplete || {}).completionStatus;

				if(startCompletion && completionStatus) {
					setTimeout(function() {
						if(completionStatus(view.state) === null) {
							startCompletion(view);
						}
					}, 10);
				}

				return false; // Don't prevent default - let character be inserted
			}));
		}

		// Trigger completion when typing [ in ambiguous contexts
		// This enables filter/img/ext completion suggestions
		if(EditorView.inputHandler) {
			extensions.push(EditorView.inputHandler.of(function(view, from, _to, text) {
				// Only trigger on [ character
				if(text !== "[") return false;

				var textBefore = view.state.sliceDoc(Math.max(0, from - 50), from);

				// Don't trigger if:
				// - Already inside a filter operand: [operator[here
				// - Starting a wiki link: [[
				// - Inside transclusion/macro context
				if(/\[[\w\-:!]+\[[^\]]*$/.test(textBefore)) return false;
				if(/\[$/.test(textBefore)) return false; // Would create [[
				if(/\{\{[^}]*$/.test(textBefore)) return false; // Inside transclusion
				if(/<<[^>]*$/.test(textBefore)) return false; // Inside macro

				// Don't trigger in known filter contexts - let filterOperatorCompletion handle those
				if(/\{\{\{[^}]*$/.test(textBefore)) return false;
				if(/<%(?:if|elseif)\s+[^%]*$/.test(textBefore)) return false;
				if(/filter\s*=\s*["'][^"']*$/.test(textBefore)) return false;

				// Let the [ be inserted, then trigger completion
				var startCompletion = (core.autocomplete || {}).startCompletion;
				var completionStatus = (core.autocomplete || {}).completionStatus;

				if(startCompletion && completionStatus) {
					setTimeout(function() {
						if(completionStatus(view.state) === null) {
							startCompletion(view);
						}
					}, 10);
				}

				return false; // Don't prevent default - let [ be inserted
			}));
		}

		// Core: Close brackets (cached extension, compartment for dynamic toggle)
		if(cached.closeBrackets && this._compartments.closeBrackets) {
			extensions.push(this._compartments.closeBrackets.of(cached.closeBrackets));
		}
		if(cached.closeBracketsKeymap) {
			extensions.push(cached.closeBracketsKeymap);
		}

		// Core: Indent unit (with compartment for dynamic config)
		var indentUnit = (core.language || {}).indentUnit;
		if(indentUnit && this._compartments.indentUnit) {
			extensions.push(this._compartments.indentUnit.of(indentUnit.of("\t"))); // Default: tab
		}

		// Core: Tab size (with compartment for dynamic config)
		if(EditorState.tabSize && this._compartments.tabSize) {
			extensions.push(this._compartments.tabSize.of(EditorState.tabSize.of(4))); // Default: 4
		}

		// Core: Cursor layer (always present - draws primary cursor to enable synced blinking)
		var ViewPlugin = (core.view || {}).ViewPlugin;
		var Decoration = (core.view || {}).Decoration;
		var layer = (core.view || {}).layer;
		var RectangleMarker = (core.view || {}).RectangleMarker;
		var EditorSelection = (core.state || {}).EditorSelection;

		if(layer && RectangleMarker && EditorSelection) {
			// Create a cursor layer for all cursors (primary and secondary)
			var cursorLayer = layer({
				above: true,
				markers: function(view) {
					var state = view.state;
					var cursors = [];
					for(var i = 0; i < state.selection.ranges.length; i++) {
						var r = state.selection.ranges[i];
						var isPrimary = r === state.selection.main;
						var cursorClass = isPrimary ? "cm-cursor cm-cursor-primary" : "cm-cursor cm-cursor-secondary";
						// Draw cursor for this range
						var cursor = r.empty ? r : EditorSelection.cursor(r.head, r.head > r.anchor ? -1 : 1);
						var pieces = RectangleMarker.forRange(view, cursorClass, cursor);
						for(var j = 0; j < pieces.length; j++) {
							cursors.push(pieces[j]);
						}
					}
					return cursors;
				},
				update: function(update, _dom) {
					return update.docChanged || update.selectionSet;
				},
				"class": "cm-cursorLayer"
			});
			extensions.push(cursorLayer);
		}

		// Core: Multi-cursor support (with compartment for dynamic toggle)
		// Get initial setting from config
		var multiCursorEnabled = wiki && wiki.getTiddlerText("$:/config/codemirror-6/editor/multiCursor", "yes") === "yes";
		var multiCursorExtensions = [];
		if(multiCursorEnabled && EditorState.allowMultipleSelections) {
			multiCursorExtensions.push(EditorState.allowMultipleSelections.of(true));

			// Custom rendering for secondary selections
			if(ViewPlugin && Decoration && EditorSelection) {
				// Decoration for secondary selections (highlights only actual text, not empty lines)
				var secondarySelectionMark = Decoration.mark({
					class: "cm-selectionBackground-secondary"
				});

				// Plugin class for secondary selection highlighting
				class SecondarySelectionClass {
					constructor(view) {
						this.decorations = this.buildDecorations(view);
					}

					buildDecorations(view) {
						var builder = [];
						var state = view.state;
						for(var i = 0; i < state.selection.ranges.length; i++) {
							var r = state.selection.ranges[i];
							// Skip primary selection and empty ranges
							if(r === state.selection.main || r.empty) continue;
							builder.push(secondarySelectionMark.range(r.from, r.to));
						}
						// Second argument true = ranges are unsorted, let Decoration.set sort them
						return Decoration.set(builder, true);
					}

					update(update) {
						if(update.docChanged || update.selectionSet) {
							this.decorations = this.buildDecorations(update.view);
						}
					}
				}

				multiCursorExtensions.push(ViewPlugin.fromClass(SecondarySelectionClass, {
					decorations: function(v) {
						return v.decorations;
					}
				}));
			}

			// Add multi-cursor keybindings (configurable, default: Ctrl+Alt+Arrow)
			var addCursorAbove = (core.commands || {}).addCursorAbove;
			var addCursorBelow = (core.commands || {}).addCursorBelow;

			var multiCursorKeymap = [];
			var addCursorUpKey = getShortcut(wiki, "add-cursor-up", "Ctrl-Alt-ArrowUp");
			var addCursorDownKey = getShortcut(wiki, "add-cursor-down", "Ctrl-Alt-ArrowDown");
			if(addCursorAbove && addCursorUpKey) {
				multiCursorKeymap.push({
					key: addCursorUpKey,
					run: addCursorAbove
				});
			}
			if(addCursorBelow && addCursorDownKey) {
				multiCursorKeymap.push({
					key: addCursorDownKey,
					run: addCursorBelow
				});
			}
			if(multiCursorKeymap.length && cmKeymap) {
				multiCursorExtensions.push(cmKeymap.of(multiCursorKeymap));
			}
		}
		extensions.push(this._compartments.multiCursor.of(multiCursorExtensions));

		// Core: Trailing whitespace highlighting (with compartment for dynamic toggle)
		var trailingWhitespaceEnabled = wiki && wiki.getTiddlerText("$:/config/codemirror-6/editor/showTrailingWhitespace", "no") === "yes";
		var trailingWhitespaceExtensions = [];
		var highlightTrailingWhitespace = (core.view || {}).highlightTrailingWhitespace;
		if(trailingWhitespaceEnabled && highlightTrailingWhitespace) {
			trailingWhitespaceExtensions.push(highlightTrailingWhitespace());
		}
		extensions.push(this._compartments.trailingWhitespace.of(trailingWhitespaceExtensions));

		// Core: All whitespace highlighting (with compartment for dynamic toggle)
		var whitespaceEnabled = wiki && wiki.getTiddlerText("$:/config/codemirror-6/editor/showWhitespace", "no") === "yes";
		var whitespaceExtensions = [];
		var highlightWhitespace = (core.view || {}).highlightWhitespace;
		if(whitespaceEnabled && highlightWhitespace) {
			whitespaceExtensions.push(highlightWhitespace());
		}
		extensions.push(this._compartments.whitespace.of(whitespaceExtensions));

		// Core: Bidirectional text support (with compartment for dynamic toggle)
		// Enables automatic per-line text direction detection (RTL/LTR)
		var bidiEnabled = wiki && wiki.getTiddlerText("$:/config/codemirror-6/editor/bidiPerLine", "no") === "yes";
		var bidiExtensions = [];
		var perLineTextDirection = EditorView.perLineTextDirection;
		if(bidiEnabled && perLineTextDirection) {
			bidiExtensions.push(perLineTextDirection.of(true));

			// Auto line direction: adds dir="auto" attribute to each line
			// This enables the browser to auto-detect text direction per line
			var ViewPlugin = (core.view || {}).ViewPlugin;
			var Decoration = (core.view || {}).Decoration;

			if(ViewPlugin && Decoration) {
				var dirAutoDecoration = Decoration.line({
					attributes: {
						dir: "auto"
					}
				});

				var AutoLineDirPlugin = ViewPlugin.define(function(view) {
					return {
						deco: buildViewportLineDeco(view, dirAutoDecoration),
						update: function(update) {
							if(update.docChanged || update.viewportChanged || update.heightChanged) {
								this.deco = buildViewportLineDeco(update.view, dirAutoDecoration);
							}
						}
					};
				}, {
					decorations: function(plugin) {
						return plugin.deco;
					}
				});

				function buildViewportLineDeco(view, deco) {
					var ranges = view.viewportLineBlocks.map(function(lineBlock) {
						return deco.range(lineBlock.from);
					});
					return Decoration.set(ranges);
				}

				bidiExtensions.push(AutoLineDirPlugin);
			}

			// Bidi isolation for syntax elements (only when bidi is enabled)
			// Registers decorated ranges with bidiIsolatedRanges so CodeMirror's bidiSpans()
			// correctly handles mixed RTL/LTR content in links, widgets, macros, etc.
			var syntaxTree = (core.language || {}).syntaxTree;
			var RangeSetBuilder = (core.state || {}).RangeSetBuilder;

			if(syntaxTree && ViewPlugin && Decoration && RangeSetBuilder && EditorView.bidiIsolatedRanges) {
				// Node types that should be bidi-isolated (syntax elements with potentially different direction)
				var bidiIsolateNodes = {
					// Links
					"WikiLink": true,
					"ExtLink": true,
					"Image": true,
					"URL": true,
					// Transclusions
					"Transclusion": true,
					"FilteredTransclusion": true,
					"TransclusionBlock": true,
					"FilteredTransclusionBlock": true,
					// Macros
					"MacroCall": true,
					"MacroCallBlock": true,
					// Widgets
					"Widget": true,
					// Code
					"InlineCode": true,
					// Variables
					"Variable": true
				};

				// Mark decoration with bidiIsolate: null (auto-detect direction from content)
				var bidiIsolateMark = Decoration.mark({
					bidiIsolate: null
				});

				// ViewPlugin that builds bidi isolation decorations from the syntax tree
				var BidiIsolatePlugin = ViewPlugin.fromClass(class {
					constructor(view) {
						this.decorations = this.buildDecorations(view);
					}

					buildDecorations(view) {
						var builder = new RangeSetBuilder();
						var tree = syntaxTree(view.state);

						tree.iterate({
							enter: function(node) {
								if(bidiIsolateNodes[node.name]) {
									builder.add(node.from, node.to, bidiIsolateMark);
								}
							}
						});

						return builder.finish();
					}

					update(update) {
						if(update.docChanged || update.viewportChanged) {
							this.decorations = this.buildDecorations(update.view);
						}
					}
				}, {
					decorations: function(v) {
						return v.decorations;
					}
				});

				// Register the plugin's decorations as bidi isolated ranges
				bidiExtensions.push(BidiIsolatePlugin);
				bidiExtensions.push(EditorView.bidiIsolatedRanges.of(function(view) {
					var plugin = view.plugin(BidiIsolatePlugin);
					return plugin ? plugin.decorations : Decoration.none;
				}));
			}
		}
		extensions.push(this._compartments.bidi.of(bidiExtensions));

		// Core: Default syntax highlighting (cached - fallback for languages without custom styles)
		if(cached.syntaxHighlighting) {
			extensions.push(cached.syntaxHighlighting);
		}

		// Core: Autocompletion sources from engine plugins
		var autocompletionFn = (core.autocomplete || {}).autocompletion;
		var completeAnyWord = (core.autocomplete || {}).completeAnyWord;

		// Store completeAnyWord reference and read initial config
		this._completeAnyWord = completeAnyWord;
		if(options.autocompletion && options.autocompletion.completeAnyWord) {
			this._completeAnyWordEnabled = true;
		}

		// Register plugin completion sources via languageData
		// These get combined with language-specific sources automatically
		// NOTE: languageData.of() callback receives (state, pos, side) and must return an ARRAY
		// IMPORTANT: We cache the result to avoid creating new objects on every call,
		// which would cause CodeMirror to think sources changed and trigger re-evaluation loops
		var self = this;
		var cachedAutocompleteData = [{
			autocomplete: function(context) {
				// Try registered plugin sources first (emoji, snippets, etc.)
				var sources = self.getCompletionSources();
				for(var i = 0; i < sources.length; i++) {
					var result = sources[i](context);
					if(result) {
						return result;
					}
				}
				// completeAnyWord as fallback if enabled
				if(self._completeAnyWordEnabled && self._completeAnyWord) {
					return self._completeAnyWord(context);
				}
				return null;
			}
		}];
		var emptyData = [];
		extensions.push(EditorState.languageData.of(function(_state, _pos, _side) {
			var sources = self.getCompletionSources();
			// Only provide autocomplete if we have sources to offer
			if(sources.length === 0 && !self._completeAnyWordEnabled) {
				return emptyData;
			}
			return cachedAutocompleteData;
		}));

		// Core: Autocompletion UI (with compartment for dynamic toggle)
		var autocompletionEnabled = !wiki || wiki.getTiddlerText("$:/config/codemirror-6/editor/autocompletion", "yes") !== "no";
		var autocompletionExts = [];
		if(autocompletionEnabled && autocompletionFn) {
			autocompletionExts.push(autocompletionFn({
				activateOnTyping: true,
				maxRenderedOptions: 50
			}));
		}
		extensions.push(this._compartments.autocompletion.of(autocompletionExts));

		// Core: Keymap compartment (for vim/emacs dynamic switching)
		// Get initial keymap from config and load extensions from matching plugin
		var initialKeymapId = wiki && wiki.getTiddlerText("$:/config/codemirror-6/editor/keymap", "default") || "default";
		var initialKeymapExtensions = [];
		if(initialKeymapId !== "default" && this._keymapPlugins[initialKeymapId]) {
			var keymapPlugin = this._keymapPlugins[initialKeymapId];
			if(isFunction(keymapPlugin.getExtensions)) {
				try {
					initialKeymapExtensions = keymapPlugin.getExtensions(context) || [];
				} catch (_e) {}
			}
		} else if(initialKeymapId === "default" && cmKeymap) {
			// Add VS Code-style shortcuts for the default keymap
			// These are not included in CodeMirror's defaultKeymap
			var vsCodeKeymap = buildVSCodeKeymap(core);
			if(vsCodeKeymap.length) {
				initialKeymapExtensions.push(cmKeymap.of(vsCodeKeymap));
			}
		}
		this._currentKeymap = initialKeymapId;
		extensions.push(this._compartments.keymap.of(initialKeymapExtensions));

		// Collect extensions from plugins
		//
		// IMPORTANT: Plugins with compartments are responsible for their own compartment.of() calls.
		// The engine does NOT wrap their extensions again (that would cause "Duplicate compartment" error).
		//
		// For inactive conditional plugins: we add an empty compartment so it can be filled later.
		// NOTE: Keymap plugins are now handled via the central keymap compartment above.
		// For active plugins: we add their extensions directly (they manage their own compartment).

		for(var j = 0; j < this._allPlugins.length; j++) {
			var pluginJ = this._allPlugins[j];

			// Skip keymap plugins - they're handled via the central keymap compartment
			if(isString(pluginJ.keymapId)) {
				continue;
			}

			var isActive = this._activePlugins.indexOf(pluginJ) >= 0;
			var hasConditionJ = isFunction(pluginJ.condition);
			var hasCompartment = isFunction(pluginJ.registerCompartments);

			try {
				if(isFunction(pluginJ.getExtensions)) {
					if(hasConditionJ && hasCompartment) {
						// Conditional plugin WITH compartment
						var compartmentName = this._findPluginCompartment(pluginJ);

						if(isActive) {
							// Plugin is active - add its extensions directly
							// The plugin is responsible for using compartment.of() internally
							var pluginExts = pluginJ.getExtensions(context);
							if(isArray(pluginExts)) {
								extensions = extensions.concat(pluginExts);
							}
						} else {
							// Plugin is NOT active - add placeholder compartment
							// This allows reconfiguration later when type changes
							if(compartmentName && this._compartments[compartmentName]) {
								extensions.push(this._compartments[compartmentName].of([]));
							}
						}
					} else if(hasConditionJ && !hasCompartment) {
						// Conditional plugin WITHOUT compartment - can only be added if active (no switching)
						if(isActive) {
							var condExts = pluginJ.getExtensions(context);
							if(isArray(condExts)) {
								extensions = extensions.concat(condExts);
							}
						} else {}
					} else if(isActive) {
						// Unconditional plugin - always add
						var unconditionalExts = pluginJ.getExtensions(context);
						if(isArray(unconditionalExts)) {
							extensions = extensions.concat(unconditionalExts);
						}
					}
				}
			} catch (_e) {}
		}

		// Check if any language plugin is active
		// If not, add plainTextLanguage as a fallback to prevent undefined syntax tree behavior
		var hasActiveLanguagePlugin = false;
		for(var k = 0; k < this._activePlugins.length; k++) {
			var activePlugin = this._activePlugins[k];
			if(activePlugin.name && activePlugin.name.indexOf("lang-") === 0) {
				hasActiveLanguagePlugin = true;
				break;
			}
		}
		if(!hasActiveLanguagePlugin) {
			var fallbackLang = getPlainTextLanguage();
			if(fallbackLang) {
				extensions.push(fallbackLang);
			}
		}

		// User-provided extensions
		if(isArray(options.extensions)) {
			extensions = extensions.concat(options.extensions);
		}

		// ========================================================================
		// Core Update Listener
		// ========================================================================

		extensions.push(
			EditorView.updateListener.of(function(update) {
				if(self._destroyed) return;

				if(update.docChanged) {
					self._pendingChange = true;
					self._scheduleEmit();
					self._triggerEvent("docChanged", update);
				}

				if(update.selectionSet) {
					self._triggerEvent("selectionChanged", update);
				}

				if(update.focusChanged) {
					if(update.view.hasFocus) {
						// Cancel popups if widget has editCancelPopups set
						if(self.widget && self.widget.editCancelPopups && $tw.popup) {
							$tw.popup.cancel(0);
						}
						self._triggerEvent("focus", update);
					} else {
						self._handleBlur();
						self._triggerEvent("blur", update);
					}
				}
			})
		);

		// ========================================================================
		// TiddlyWiki Event Integration
		// ========================================================================

		// Store reference to completionStatus for keyboard handling
		var completionStatus = core.autocomplete && core.autocomplete.completionStatus;

		extensions.push(
			Prec.high(EditorView.domEventHandlers({
				keydown: function(event, view) {
					if(self._destroyed) return false;

					// Priority TiddlyWiki shortcuts first
					if($tw.keyboardManager.handleKeydownEvent(event, {
							onlyPriority: true
						})) {
						return true;
					}

					// Handle Escape key specially
					var isEscape = (event.keyCode === 27) && !event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey;
					if(isEscape) {
						// If completion popup is active or pending, close it and consume the event
						// Status can be: null (no completion), "active" (showing results), "pending" (loading)
						var closeCompletion = core.autocomplete && core.autocomplete.closeCompletion;
						var status = completionStatus ? completionStatus(view.state) : null;
						if(status === "active" || status === "pending") {
							if(closeCompletion) {
								closeCompletion(view);
							}
							event.stopPropagation();
							event.preventDefault();
							return true; // Consume the event - we handled it
						}
					}

					// Check parent keyboard widgets (they have priority over CM keymaps)
					var widget = self.widget;
					while(widget) {
						if(widget.parseTreeNode && widget.parseTreeNode.type === "keyboard") {
							var keyInfoArray = widget.keyInfoArray;
							if($tw.keyboardManager.checkKeyDescriptors(event, keyInfoArray)) {
								return true; // Let keyboard widget handle it
							}
						}
						widget = widget.parentWidget;
					}

					// Fall back to widget's handler
					if(self.widget && typeof self.widget.handleKeydownEvent === "function") {
						return self.widget.handleKeydownEvent(event);
					}
					return false;
				},
				drop: function(event, _view) {
					if(self._destroyed) return false;
					if(self.widget && typeof self.widget.handleDropEvent === "function") {
						return self.widget.handleDropEvent(event);
					}
					return false;
				},
				paste: function(event, _view) {
					if(self._destroyed) return false;
					// Stop propagation to prevent TiddlyWiki's global import handler from triggering
					event.stopPropagation();
					// Only call widget's paste handler if there are files to import
					if(event.clipboardData && event.clipboardData.files && event.clipboardData.files.length > 0) {
						if(self.widget && typeof self.widget.handlePasteEvent === "function") {
							self.widget.handlePasteEvent(event);
							return true; // We handled the file paste
						}
					}
					return false; // Let CodeMirror handle text paste
				},
				click: function(event, _view) {
					if(self._destroyed) return false;
					if(self.widget && typeof self.widget.handleClickEvent === "function") {
						return self.widget.handleClickEvent(event);
					}
					return false;
				}
			}))
		);

		// ========================================================================
		// Create Editor
		// ========================================================================

		// Get document from widget context
		var ownerDocument = this.widget && this.widget.document ? this.widget.document : document;

		this.domNode = ownerDocument.createElement("div");
		this.domNode.className = "tc-editor-codemirror6";

		var initialText = isString(options.value) ? options.value : "";

		this.view = new EditorView({
			state: EditorState.create({
				doc: initialText,
				extensions: extensions
			}),
			parent: this.domNode
		});

		// Insert into DOM
		if(this.nextSibling && this.nextSibling.parentNode === this.parentNode) {
			this.parentNode.insertBefore(this.domNode, this.nextSibling);
		} else {
			this.parentNode.appendChild(this.domNode);
		}

		// Register with widget
		if(this.widget && this.widget.domNodes) {
			this.widget.domNodes.push(this.domNode);
		}

		// ========================================================================
		// Extend API from Active Plugins
		// ========================================================================

		var registeredEventPlugins = {};

		for(var k = 0; k < this._activePlugins.length; k++) {
			var apiPlugin = this._activePlugins[k];

			try {
				if(isFunction(apiPlugin.extendAPI)) {
					var apiMethods = apiPlugin.extendAPI(this, context);
					if(isObject(apiMethods)) {
						for(var methodName in apiMethods) {
							if(apiMethods.hasOwnProperty(methodName) && isFunction(apiMethods[methodName])) {
								if(!this[methodName]) {
									this[methodName] = apiMethods[methodName].bind(this);
								}
							}
						}
					}
				}

				if(isFunction(apiPlugin.registerEvents)) {
					var eventHandlers = apiPlugin.registerEvents(this, context);
					if(isObject(eventHandlers)) {
						for(var eventName in eventHandlers) {
							if(eventHandlers.hasOwnProperty(eventName) && isFunction(eventHandlers[eventName])) {
								this.on(eventName, eventHandlers[eventName]);
							}
						}
					}
					registeredEventPlugins[apiPlugin.name] = true;
				}
			} catch (_e) {}
		}

		// ========================================================================
		// Register Events for Inactive Plugins with Compartments
		// ========================================================================
		// Plugins with compartments need their event handlers registered even when
		// inactive, so they can respond to settingsChanged and be toggled on/off

		var allPlugins = discoverPlugins();
		for(var m = 0; m < allPlugins.length; m++) {
			var inactivePlugin = allPlugins[m];

			// Skip if already registered events (was active)
			if(registeredEventPlugins[inactivePlugin.name]) continue;

			// Only register events for plugins that have compartments (toggleable plugins)
			if(isFunction(inactivePlugin.registerCompartments) && isFunction(inactivePlugin.registerEvents)) {
				try {
					var inactiveEventHandlers = inactivePlugin.registerEvents(this, context);
					if(isObject(inactiveEventHandlers)) {
						for(var inactiveEventName in inactiveEventHandlers) {
							if(inactiveEventHandlers.hasOwnProperty(inactiveEventName) && isFunction(inactiveEventHandlers[inactiveEventName])) {
								this.on(inactiveEventName, inactiveEventHandlers[inactiveEventName]);
							}
						}
					}
				} catch (_e) {}
			}
		}

		// ========================================================================
		// Internal Settings Handler
		// ========================================================================

		// Register internal handler for settingsChanged to reconfigure compartments
		this.on("settingsChanged", this._handleSettingsChanged.bind(this));

		// ========================================================================
		// Autofocus
		// ========================================================================

		if(options.autofocus) {
			this.focus();
		}
	}

	// ============================================================================
	// Internal: Find Plugin's Compartment
	// ============================================================================

	_findPluginCompartment(plugin) {
		// Convention: plugin registers compartment with predictable name
		// e.g., "tiddlywikiLanguage", "markdownLanguage", etc.
		if(isFunction(plugin.registerCompartments)) {
			var comps = plugin.registerCompartments();
			if(isObject(comps)) {
				var names = Object.keys(comps);
				if(names.length > 0) return names[0];
			}
		}
		return null;
	}

	// ============================================================================
	// Internal Methods
	// ============================================================================

	_scheduleEmit() {
		var self = this;
		if(this._destroyed) return;

		// Get window from widget context
		var win = this.widget && this.widget.document ? this.widget.document.defaultView : window;

		if(this._debounceHandle !== null) {
			win.clearTimeout(this._debounceHandle);
		}
		this._debounceHandle = win.setTimeout(function() {
			self._debounceHandle = null;
			self._emitNow();
		}, this._debounceMs);
	}

	_emitNow() {
		if(this._destroyed) return;

		var text = this.view.state.doc.toString();

		if(text === this._lastEmittedText) {
			this._pendingChange = false;
			return;
		}

		this._lastEmittedText = text;
		this._pendingChange = false;

		if(this._onChange) {
			try {
				this._onChange(text);
			} catch (_e) {}
		}

		if(this.widget && typeof this.widget.saveChanges === "function") {
			try {
				this.widget.saveChanges(text);
			} catch (_e) {}
		}
	}

	_handleBlur() {
		if(this._destroyed) return;

		this._emitNow();

		if(this._pendingChange && this._onBlurSave) {
			try {
				this._onBlurSave();
			} catch (_e) {}
		}
	}

	_triggerEvent(eventName, data) {
		var handlers = this._eventHandlers[eventName];
		if(!handlers) return;

		for(var i = 0; i < handlers.length; i++) {
			try {
				handlers[i].call(this, data);
			} catch (_e) {}
		}
	}

	_handleSettingsChanged(settings) {
		if(this._destroyed) return;

		var core = this.cm;
		var effects = [];
		var cached = getCachedExtensions();

		// Bracket matching (use cached extension)
		if(cached.bracketMatching && this._compartments.bracketMatching) {
			var bmContent = settings.bracketMatching ? cached.bracketMatching : [];
			effects.push(this._compartments.bracketMatching.reconfigure(bmContent));
		}

		// Close brackets (use cached extension)
		if(cached.closeBrackets && this._compartments.closeBrackets) {
			var cbContent = settings.closeBrackets ? cached.closeBrackets : [];
			effects.push(this._compartments.closeBrackets.reconfigure(cbContent));
		}

		// Keymap switching (vim/emacs/default)
		if(settings.keymap !== undefined && settings.keymap !== this._currentKeymap) {
			var newKeymapId = settings.keymap || "default";
			var newKeymapExtensions = [];

			if(newKeymapId !== "default" && this._keymapPlugins[newKeymapId]) {
				var keymapPlugin = this._keymapPlugins[newKeymapId];
				if(isFunction(keymapPlugin.getExtensions)) {
					try {
						newKeymapExtensions = keymapPlugin.getExtensions(this._pluginContext) || [];
					} catch (_e) {}
				}
			} else if(newKeymapId === "default") {
				// Add VS Code-style shortcuts for the default keymap
				var cmKeymap = (core.view || {}).keymap;
				if(cmKeymap) {
					var vsCodeKm = buildVSCodeKeymap(core);
					if(vsCodeKm.length) {
						newKeymapExtensions.push(cmKeymap.of(vsCodeKm));
					}
				}
			}

			this._currentKeymap = newKeymapId;
			effects.push(this._compartments.keymap.reconfigure(newKeymapExtensions));
		}

		// Indentation settings
		if(settings.indent) {
			var indentUnit = (core.language || {}).indentUnit;
			var EditorState = core.state.EditorState;

			// Determine indent unit string
			var unitStr = "\t"; // default: tab
			var multiplier = 4; // default size

			if(settings.indent.indentUnitMultiplier) {
				var parsed = parseInt(settings.indent.indentUnitMultiplier, 10);
				if(isFinite(parsed) && parsed > 0 && parsed <= 16) {
					multiplier = parsed;
				}
			}

			if(settings.indent.indentUnit === "spaces") {
				unitStr = " ".repeat(multiplier);
			}

			// Reconfigure indent unit
			if(indentUnit && this._compartments.indentUnit) {
				effects.push(this._compartments.indentUnit.reconfigure(indentUnit.of(unitStr)));
			}

			// Reconfigure tab size (visual width)
			if(EditorState && EditorState.tabSize && this._compartments.tabSize) {
				effects.push(this._compartments.tabSize.reconfigure(EditorState.tabSize.of(multiplier)));
			}
		}

		// Multi-cursor toggle
		if(settings.multiCursor !== undefined && this._compartments.multiCursor) {
			var mcEnabled = settings.multiCursor;
			var mcExtensions = [];
			if(mcEnabled && core.state.EditorState.allowMultipleSelections) {
				mcExtensions.push(core.state.EditorState.allowMultipleSelections.of(true));

				// Custom rendering for secondary selections
				var mcViewPlugin = (core.view || {}).ViewPlugin;
				var mcDecoration = (core.view || {}).Decoration;

				if(mcViewPlugin && mcDecoration) {
					// Secondary selection highlighting
					var mcSelMark = mcDecoration.mark({
						class: "cm-selectionBackground-secondary"
					});
					class McSecondarySelClass {
						constructor(view) {
							this.decorations = this.buildDecorations(view);
						}

						buildDecorations(view) {
							var builder = [];
							var state = view.state;
							for(var i = 0; i < state.selection.ranges.length; i++) {
								var r = state.selection.ranges[i];
								if(r === state.selection.main || r.empty) continue;
								builder.push(mcSelMark.range(r.from, r.to));
							}
							return mcDecoration.set(builder, true);
						}

						update(update) {
							if(update.docChanged || update.selectionSet) {
								this.decorations = this.buildDecorations(update.view);
							}
						}
					}
					mcExtensions.push(mcViewPlugin.fromClass(McSecondarySelClass, {
						decorations: function(v) {
							return v.decorations;
						}
					}));
				}

				// Re-add keybindings (configurable)
				var mcAddAbove = (core.commands || {}).addCursorAbove;
				var mcAddBelow = (core.commands || {}).addCursorBelow;
				var mcKeymap = [];
				var mcWiki = this.widget && this.widget.wiki;
				var mcAddCursorUpKey = getShortcut(mcWiki, "add-cursor-up", "Ctrl-Alt-ArrowUp");
				var mcAddCursorDownKey = getShortcut(mcWiki, "add-cursor-down", "Ctrl-Alt-ArrowDown");
				if(mcAddAbove && mcAddCursorUpKey) {
					mcKeymap.push({
						key: mcAddCursorUpKey,
						run: mcAddAbove
					});
				}
				if(mcAddBelow && mcAddCursorDownKey) {
					mcKeymap.push({
						key: mcAddCursorDownKey,
						run: mcAddBelow
					});
				}
				if(mcKeymap.length && core.view.keymap) {
					mcExtensions.push(core.view.keymap.of(mcKeymap));
				}
			} else {}
			effects.push(this._compartments.multiCursor.reconfigure(mcExtensions));
		}

		// Trailing whitespace highlighting toggle
		if(settings.showTrailingWhitespace !== undefined && this._compartments.trailingWhitespace) {
			var twEnabled = settings.showTrailingWhitespace;
			var twExtensions = [];
			var highlightTrailingWhitespace = (core.view || {}).highlightTrailingWhitespace;
			if(twEnabled && highlightTrailingWhitespace) {
				twExtensions.push(highlightTrailingWhitespace());
			}
			effects.push(this._compartments.trailingWhitespace.reconfigure(twExtensions));
		}

		// All whitespace highlighting toggle
		if(settings.showWhitespace !== undefined && this._compartments.whitespace) {
			var wsEnabled = settings.showWhitespace;
			var wsExtensions = [];
			var highlightWhitespace = (core.view || {}).highlightWhitespace;
			if(wsEnabled && highlightWhitespace) {
				wsExtensions.push(highlightWhitespace());
			}
			effects.push(this._compartments.whitespace.reconfigure(wsExtensions));
		}

		// Bidirectional text support toggle
		if(settings.bidiPerLine !== undefined && this._compartments.bidi) {
			var bidiExtensions = [];
			var EditorView = core.view.EditorView;
			if(settings.bidiPerLine && EditorView.perLineTextDirection) {
				bidiExtensions.push(EditorView.perLineTextDirection.of(true));

				// Auto line direction: adds dir="auto" attribute to each line
				var ViewPlugin = (core.view || {}).ViewPlugin;
				var Decoration = (core.view || {}).Decoration;

				if(ViewPlugin && Decoration) {
					var dirAutoDecoration = Decoration.line({
						attributes: {
							dir: "auto"
						}
					});

					var AutoLineDirPlugin = ViewPlugin.define(function(view) {
						return {
							deco: buildViewportLineDeco(view, dirAutoDecoration),
							update: function(update) {
								if(update.docChanged || update.viewportChanged || update.heightChanged) {
									this.deco = buildViewportLineDeco(update.view, dirAutoDecoration);
								}
							}
						};
					}, {
						decorations: function(plugin) {
							return plugin.deco;
						}
					});

					function buildViewportLineDeco(view, deco) {
						var ranges = view.viewportLineBlocks.map(function(lineBlock) {
							return deco.range(lineBlock.from);
						});
						return Decoration.set(ranges);
					}

					bidiExtensions.push(AutoLineDirPlugin);
				}

				// Bidi isolation for syntax elements (only when bidi is enabled)
				var syntaxTree = (core.language || {}).syntaxTree;
				var RangeSetBuilder = (core.state || {}).RangeSetBuilder;

				if(syntaxTree && ViewPlugin && Decoration && RangeSetBuilder && EditorView.bidiIsolatedRanges) {
					var bidiIsolateNodes = {
						"WikiLink": true,
						"ExtLink": true,
						"Image": true,
						"URL": true,
						"Transclusion": true,
						"FilteredTransclusion": true,
						"TransclusionBlock": true,
						"FilteredTransclusionBlock": true,
						"MacroCall": true,
						"MacroCallBlock": true,
						"Widget": true,
						"InlineCode": true,
						"Variable": true
					};

					var bidiIsolateMark = Decoration.mark({
						bidiIsolate: null
					});

					var BidiIsolatePlugin = ViewPlugin.fromClass(class {
						constructor(view) {
							this.decorations = this.buildDecorations(view);
						}
						buildDecorations(view) {
							var builder = new RangeSetBuilder();
							syntaxTree(view.state).iterate({
								enter: function(node) {
									if(bidiIsolateNodes[node.name]) {
										builder.add(node.from, node.to, bidiIsolateMark);
									}
								}
							});
							return builder.finish();
						}
						update(update) {
							if(update.docChanged || update.viewportChanged) {
								this.decorations = this.buildDecorations(update.view);
							}
						}
					}, {
						decorations: function(v) {
							return v.decorations;
						}
					});

					bidiExtensions.push(BidiIsolatePlugin);
					bidiExtensions.push(EditorView.bidiIsolatedRanges.of(function(view) {
						var plugin = view.plugin(BidiIsolatePlugin);
						return plugin ? plugin.decorations : Decoration.none;
					}));
				}
			}
			effects.push(this._compartments.bidi.reconfigure(bidiExtensions));
		}

		// Autocompletion toggle
		if(settings.autocompletion !== undefined && this._compartments.autocompletion) {
			var autocompletionExts = [];
			var autocompletionFn = (core.autocomplete || {}).autocompletion;
			if(settings.autocompletion && autocompletionFn) {
				autocompletionExts.push(autocompletionFn({
					activateOnTyping: true,
					maxRenderedOptions: 50
				}));
			}
			effects.push(this._compartments.autocompletion.reconfigure(autocompletionExts));
		}

		// Spellcheck toggle
		if(settings.spellcheck !== undefined && this._compartments.spellcheck) {
			var EditorView = core.view.EditorView;
			var wiki = this.widget && this.widget.wiki;
			if(settings.spellcheck) {
				// Get language from spellcheck config, default to "en"
				var spellcheckLang = (wiki && wiki.getTiddlerText("$:/config/codemirror-6/editor/spellcheck-lang")) || "en";
				effects.push(this._compartments.spellcheck.reconfigure(
					EditorView.contentAttributes.of({
						spellcheck: "true",
						lang: spellcheckLang,
						autocorrect: "on",
						autocapitalize: "on"
					})
				));
			} else {
				effects.push(this._compartments.spellcheck.reconfigure(
					EditorView.contentAttributes.of({
						spellcheck: "false"
					})
				));
			}
		}

		// completeAnyWord toggle (no compartment needed, just update the flag)
		if(settings.autocompletion && settings.autocompletion.completeAnyWord !== undefined) {
			this._completeAnyWordEnabled = !!settings.autocompletion.completeAnyWord;
		}

		// Apply all effects
		if(effects.length > 0) {
			this.view.dispatch({
				effects: effects
			});
		}
	}

	// ============================================================================
	// Event System
	// ============================================================================

	on(eventName, handler) {
		if(!isFunction(handler)) return;
		if(!this._eventHandlers[eventName]) {
			this._eventHandlers[eventName] = [];
		}
		this._eventHandlers[eventName].push(handler);
	}

	off(eventName, handler) {
		var handlers = this._eventHandlers[eventName];
		if(!handlers) return;

		var idx = handlers.indexOf(handler);
		if(idx >= 0) {
			handlers.splice(idx, 1);
		}
	}

	// ============================================================================
	// Core Document API
	// ============================================================================

	getText() {
		if(this._destroyed) return "";
		return this.view.state.doc.toString();
	}

	/**
	 * Set document text and optionally change content type
	 * @param {string} text - New document text
	 * @param {string=} type - Content type (triggers language switch if changed)
	 */
	setText(text, type) {
		if(this._destroyed) return;
		if(!isString(text)) text = String(text);

		// Check if type changed - trigger language switch
		if(type !== undefined && type !== this._currentType) {
			this.setType(type);
		}

		var current = this.view.state.doc.toString();

		if(text === current) return;

		// Race condition prevention
		if(this._pendingChange && text === this._lastEmittedText) {
			return;
		}

		var sel = this.view.state.selection.main;
		var newLen = text.length;

		this.view.dispatch({
			changes: {
				from: 0,
				to: this.view.state.doc.length,
				insert: text
			},
			selection: {
				anchor: clamp(sel.anchor, 0, newLen),
				head: clamp(sel.head, 0, newLen)
			}
		});

		this._lastEmittedText = text;
		this._pendingChange = false;
	}

	/**
	 * Change content type and reconfigure language plugins
	 * @param {string} newType - New content type
	 */
	setType(newType) {
		if(this._destroyed) return;

		var oldType = this._currentType;
		if(newType === oldType) return;

		this._currentType = newType;
		if(this._pluginContext) {
			this._pluginContext.tiddlerType = newType;
		}


		// Build new context with updated type
		var context = buildPluginContext(this.options, this, newType);
		this._pluginContext = context;

		// Re-evaluate all conditional plugins
		var effects = [];

		for(var i = 0; i < this._conditionalPlugins.length; i++) {
			var plugin = this._conditionalPlugins[i];
			var wasActive = this._activePlugins.indexOf(plugin) >= 0;
			var shouldBeActive = false;

			try {
				shouldBeActive = plugin.condition(context);
			} catch (_e) {}


			if(wasActive !== shouldBeActive) {
				// Find the compartment for this plugin
				var compartmentName = this._findPluginCompartment(plugin);

				if(compartmentName && this._compartments[compartmentName]) {
					var newContent = [];

					if(shouldBeActive) {
						// Plugin becoming active - get content for compartment
						//
						// Convention: If plugin has getCompartmentContent(), use it (returns raw content)
						// Otherwise, we can't properly reconfigure (plugin uses compartment.of internally)
						//
						if(isFunction(plugin.getCompartmentContent)) {
							try {
								newContent = plugin.getCompartmentContent(context) || [];
								if(!isArray(newContent)) newContent = [newContent];
							} catch (_e) {}
						} else {
							// Fallback: try to use getExtensions, but warn about potential issues
							// This works if the plugin doesn't use compartment.of() in getExtensions()
							try {
								newContent = plugin.getExtensions(context) || [];
								if(!isArray(newContent)) newContent = [newContent];
							} catch (_e) {}
						}
					} else {
						// Plugin becoming inactive
						// For language plugins, use plain text language to clear syntax highlighting
						// Just using [] would leave the old syntax tree cached
						if(compartmentName.slice(-8) === "Language") {
							var plainLang = getPlainTextLanguage();
							if(plainLang) {
								newContent = [plainLang];
							}
						}
						// Non-language plugins get empty array (already set above)
					}

					effects.push(
						this._compartments[compartmentName].reconfigure(newContent)
					);

				} else {}

				// Update active plugins list
				if(shouldBeActive && !wasActive) {
					this._activePlugins.push(plugin);
				} else if(!shouldBeActive && wasActive) {
					var idx = this._activePlugins.indexOf(plugin);
					if(idx >= 0) this._activePlugins.splice(idx, 1);
					// Unregister any completion sources owned by this plugin
					this.unregisterCompletionSourcesForPlugin(plugin);
				}
			}
		}

		// Apply all reconfiguration effects
		if(effects.length > 0) {
			this.view.dispatch({
				effects: effects
			});
		}

		this._triggerEvent("typeChanged", {
			oldType: oldType,
			newType: newType
		});
	}

	/**
	 * Get current content type
	 * @returns {string|null}
	 */
	getType() {
		return this._currentType;
	}

	/**
	 * Refresh language plugins based on current tiddler state (tags, fields, type)
	 * Call this when the tiddler being edited has changed (e.g., tags added/removed, type changed)
	 */
	refreshLanguageConditions() {
		if(this._destroyed) return;

		// Re-read tiddler fields from wiki
		var widget = this.options && this.options.widget;
		var wiki = widget && widget.wiki;
		var tiddlerTitle = this._pluginContext && this._pluginContext.tiddlerTitle;

		if(!wiki || !tiddlerTitle) return;

		var tiddler = wiki.getTiddler(tiddlerTitle);
		if(!tiddler) return;

		// Check if type has changed (check codemirror-type field first, then type field)
		var newType = tiddler.fields["codemirror-type"] || tiddler.fields.type || "";
		var oldType = this._currentType || "";

		if(newType !== oldType) {
			// Type changed - trigger full language switch
			this.setType(newType);
			// Update context fields after type change
			this._pluginContext.tiddlerFields = tiddler.fields;
			return;
		}

		// Check if tags have actually changed
		var oldTags = this._pluginContext.tiddlerFields && this._pluginContext.tiddlerFields.tags;
		var newTags = tiddler.fields.tags;

		// Convert to comparable strings
		var oldTagsStr = isArray(oldTags) ? oldTags.slice().sort().join(",") : "";
		var newTagsStr = isArray(newTags) ? newTags.slice().sort().join(",") : "";

		if(oldTagsStr === newTagsStr) {
			return; // No tag change
		}


		// Update context with new tiddler fields
		this._pluginContext.tiddlerFields = tiddler.fields;

		// Update tag override state for the new tags
		try {
			var utils = require("$:/plugins/tiddlywiki/codemirror-6/utils.js");
			if(utils && utils.getTagOverrideWinner) {
				this._pluginContext.tagOverrideWinner = utils.getTagOverrideWinner(this._pluginContext);
				this._pluginContext.hasTagOverride = this._pluginContext.tagOverrideWinner !== null;
			}
		} catch (_e) {}

		// Re-evaluate all conditional plugins
		var effects = [];
		var context = this._pluginContext;

		for(var i = 0; i < this._conditionalPlugins.length; i++) {
			var plugin = this._conditionalPlugins[i];
			var wasActive = this._activePlugins.indexOf(plugin) >= 0;
			var shouldBeActive = false;

			try {
				shouldBeActive = plugin.condition(context);
			} catch (_e) {}

			if(wasActive !== shouldBeActive) {
				var compartmentName = this._findPluginCompartment(plugin);

				if(compartmentName && this._compartments[compartmentName]) {
					var newContent = [];

					if(shouldBeActive) {
						if(isFunction(plugin.getCompartmentContent)) {
							try {
								newContent = plugin.getCompartmentContent(context) || [];
								if(!isArray(newContent)) newContent = [newContent];
							} catch (_e) {}
						} else if(isFunction(plugin.getExtensions)) {
							try {
								newContent = plugin.getExtensions(context) || [];
								if(!isArray(newContent)) newContent = [newContent];
							} catch (_e) {}
						}
					} else {
						// Plugin becoming inactive
						// For language plugins, use plain text language to clear syntax highlighting
						if(compartmentName.slice(-8) === "Language") {
							var plainLang = getPlainTextLanguage();
							if(plainLang) {
								newContent = [plainLang];
							}
						}
						// Non-language plugins get empty array (already set above)
					}

					effects.push(
						this._compartments[compartmentName].reconfigure(newContent)
					);

				}

				// Update active plugins list
				if(shouldBeActive && !wasActive) {
					this._activePlugins.push(plugin);
				} else if(!shouldBeActive && wasActive) {
					var idx = this._activePlugins.indexOf(plugin);
					if(idx >= 0) this._activePlugins.splice(idx, 1);
					// Unregister any completion sources owned by this plugin
					this.unregisterCompletionSourcesForPlugin(plugin);
				}
			}
		}

		if(effects.length > 0) {
			this.view.dispatch({
				effects: effects
			});
			this._triggerEvent("languageChanged", {
				reason: "tags"
			});
		}
	}

	focus() {
		if(this._destroyed) return;
		this.view.focus();
	}

	hasFocus() {
		if(this._destroyed) return false;
		return this.view.hasFocus;
	}

	undo() {
		if(this._destroyed) return false;
		var core = this.cm;
		var undoCmd = (core.commands || {}).undo;
		if(undoCmd && this.view) {
			return undoCmd(this.view);
		}
		return false;
	}

	redo() {
		if(this._destroyed) return false;
		var core = this.cm;
		var redoCmd = (core.commands || {}).redo;
		if(redoCmd && this.view) {
			return redoCmd(this.view);
		}
		return false;
	}

	// ============================================================================
	// Compartment API
	// ============================================================================

	reconfigure(compartmentName, extension) {
		if(this._destroyed) return;

		var compartment = this._compartments[compartmentName];
		if(!compartment) {
			return;
		}

		this.view.dispatch({
			effects: compartment.reconfigure(extension)
		});
	}

	setReadOnly(readOnly) {
		this.reconfigure("readOnly", this._EditorState.readOnly.of(!!readOnly));
	}

	getCompartments() {
		return Object.keys(this._compartments);
	}

	getActivePlugins() {
		return this._activePlugins.map(function(p) {
			return {
				name: p.name,
				description: p.description || "",
				priority: p.priority || 0
			};
		});
	}

	// ============================================================================
	// Completion Source Registry
	// ============================================================================

	/**
	 * Register a completion source for use by the autocomplete system
	 * @param {Function} source - A CM6 completion source function
	 * @param {number} priority - Higher priority sources are tried first (default: 0)
	 * @param {Object} plugin - Optional plugin that owns this source (for automatic cleanup)
	 */
	registerCompletionSource(source, priority, plugin) {
		if(!isFunction(source)) return;

		// Check if already registered (same source and plugin)
		for(var i = 0; i < this._completionSources.length; i++) {
			if(this._completionSources[i].source === source) {
				return; // Already registered
			}
		}

		this._completionSources.push({
			source: source,
			priority: priority || 0,
			plugin: plugin || null
		});

		// Sort by priority descending
		this._completionSources.sort(function(a, b) {
			return b.priority - a.priority;
		});
	}

	/**
	 * Unregister a completion source
	 * @param {Function} source - The completion source to unregister
	 */
	unregisterCompletionSource(source) {
		for(var i = this._completionSources.length - 1; i >= 0; i--) {
			if(this._completionSources[i].source === source) {
				this._completionSources.splice(i, 1);
			}
		}
	}

	/**
	 * Unregister all completion sources owned by a specific plugin
	 * @param {Object} plugin - The plugin whose sources should be unregistered
	 */
	unregisterCompletionSourcesForPlugin(plugin) {
		if(!plugin) return;
		for(var i = this._completionSources.length - 1; i >= 0; i--) {
			if(this._completionSources[i].plugin === plugin) {
				this._completionSources.splice(i, 1);
			}
		}
	}

	/**
	 * Get all registered completion sources
	 * @returns {Function[]} Array of completion source functions
	 */
	getCompletionSources() {
		return this._completionSources.map(function(entry) {
			return entry.source;
		});
	}

	// ============================================================================
	// TiddlyWiki Compatibility API
	// ============================================================================

	updateDomNodeText(text) {
		this.setText(text);
	}

	createTextOperation(type) {
		if(this._destroyed) return null;

		var state = this.view.state;
		var sel = state.selection.main;
		var doc = state.doc;

		// Build selections array for all cursors
		var selections = [];
		for(var i = 0; i < state.selection.ranges.length; i++) {
			var range = state.selection.ranges[i];
			selections.push({
				from: range.from,
				to: range.to,
				text: doc.sliceString(range.from, range.to)
			});
		}

		return {
			type: type,
			text: doc.toString(),
			// Primary selection (backwards compatibility)
			selStart: sel.from,
			selEnd: sel.to,
			selection: doc.sliceString(sel.from, sel.to),
			// Multi-cursor: all selections
			selections: selections,
			// Output fields
			replacement: null,
			cutStart: null,
			cutEnd: null,
			newSelStart: null,
			newSelEnd: null
		};
	}

	executeTextOperation(operation) {
		if(this._destroyed || !operation) return this.getText();

		var _self = this;
		var type = operation.type;

		switch(type) {
			case "focus-editor":
				this.focus();
				break;

			case "replace-all":
				if(operation.text !== null && operation.text !== undefined) {
					this.view.dispatch({
						changes: {
							from: 0,
							to: this.view.state.doc.length,
							insert: String(operation.text)
						}
					});
				}
				break;

			case "set-selection":
				if(isNumber(operation.newSelStart)) {
					this.view.dispatch({
						selection: {
							anchor: operation.newSelStart,
							head: isNumber(operation.newSelEnd) ? operation.newSelEnd : operation.newSelStart
						}
					});
				}
				break;

			case "save":
				this._emitNow();
				break;

			case "undo":
				if(this.undo) this.undo();
				break;

			case "redo":
				if(this.redo) this.redo();
				break;

			default:
				// TiddlyWiki operations set cutStart/cutEnd for the range to replace,
				// and replacement for the new text. Fall back to selStart/selEnd if not set.
				if(operation.replacement !== null && operation.replacement !== undefined) {
					this._applyTextOperation(operation);
				} else if(isNumber(operation.newSelStart)) {
					// No replacement but new selection requested
					var docLen = this.view.state.doc.length;
					this.view.dispatch({
						selection: {
							anchor: clamp(operation.newSelStart, 0, docLen),
							head: clamp(isNumber(operation.newSelEnd) ? operation.newSelEnd : operation.newSelStart, 0, docLen)
						}
					});
				}
				this._triggerEvent("textOperation", operation);
		}

		// Always restore focus after text operation
		this.focus();

		return this.getText();
	}

	/**
	 * Apply text operation with multi-cursor support
	 * Uses prefix/suffix from operation to wrap/unwrap all selections (toggle behavior)
	 */
	_applyTextOperation(operation) {
		var state = this.view.state;
		var EditorSelection = this.cm.state.EditorSelection;
		var doc = state.doc;

		// Get the operation parameters from main selection
		var mainCutStart = isNumber(operation.cutStart) ? operation.cutStart :
			isNumber(operation.selStart) ? operation.selStart :
			state.selection.main.from;
		var mainCutEnd = isNumber(operation.cutEnd) ? operation.cutEnd :
			isNumber(operation.selEnd) ? operation.selEnd :
			mainCutStart;
		var replacement = String(operation.replacement);
		var mainNewSelStart = isNumber(operation.newSelStart) ? operation.newSelStart : mainCutStart + replacement.length;
		var mainNewSelEnd = isNumber(operation.newSelEnd) ? operation.newSelEnd : mainNewSelStart;

		// For single cursor, use simple dispatch
		if(state.selection.ranges.length === 1) {
			this.view.dispatch({
				changes: {
					from: mainCutStart,
					to: mainCutEnd,
					insert: replacement
				},
				selection: {
					anchor: mainNewSelStart,
					head: mainNewSelEnd
				}
			});
			return;
		}

		// Multi-cursor: Check if we have prefix/suffix for wrap-style operation
		var prefix = isString(operation.prefix) ? operation.prefix : null;
		var suffix = isString(operation.suffix) ? operation.suffix : null;

		// If no prefix/suffix, fall back to single dispatch on main selection only
		if(prefix === null || suffix === null) {
			this.view.dispatch({
				changes: {
					from: mainCutStart,
					to: mainCutEnd,
					insert: replacement
				},
				selection: {
					anchor: mainNewSelStart,
					head: mainNewSelEnd
				}
			});
			return;
		}

		// Use changeByRange to apply toggle logic to each selection independently
		// Each selection is checked: if it has markers -> remove them, otherwise -> add them
		this.view.dispatch(
			state.changeByRange(function(range) {
				var selStart = range.from;
				var selEnd = range.to;
				var selText = doc.sliceString(selStart, selEnd);
				var textBefore = selStart >= prefix.length ? doc.sliceString(selStart - prefix.length, selStart) : "";
				var textAfter = selEnd + suffix.length <= doc.length ? doc.sliceString(selEnd, selEnd + suffix.length) : "";

				var newContent;
				var cutStart = selStart;
				var cutEnd = selEnd;
				var newSelStart, newSelEnd;

				if(selStart === selEnd) {
					// Empty selection: toggle prefix+suffix at cursor
					if(textBefore === prefix && doc.sliceString(selStart, selStart + suffix.length) === suffix) {
						// Remove existing prefix+suffix
						cutStart = selStart - prefix.length;
						cutEnd = selStart + suffix.length;
						newContent = "";
						newSelStart = cutStart;
						newSelEnd = cutStart;
					} else {
						// Insert prefix+suffix, cursor between them
						newContent = prefix + suffix;
						newSelStart = selStart + prefix.length;
						newSelEnd = newSelStart;
					}
				} else if(selText.substring(0, prefix.length) === prefix &&
					selText.substring(selText.length - suffix.length) === suffix) {
					// Markers inside selection: remove them
					newContent = selText.substring(prefix.length, selText.length - suffix.length);
					newSelStart = selStart;
					newSelEnd = selStart + newContent.length;
				} else if(textBefore === prefix && textAfter === suffix) {
					// Markers outside selection: expand cut range and remove them
					cutStart = selStart - prefix.length;
					cutEnd = selEnd + suffix.length;
					newContent = selText;
					newSelStart = cutStart;
					newSelEnd = cutStart + newContent.length;
				} else {
					// No markers: add them
					newContent = prefix + selText + suffix;
					newSelStart = selStart;
					newSelEnd = selStart + newContent.length;
				}

				return {
					changes: {
						from: cutStart,
						to: cutEnd,
						insert: newContent
					},
					range: EditorSelection.range(newSelStart, newSelEnd)
				};
			})
		);
	}

	fixHeight() {}

	refresh() {
		if(this._destroyed) return;
		this.view.requestMeasure();
	}

	// ============================================================================
	// Lifecycle
	// ============================================================================

	destroy() {
		if(this._destroyed) return;
		this._destroyed = true;

		for(var i = 0; i < this._activePlugins.length; i++) {
			var plugin = this._activePlugins[i];
			if(isFunction(plugin.destroy)) {
				try {
					plugin.destroy(this);
				} catch (_e) {}
			}
		}

		if(this._debounceHandle !== null) {
			var win = this.widget && this.widget.document ? this.widget.document.defaultView : window;
			win.clearTimeout(this._debounceHandle);
			this._debounceHandle = null;
		}

		try {
			if(this.view) this.view.destroy();
		} catch (_e) {}

		try {
			if(this.domNode && this.domNode.parentNode) {
				this.domNode.parentNode.removeChild(this.domNode);
			}
		} catch (_e) {}

		this.view = null;
		this.domNode = null;
		this.widget = null;
		this._compartments = null;
		this._eventHandlers = null;
		this._activePlugins = null;
		this._conditionalPlugins = null;
		this._allPlugins = null;
	}

	isDestroyed() {
		return this._destroyed;
	}

	/**
	 * Dispatch an event to all active plugins
	 * @param {string} eventName - The event/hook name (e.g., "onRefresh")
	 * @param {...*} args - Arguments to pass to the handler
	 */
	dispatchPluginEvent(eventName) {
		if(this._destroyed || !this._activePlugins) return;

		var args = Array.prototype.slice.call(arguments, 1);

		for(var i = 0; i < this._activePlugins.length; i++) {
			var plugin = this._activePlugins[i];
			if(isFunction(plugin[eventName])) {
				try {
					plugin[eventName].apply(plugin, args);
				} catch (_e) {}
			}
		}
	}

} // End of CodeMirrorEngine class

// ============================================================================
// Exports
// ============================================================================

exports.CodeMirrorEngine = CodeMirrorEngine;
exports.discoverPlugins = discoverPlugins;
exports.clearPluginCache = clearPluginCache;
exports.getCM6Core = getCM6Core;
exports.buildPluginContext = buildPluginContext;
exports.PLUGIN_MODULE_TYPE = PLUGIN_MODULE_TYPE;
