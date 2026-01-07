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
// Focus Navigation (Ctrl+. / Ctrl+Shift+.)
// ============================================================================

// Only input-type elements for focus navigation (not buttons/links)
var INPUT_SELECTOR = [
	"textarea:not([disabled])",
	'input:not([disabled]):not([type="button"]):not([type="submit"]):not([type="reset"])',
	"select:not([disabled])",
	'[contenteditable="true"]'
].join(", ");

/**
 * Get all visible input elements in document order
 */
function getInputElements() {
	return Array.prototype.slice.call(
		document.querySelectorAll(INPUT_SELECTOR)
	).filter(function(el) {
		// Filter out hidden elements
		return el.offsetParent !== null;
	});
}

/**
 * Focus the next input element after the editor
 */
function focusNextElement(view) {
	var elements = getInputElements();
	var editorDOM = view.dom;

	// Find the last input element inside the editor
	var editorIndex = -1;
	for(var i = 0; i < elements.length; i++) {
		if(editorDOM.contains(elements[i]) || elements[i] === editorDOM) {
			editorIndex = i;
		}
	}

	// Focus the next element after the editor
	if(editorIndex >= 0 && editorIndex < elements.length - 1) {
		elements[editorIndex + 1].focus();
	} else if(elements.length > 0) {
		// Wrap around to first element
		elements[0].focus();
	}

	return true;
}

/**
 * Focus the previous input element before the editor
 */
function focusPrevElement(view) {
	var elements = getInputElements();
	var editorDOM = view.dom;

	// Find the first input element inside the editor
	var editorIndex = -1;
	for(var i = 0; i < elements.length; i++) {
		if(editorDOM.contains(elements[i]) || elements[i] === editorDOM) {
			editorIndex = i;
			break;
		}
	}

	// Focus the previous element before the editor
	if(editorIndex > 0) {
		elements[editorIndex - 1].focus();
	} else if(elements.length > 0) {
		// Wrap around to last element
		elements[elements.length - 1].focus();
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
		options: options
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

	return context;
}

// ============================================================================
// CodeMirror Engine
// ============================================================================

/**
 * CodeMirror 6 Engine for TiddlyWiki5
 */
function CodeMirrorEngine(options) {
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

	// Core: Read-only compartment
	extensions.push(
		this._compartments.readOnly.of(
			EditorState.readOnly.of(!!options.readOnly)
		)
	);

	// Core: Basic keymap + focus navigation
	var defaultKeymap = (core.commands || {}).defaultKeymap || [];
	var indentWithTab = (core.commands || {}).indentWithTab;

	var km = [];
	if(defaultKeymap.length) km = km.concat(defaultKeymap);
	if(indentWithTab) km.push(indentWithTab);

	// Focus navigation: configurable shortcuts (default: Ctrl+. / Ctrl+Shift+.)
	var focusNextKey = getShortcut(wiki, "focus-next", "Ctrl-.");
	var focusPrevKey = getShortcut(wiki, "focus-prev", "Ctrl-Shift-.");
	if(focusNextKey) {
		km.push({
			key: focusNextKey,
			run: focusNextElement
		});
	}
	if(focusPrevKey) {
		km.push({
			key: focusPrevKey,
			run: focusPrevElement
		});
	}

	if(km.length && cmKeymap) {
		extensions.push(cmKeymap.of(km));
	}

	// Core: Line wrapping
	var lineWrapping = EditorView.lineWrapping;
	if(lineWrapping) {
		extensions.push(lineWrapping);
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
	var spellcheckEnabled = wiki && wiki.getTiddlerText("$:/config/codemirror-6/spellcheck") === "yes";
	// Get language from spellcheck config, default to "en"
	var spellcheckLang = (wiki && wiki.getTiddlerText("$:/config/codemirror-6/spellcheck-lang")) || "en";
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

	// Core: Undo/redo history
	var history = (core.commands || {}).history;
	var historyKeymap = (core.commands || {}).historyKeymap;
	if(history) {
		extensions.push(history());
		if(historyKeymap && cmKeymap) {
			extensions.push(cmKeymap.of(historyKeymap));
		}
	}

	// Core: Bracket matching (with compartment for dynamic toggle)
	var bracketMatching = (core.language || {}).bracketMatching;
	if(bracketMatching && this._compartments.bracketMatching) {
		extensions.push(this._compartments.bracketMatching.of(bracketMatching()));
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

	// Core: Close brackets (with compartment for dynamic toggle)
	// Include curly/typographic quotes and German-style quotes in addition to defaults
	var closeBrackets = (core.autocomplete || {}).closeBrackets;
	var closeBracketsKeymap = (core.autocomplete || {}).closeBracketsKeymap;
	var closeBracketsConfig = {
		// Each entry is a 2-char string: opening + closing bracket
		// Standard: () [] {} '' "" ``
		// Curly quotes: "" ''
		// German quotes: „" ‚'
		brackets: ["()", "[]", "{}", "''", '""', "``", "\u201c\u201d", "\u2018\u2019", "\u201e\u201d", "\u201a\u2019"]
	};
	if(closeBrackets && this._compartments.closeBrackets) {
		extensions.push(this._compartments.closeBrackets.of(closeBrackets(closeBracketsConfig)));
		if(closeBracketsKeymap && cmKeymap) {
			extensions.push(cmKeymap.of(closeBracketsKeymap));
		}
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

	// Core: Multi-cursor support (with compartment for dynamic toggle)
	// Get initial setting from config
	var multiCursorEnabled = wiki && wiki.getTiddlerText("$:/config/codemirror-6/multiCursor", "yes") === "yes";
	var multiCursorExtensions = [];
	if(multiCursorEnabled && EditorState.allowMultipleSelections) {
		multiCursorExtensions.push(EditorState.allowMultipleSelections.of(true));

		// Custom rendering for secondary cursors and selections
		// Uses native browser selection for primary, custom rendering for secondary
		var ViewPlugin = (core.view || {}).ViewPlugin;
		var Decoration = (core.view || {}).Decoration;
		var layer = (core.view || {}).layer;
		var RectangleMarker = (core.view || {}).RectangleMarker;
		var EditorSelection = (core.state || {}).EditorSelection;

		if(ViewPlugin && Decoration && layer && RectangleMarker && EditorSelection) {
			// Decoration for secondary selections (highlights only actual text, not empty lines)
			var secondarySelectionMark = Decoration.mark({
				class: "cm-selectionBackground-secondary"
			});

			// Plugin class for secondary selection highlighting
			var SecondarySelectionClass = function(view) {
				this.decorations = this.buildDecorations(view);
			};
			SecondarySelectionClass.prototype.buildDecorations = function(view) {
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
			};
			SecondarySelectionClass.prototype.update = function(update) {
				if(update.docChanged || update.selectionSet) {
					this.decorations = this.buildDecorations(update.view);
				}
			};

			multiCursorExtensions.push(ViewPlugin.fromClass(SecondarySelectionClass, {
				decorations: function(v) {
					return v.decorations;
				}
			}));

			// Create a cursor-only layer for secondary cursors
			var secondaryCursorLayer = layer({
				above: true,
				markers: function(view) {
					var state = view.state;
					var cursors = [];
					for(var i = 0; i < state.selection.ranges.length; i++) {
						var r = state.selection.ranges[i];
						// Skip the primary selection - let native cursor handle it
						if(r === state.selection.main) continue;
						// Draw cursor for this range
						var cursor = r.empty ? r : EditorSelection.cursor(r.head, r.head > r.anchor ? -1 : 1);
						var pieces = RectangleMarker.forRange(view, "cm-cursor cm-cursor-secondary", cursor);
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
			multiCursorExtensions.push(secondaryCursorLayer);
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
	var trailingWhitespaceEnabled = wiki && wiki.getTiddlerText("$:/config/codemirror-6/showTrailingWhitespace", "no") === "yes";
	var trailingWhitespaceExtensions = [];
	var highlightTrailingWhitespace = (core.view || {}).highlightTrailingWhitespace;
	if(trailingWhitespaceEnabled && highlightTrailingWhitespace) {
		trailingWhitespaceExtensions.push(highlightTrailingWhitespace());
	}
	extensions.push(this._compartments.trailingWhitespace.of(trailingWhitespaceExtensions));

	// Core: Bidirectional text support (with compartment for dynamic toggle)
	// Enables automatic per-line text direction detection (RTL/LTR)
	var bidiEnabled = wiki && wiki.getTiddlerText("$:/config/codemirror-6/bidiPerLine", "no") === "yes";
	var bidiExtensions = [];
	var perLineTextDirection = EditorView.perLineTextDirection;
	if(bidiEnabled && perLineTextDirection) {
		bidiExtensions.push(perLineTextDirection);
	}
	extensions.push(this._compartments.bidi.of(bidiExtensions));

	// Core: Default syntax highlighting (fallback for languages without custom styles)
	// Uses classHighlighter to add CSS classes (.tok-keyword, .tok-string, etc.)
	// so themes can style them via CSS
	var syntaxHighlighting = (core.language || {}).syntaxHighlighting;
	var classHighlighter = (core.lezerHighlight || {}).classHighlighter;
	if(syntaxHighlighting && classHighlighter) {
		extensions.push(syntaxHighlighting(classHighlighter, {
			fallback: true
		}));
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
				if(result) return result;
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
	var autocompletionEnabled = !wiki || wiki.getTiddlerText("$:/config/codemirror-6/autocompletion", "yes") !== "no";
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
	var initialKeymapId = wiki && wiki.getTiddlerText("$:/config/codemirror-6/keymap", "default") || "default";
	var initialKeymapExtensions = [];
	if(initialKeymapId !== "default" && this._keymapPlugins[initialKeymapId]) {
		var keymapPlugin = this._keymapPlugins[initialKeymapId];
		if(isFunction(keymapPlugin.getExtensions)) {
			try {
				initialKeymapExtensions = keymapPlugin.getExtensions(context) || [];
			} catch (_e) {}
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
						// Plugin is NOT active - add empty compartment placeholder
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
				if(self.widget && typeof self.widget.handlePasteEvent === "function") {
					return self.widget.handlePasteEvent(event);
				}
				return false;
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

	this.domNode = document.createElement("div");
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

CodeMirrorEngine.prototype._findPluginCompartment = function(plugin) {
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
};

// ============================================================================
// Internal Methods
// ============================================================================

CodeMirrorEngine.prototype._scheduleEmit = function() {
	var self = this;
	if(this._destroyed) return;

	if(this._debounceHandle !== null) {
		window.clearTimeout(this._debounceHandle);
	}
	this._debounceHandle = window.setTimeout(function() {
		self._debounceHandle = null;
		self._emitNow();
	}, this._debounceMs);
};

CodeMirrorEngine.prototype._emitNow = function() {
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
};

CodeMirrorEngine.prototype._handleBlur = function() {
	if(this._destroyed) return;

	this._emitNow();

	if(this._pendingChange && this._onBlurSave) {
		try {
			this._onBlurSave();
		} catch (_e) {}
	}
};

CodeMirrorEngine.prototype._triggerEvent = function(eventName, data) {
	var handlers = this._eventHandlers[eventName];
	if(!handlers) return;

	for(var i = 0; i < handlers.length; i++) {
		try {
			handlers[i].call(this, data);
		} catch (_e) {}
	}
};

CodeMirrorEngine.prototype._handleSettingsChanged = function(settings) {
	if(this._destroyed) return;

	var core = this.cm;
	var effects = [];

	// Bracket matching
	var bracketMatching = (core.language || {}).bracketMatching;
	if(bracketMatching && this._compartments.bracketMatching) {
		var bmContent = settings.bracketMatching ? bracketMatching() : [];
		effects.push(this._compartments.bracketMatching.reconfigure(bmContent));
	}

	// Close brackets (with curly/typographic quotes and German quotes)
	var closeBrackets = (core.autocomplete || {}).closeBrackets;
	if(closeBrackets && this._compartments.closeBrackets) {
		var cbConfig = {
			// Each entry is a 2-char string: opening + closing bracket
			brackets: ["()", "[]", "{}", "''", '""', "``", "\u201c\u201d", "\u2018\u2019", "\u201e\u201d", "\u201a\u2019"]
		};
		var cbContent = settings.closeBrackets ? closeBrackets(cbConfig) : [];
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
		} else if(newKeymapId === "default") {}

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

			// Custom rendering for secondary cursors and selections
			var mcViewPlugin = (core.view || {}).ViewPlugin;
			var mcDecoration = (core.view || {}).Decoration;
			var mcLayer = (core.view || {}).layer;
			var mcRectMarker = (core.view || {}).RectangleMarker;
			var mcEditorSel = (core.state || {}).EditorSelection;

			if(mcViewPlugin && mcDecoration && mcLayer && mcRectMarker && mcEditorSel) {
				// Secondary selection highlighting
				var mcSelMark = mcDecoration.mark({
					class: "cm-selectionBackground-secondary"
				});
				var McSecondarySelClass = function(view) {
					this.decorations = this.buildDecorations(view);
				};
				McSecondarySelClass.prototype.buildDecorations = function(view) {
					var builder = [];
					var state = view.state;
					for(var i = 0; i < state.selection.ranges.length; i++) {
						var r = state.selection.ranges[i];
						if(r === state.selection.main || r.empty) continue;
						builder.push(mcSelMark.range(r.from, r.to));
					}
					return mcDecoration.set(builder, true);
				};
				McSecondarySelClass.prototype.update = function(update) {
					if(update.docChanged || update.selectionSet) {
						this.decorations = this.buildDecorations(update.view);
					}
				};
				mcExtensions.push(mcViewPlugin.fromClass(McSecondarySelClass, {
					decorations: function(v) {
						return v.decorations;
					}
				}));

				// Secondary cursor layer
				var mcSecondaryCursorLayer = mcLayer({
					above: true,
					markers: function(view) {
						var state = view.state;
						var cursors = [];
						for(var i = 0; i < state.selection.ranges.length; i++) {
							var r = state.selection.ranges[i];
							if(r === state.selection.main) continue;
							var cursor = r.empty ? r : mcEditorSel.cursor(r.head, r.head > r.anchor ? -1 : 1);
							var pieces = mcRectMarker.forRange(view, "cm-cursor cm-cursor-secondary", cursor);
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
				mcExtensions.push(mcSecondaryCursorLayer);
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

	// Bidirectional text support toggle
	if(settings.bidiPerLine !== undefined && this._compartments.bidi) {
		var bidiExtensions = [];
		var EditorView = core.view.EditorView;
		if(settings.bidiPerLine && EditorView.perLineTextDirection) {
			bidiExtensions.push(EditorView.perLineTextDirection);
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
			var spellcheckLang = (wiki && wiki.getTiddlerText("$:/config/codemirror-6/spellcheck-lang")) || "en";
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
};

// ============================================================================
// Event System
// ============================================================================

CodeMirrorEngine.prototype.on = function(eventName, handler) {
	if(!isFunction(handler)) return;
	if(!this._eventHandlers[eventName]) {
		this._eventHandlers[eventName] = [];
	}
	this._eventHandlers[eventName].push(handler);
};

CodeMirrorEngine.prototype.off = function(eventName, handler) {
	var handlers = this._eventHandlers[eventName];
	if(!handlers) return;

	var idx = handlers.indexOf(handler);
	if(idx >= 0) {
		handlers.splice(idx, 1);
	}
};

// ============================================================================
// Core Document API
// ============================================================================

CodeMirrorEngine.prototype.getText = function() {
	if(this._destroyed) return "";
	return this.view.state.doc.toString();
};

/**
 * Set document text and optionally change content type
 * @param {string} text - New document text
 * @param {string=} type - Content type (triggers language switch if changed)
 */
CodeMirrorEngine.prototype.setText = function(text, type) {
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
};

/**
 * Change content type and reconfigure language plugins
 * @param {string} newType - New content type
 */
CodeMirrorEngine.prototype.setType = function(newType) {
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
				}
				// else: plugin becoming inactive - newContent stays []

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
};

/**
 * Get current content type
 * @returns {string|null}
 */
CodeMirrorEngine.prototype.getType = function() {
	return this._currentType;
};

/**
 * Refresh language plugins based on current tiddler state (tags, fields)
 * Call this when the tiddler being edited has changed (e.g., tags added/removed)
 */
CodeMirrorEngine.prototype.refreshLanguageConditions = function() {
	if(this._destroyed) return;

	// Re-read tiddler fields from wiki
	var widget = this.options && this.options.widget;
	var wiki = widget && widget.wiki;
	var tiddlerTitle = this._pluginContext && this._pluginContext.tiddlerTitle;

	if(!wiki || !tiddlerTitle) return;

	var tiddler = wiki.getTiddler(tiddlerTitle);
	if(!tiddler) return;

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
};

CodeMirrorEngine.prototype.focus = function() {
	if(this._destroyed) return;
	this.view.focus();
};

CodeMirrorEngine.prototype.hasFocus = function() {
	if(this._destroyed) return false;
	return this.view.hasFocus;
};

CodeMirrorEngine.prototype.undo = function() {
	if(this._destroyed) return false;
	var core = this.cm;
	var undoCmd = (core.commands || {}).undo;
	if(undoCmd && this.view) {
		return undoCmd(this.view);
	}
	return false;
};

CodeMirrorEngine.prototype.redo = function() {
	if(this._destroyed) return false;
	var core = this.cm;
	var redoCmd = (core.commands || {}).redo;
	if(redoCmd && this.view) {
		return redoCmd(this.view);
	}
	return false;
};

// ============================================================================
// Compartment API
// ============================================================================

CodeMirrorEngine.prototype.reconfigure = function(compartmentName, extension) {
	if(this._destroyed) return;

	var compartment = this._compartments[compartmentName];
	if(!compartment) {
		return;
	}

	this.view.dispatch({
		effects: compartment.reconfigure(extension)
	});
};

CodeMirrorEngine.prototype.setReadOnly = function(readOnly) {
	this.reconfigure("readOnly", this._EditorState.readOnly.of(!!readOnly));
};

CodeMirrorEngine.prototype.getCompartments = function() {
	return Object.keys(this._compartments);
};

CodeMirrorEngine.prototype.getActivePlugins = function() {
	return this._activePlugins.map(function(p) {
		return {
			name: p.name,
			description: p.description || "",
			priority: p.priority || 0
		};
	});
};

// ============================================================================
// Completion Source Registry
// ============================================================================

/**
 * Register a completion source for use by the autocomplete system
 * @param {Function} source - A CM6 completion source function
 * @param {number} priority - Higher priority sources are tried first (default: 0)
 */
CodeMirrorEngine.prototype.registerCompletionSource = function(source, priority) {
	if(!isFunction(source)) return;

	this._completionSources.push({
		source: source,
		priority: priority || 0
	});

	// Sort by priority descending
	this._completionSources.sort(function(a, b) {
		return b.priority - a.priority;
	});
};

/**
 * Get all registered completion sources
 * @returns {Function[]} Array of completion source functions
 */
CodeMirrorEngine.prototype.getCompletionSources = function() {
	return this._completionSources.map(function(entry) {
		return entry.source;
	});
};

// ============================================================================
// TiddlyWiki Compatibility API
// ============================================================================

CodeMirrorEngine.prototype.updateDomNodeText = function(text) {
	this.setText(text);
};

CodeMirrorEngine.prototype.createTextOperation = function(type) {
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
};

CodeMirrorEngine.prototype.executeTextOperation = function(operation) {
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
};

/**
 * Apply text operation with multi-cursor support
 * Uses prefix/suffix from operation to wrap/unwrap all selections (toggle behavior)
 */
CodeMirrorEngine.prototype._applyTextOperation = function(operation) {
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
};

CodeMirrorEngine.prototype.fixHeight = function() {};

CodeMirrorEngine.prototype.refresh = function() {
	if(this._destroyed) return;
	this.view.requestMeasure();
};

// ============================================================================
// Lifecycle
// ============================================================================

CodeMirrorEngine.prototype.destroy = function() {
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
		window.clearTimeout(this._debounceHandle);
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
};

CodeMirrorEngine.prototype.isDestroyed = function() {
	return this._destroyed;
};

/**
 * Dispatch an event to all active plugins
 * @param {string} eventName - The event/hook name (e.g., "onRefresh")
 * @param {...*} args - Arguments to pass to the handler
 */
CodeMirrorEngine.prototype.dispatchPluginEvent = function(eventName) {
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
};

// ============================================================================
// Exports
// ============================================================================

exports.CodeMirrorEngine = CodeMirrorEngine;
exports.discoverPlugins = discoverPlugins;
exports.clearPluginCache = clearPluginCache;
exports.getCM6Core = getCM6Core;
exports.buildPluginContext = buildPluginContext;
exports.PLUGIN_MODULE_TYPE = PLUGIN_MODULE_TYPE;
