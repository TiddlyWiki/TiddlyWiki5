/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/edit-text/engine.js
type: application/javascript
module-type: library

Minimal CodeMirror 6 engine for TiddlyWiki5 - SimpleEngine API compatible
With syntax highlighting and autocompletion support

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var CORE_LIB_TITLE = "$:/plugins/tiddlywiki/codemirror-6/lib/core.js";
var PLUGIN_MODULE_TYPE = "codemirror6-plugin";

var _coreCache = null;
var _pluginCache = null;

// Stateless extension caches - these are identical across all SimpleEngine instances
var _historyExtension = null;
var _historyKeymapExtension = null;
var _bracketMatchingExtension = null;
var _closeBracketsExtension = null;
var _closeBracketsKeymapExtension = null;
var _syntaxHighlightingExtension = null;
var _defaultKeymapExtension = null;

/**
 * Get or create cached stateless extensions for SimpleEngine.
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

	// Default keymap
	if(!_defaultKeymapExtension && cmKeymap) {
		var defaultKeymap = (core.commands || {}).defaultKeymap || [];
		if(defaultKeymap.length) {
			_defaultKeymapExtension = cmKeymap.of(defaultKeymap);
		}
	}

	return {
		history: _historyExtension,
		historyKeymap: _historyKeymapExtension,
		bracketMatching: _bracketMatchingExtension,
		closeBrackets: _closeBracketsExtension,
		closeBracketsKeymap: _closeBracketsKeymapExtension,
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
	} catch (e) {}

	if($tw && $tw.browser && typeof window !== "undefined") {
		if(window.CM6CORE && window.CM6CORE.state && window.CM6CORE.view) {
			_coreCache = window.CM6CORE;
			return _coreCache;
		}
	}

	throw new Error("CM6 core library not found.");
}

// ============================================================================
// Plugin System (simplified from main engine)
// ============================================================================

function discoverPlugins() {
	if(_pluginCache) return _pluginCache;

	var plugins = [];
	var core = getCM6Core();

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

					if(isFunction(pluginDef.init)) {
						try {
							pluginDef.init(core);
						} catch (e) {}
					}

					plugins.push(pluginDef);
				}
			} catch (e) {}
		});
	}

	plugins.sort(function(a, b) {
		return (b.priority || 0) - (a.priority || 0);
	});

	_pluginCache = plugins;
	return plugins;
}

function buildPluginContext(options, engine) {
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

				if(tiddler.fields["codemirror-type"]) {
					context.tiddlerType = tiddler.fields["codemirror-type"];
				}
			}
		}

		if(widget.editField === "text" && !context.tiddlerType) {
			context.tiddlerType = "";
		}
	}

	if(options.tiddlerType !== undefined) {
		context.tiddlerType = options.tiddlerType;
	}
	if(options.tiddlerTitle !== undefined) {
		context.tiddlerTitle = options.tiddlerTitle;
	}

	return context;
}

// ============================================================================
// CodeMirror Simple Engine
// ============================================================================

class CodeMirrorSimpleEngine {
	constructor(options) {
		options = options || {};
		var self = this;

		// Browser check - this engine only works in the browser
		if(!$tw || !$tw.browser) {
			throw new Error("CodeMirrorSimpleEngine can only run in the browser.");
		}

		this.widget = options.widget;
		this.parentNode = options.parentNode;
		this.nextSibling = options.nextSibling;
		this.options = options;

		// Determine mode: input (single-line) or textarea (multi-line)
		var tag = (this.widget && this.widget.editTag) || "input";
		this.isInputMode = (tag !== "textarea");

		var core = getCM6Core();
		var EditorState = core.state.EditorState;
		var EditorView = core.view.EditorView;
		var Compartment = core.state.Compartment;
		var Prec = core.state.Prec;
		var cmKeymap = core.view.keymap;

		this.cm = core;
		this._compartments = {
			keymap: new Compartment(),
			bracketMatching: new Compartment(),
			closeBrackets: new Compartment(),
			spellcheck: new Compartment(),
			indentUnit: new Compartment(),
			tabSize: new Compartment(),
			trailingWhitespace: new Compartment(),
			whitespace: new Compartment(),
			multiCursor: new Compartment(),
			bidi: new Compartment(),
			autocompletion: new Compartment(),
			tabBehavior: new Compartment()
		};
		this._activePlugins = [];
		this._keymapPlugins = {};
		this._currentKeymap = "default";
		this._tabBehavior = "browser"; // "browser" (default) or "indent"
		this._completionSources = [];
		this._eventHandlers = {};
		this._destroyed = false;

		var extensions = [];

		// ========================================================================
		// Build Plugin Context
		// ========================================================================

		var context = buildPluginContext(options, this);
		context.isSimpleEditor = true;
		context.isInputMode = this.isInputMode;
		// Always use TiddlyWiki language for simple editors
		context.tiddlerType = "text/vnd.tiddlywiki";
		this._pluginContext = context;

		// ========================================================================
		// Process Plugins
		// ========================================================================

		var plugins = discoverPlugins();

		for(var i = 0; i < plugins.length; i++) {
			var plugin = plugins[i];
			var hasCondition = isFunction(plugin.condition);

			try {
				// Register compartments
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

				// Track keymap plugins separately by their keymapId
				if(isString(plugin.keymapId)) {
					this._keymapPlugins[plugin.keymapId] = plugin;
					continue; // Don't add to active plugins - handled separately
				}

				// Check if plugin should be active
				var shouldActivate = true;
				if(hasCondition) {
					shouldActivate = plugin.condition(context);
				}

				if(shouldActivate) {
					this._activePlugins.push(plugin);
				}
			} catch (e) {}
		}

		// ========================================================================
		// Core Extensions
		// ========================================================================

		// Get cached stateless extensions (shared across all instances)
		var cached = getCachedExtensions();

		// Get wiki reference for config lookups
		var wiki = (this.widget && this.widget.wiki) || null;

		// Line wrapping only for textarea mode
		if(!this.isInputMode) {
			extensions.push(EditorView.lineWrapping);
		}

		// Tooltips configuration - append to document.body to prevent clipping
		var tooltips = (core.view || {}).tooltips;
		if(tooltips) {
			var tooltipParent = this.widget && this.widget.document ? this.widget.document.body : document.body;
			extensions.push(tooltips({
				parent: tooltipParent
			}));
		}

		// History (undo/redo) - cached
		if(cached.history) {
			extensions.push(cached.history);
		}
		if(cached.historyKeymap) {
			extensions.push(cached.historyKeymap);
		}

		// Default keymap - cached
		if(cached.defaultKeymap) {
			extensions.push(cached.defaultKeymap);
		}

		// Syntax highlighting (class-based for CSS theming) - cached
		if(cached.syntaxHighlighting) {
			extensions.push(cached.syntaxHighlighting);
		}

		// Bracket matching (cached extension, compartment for dynamic toggle)
		if(cached.bracketMatching) {
			var bmEnabled = !wiki || wiki.getTiddlerText("$:/config/codemirror-6/editor/bracketMatching", "yes") === "yes";
			extensions.push(this._compartments.bracketMatching.of(bmEnabled ? cached.bracketMatching : []));
		}

		// Close brackets (cached extension, compartment for dynamic toggle)
		if(cached.closeBrackets) {
			var cbEnabled = !wiki || wiki.getTiddlerText("$:/config/codemirror-6/editor/closeBrackets", "yes") === "yes";
			var cbExtensions = cbEnabled ? [cached.closeBrackets] : [];
			if(cbEnabled && cached.closeBracketsKeymap) {
				cbExtensions.push(cached.closeBracketsKeymap);
			}
			extensions.push(this._compartments.closeBrackets.of(cbExtensions));
		}

		// Spellcheck (configurable via compartment)
		var spellcheckEnabled = wiki && wiki.getTiddlerText("$:/config/codemirror-6/editor/spellcheck", "no") === "yes";
		extensions.push(this._compartments.spellcheck.of(
			EditorView.contentAttributes.of({
				spellcheck: spellcheckEnabled ? "true" : "false",
				autocorrect: spellcheckEnabled ? "on" : "off",
				autocapitalize: spellcheckEnabled ? "on" : "off"
			})
		));

		// Indentation settings (configurable via compartments)
		var indentUnitFn = (core.language || {}).indentUnit;
		if(indentUnitFn) {
			var indentType = wiki && wiki.getTiddlerText("$:/config/codemirror-6/editor/indentUnit", "tabs");
			var indentMultiplier = 4;
			var multiplierText = wiki && wiki.getTiddlerText("$:/config/codemirror-6/editor/indentUnitMultiplier", "4");
			if(multiplierText) {
				var parsed = parseInt(multiplierText, 10);
				if(isFinite(parsed) && parsed > 0 && parsed <= 16) {
					indentMultiplier = parsed;
				}
			}
			var unitStr = indentType === "spaces" ? " ".repeat(indentMultiplier) : "\t";
			extensions.push(this._compartments.indentUnit.of(indentUnitFn.of(unitStr)));
			extensions.push(this._compartments.tabSize.of(EditorState.tabSize.of(indentMultiplier)));
		}

		// Trailing whitespace highlighting (configurable via compartment)
		var highlightTrailingWhitespace = (core.view || {}).highlightTrailingWhitespace;
		if(highlightTrailingWhitespace) {
			var trailingEnabled = wiki && wiki.getTiddlerText("$:/config/codemirror-6/editor/showTrailingWhitespace", "no") === "yes";
			var trailingExts = trailingEnabled ? [highlightTrailingWhitespace()] : [];
			extensions.push(this._compartments.trailingWhitespace.of(trailingExts));
		}

		// All whitespace highlighting (configurable via compartment)
		var highlightWhitespace = (core.view || {}).highlightWhitespace;
		if(highlightWhitespace) {
			var wsEnabled = wiki && wiki.getTiddlerText("$:/config/codemirror-6/editor/showWhitespace", "no") === "yes";
			var wsExts = wsEnabled ? [highlightWhitespace()] : [];
			extensions.push(this._compartments.whitespace.of(wsExts));
		}

		// Cursor layer (always present - draws all cursors to enable synced blinking)
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

		// Multi-cursor editing (configurable via compartment)
		var multiCursorEnabled = !wiki || wiki.getTiddlerText("$:/config/codemirror-6/editor/multiCursor", "yes") !== "no";
		var multiCursorExts = [];
		if(multiCursorEnabled) {
			// EditorState.allowMultipleSelections.of(true) is needed for multi-cursor
			if(EditorState.allowMultipleSelections) {
				multiCursorExts.push(EditorState.allowMultipleSelections.of(true));
			}

			// Custom rendering for secondary selections
			// Note: All cursors are rendered by the cursor layer above
			var ViewPlugin = (core.view || {}).ViewPlugin;
			var Decoration = (core.view || {}).Decoration;

			if(ViewPlugin && Decoration) {
				// Decoration for secondary selections (highlights only actual text, not empty lines)
				var secondarySelectionMark = Decoration.mark({
					class: "cm-selectionBackground-secondary"
				});

				// Plugin class for secondary selection highlighting
				class SecondarySelectionPlugin {
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

				multiCursorExts.push(ViewPlugin.fromClass(SecondarySelectionPlugin, {
					decorations: function(v) {
						return v.decorations;
					}
				}));
			}

			// Add multi-cursor keybindings only for textarea mode (multi-line)
			if(!this.isInputMode) {
				var addCursorAbove = (core.commands || {}).addCursorAbove;
				var addCursorBelow = (core.commands || {}).addCursorBelow;
				var cmKeymap = (core.view || {}).keymap;

				var multiCursorKeymap = [];
				if(addCursorAbove) {
					multiCursorKeymap.push({
						key: "Ctrl-Alt-ArrowUp",
						run: addCursorAbove
					});
				}
				if(addCursorBelow) {
					multiCursorKeymap.push({
						key: "Ctrl-Alt-ArrowDown",
						run: addCursorBelow
					});
				}
				if(multiCursorKeymap.length && cmKeymap) {
					multiCursorExts.push(cmKeymap.of(multiCursorKeymap));
				}
			}

			// Add rectangular selection keymap
			var rectangularSelection = (core.view || {}).rectangularSelection;
			if(rectangularSelection) {
				multiCursorExts.push(rectangularSelection());
			}
			// Cross-hair cursor for rectangular selection
			var crosshairCursor = (core.view || {}).crosshairCursor;
			if(crosshairCursor) {
				multiCursorExts.push(crosshairCursor());
			}
		}
		extensions.push(this._compartments.multiCursor.of(multiCursorExts));

		// ========================================================================
		// Bidirectional Text Support
		// ========================================================================

		// Enables automatic per-line text direction detection (RTL/LTR)
		var bidiEnabled = wiki && wiki.getTiddlerText("$:/config/codemirror-6/editor/bidiPerLine", "no") === "yes";
		var bidiExtensions = [];
		var perLineTextDirection = EditorView.perLineTextDirection;
		if(bidiEnabled && perLineTextDirection) {
			bidiExtensions.push(perLineTextDirection.of(true));

			// Bidi isolation for syntax elements (only when bidi is enabled)
			// Registers decorated ranges with bidiIsolatedRanges so CodeMirror's bidiSpans()
			// correctly handles mixed RTL/LTR content in links, widgets, macros, etc.
			var syntaxTree = (core.language || {}).syntaxTree;
			var ViewPlugin = (core.view || {}).ViewPlugin;
			var Decoration = (core.view || {}).Decoration;
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

		// ========================================================================
		// Autocompletion
		// ========================================================================

		var autocompletionFn = (core.autocomplete || {}).autocompletion;
		var completeAnyWord = (core.autocomplete || {}).completeAnyWord;
		this._completeAnyWord = completeAnyWord;
		this._wiki = wiki;

		// Register completion sources via languageData
		// Config is checked dynamically for each source on every completion request
		var cachedAutocompleteData = [{
			autocomplete: function(context) {
				var sources = self.getEnabledCompletionSources();
				for(var j = 0; j < sources.length; j++) {
					var result = sources[j](context);
					if(result) return result;
				}
				// Check completeAnyWord config dynamically
				if(self._wiki && self._wiki.getTiddlerText("$:/config/codemirror-6/editor/completeAnyWord", "no") === "yes") {
					if(self._completeAnyWord) {
						return self._completeAnyWord(context);
					}
				}
				return null;
			}
		}];
		var emptyData = [];

		extensions.push(EditorState.languageData.of(function(state, pos, side) {
			var sources = self.getEnabledCompletionSources();
			var completeAnyWordEnabled = self._wiki &&
				self._wiki.getTiddlerText("$:/config/codemirror-6/editor/completeAnyWord", "no") === "yes";
			if(sources.length === 0 && !completeAnyWordEnabled) {
				return emptyData;
			}
			return cachedAutocompleteData;
		}));

		// Autocompletion UI (with compartment for dynamic toggle)
		var autocompletionEnabled = !wiki || wiki.getTiddlerText("$:/config/codemirror-6/editor/autocompletion", "yes") !== "no";
		var autocompletionExts = [];
		if(autocompletionEnabled && autocompletionFn) {
			autocompletionExts.push(autocompletionFn({
				activateOnTyping: true,
				maxRenderedOptions: 50
			}));
		}
		extensions.push(this._compartments.autocompletion.of(autocompletionExts));

		// ========================================================================
		// Plugin Extensions
		// ========================================================================

		for(var k = 0; k < this._activePlugins.length; k++) {
			var activePlugin = this._activePlugins[k];
			try {
				if(isFunction(activePlugin.getExtensions)) {
					var pluginExts = activePlugin.getExtensions(context);
					if(isArray(pluginExts)) {
						extensions = extensions.concat(pluginExts);
					}
				}
			} catch (e) {}
		}

		// ========================================================================
		// Keymap Loading
		// ========================================================================

		// Check for mode-specific keymap, fall back to simple-keymap, then main keymap
		// Fallback chain: input/textarea specific → simple-keymap → main keymap
		var keymapId = "default";
		if(wiki) {
			var modeSpecificConfig = this.isInputMode ?
				"$:/config/codemirror-6/simple/keymap-input" :
				"$:/config/codemirror-6/simple/keymap-textarea";
			keymapId = wiki.getTiddlerText(modeSpecificConfig, "") ||
				wiki.getTiddlerText("$:/config/codemirror-6/simple/keymap", "") ||
				wiki.getTiddlerText("$:/config/codemirror-6/editor/keymap", "default") ||
				"default";
		}

		// Load keymap plugin extensions if a non-default keymap is selected
		var initialKeymapExtensions = [];
		if(keymapId !== "default" && this._keymapPlugins[keymapId]) {
			var keymapPlugin = this._keymapPlugins[keymapId];
			if(isFunction(keymapPlugin.getExtensions)) {
				try {
					initialKeymapExtensions = keymapPlugin.getExtensions(context) || [];
				} catch (e) {}
			}
		}
		this._currentKeymap = keymapId;
		extensions.push(this._compartments.keymap.of(initialKeymapExtensions));

		// ========================================================================
		// Tab Behavior (configurable: "browser" or "indent")
		// ========================================================================

		// Get indentWithTab from commands if available
		var indentWithTab = (core.commands || {}).indentWithTab;

		// Check config for initial tab behavior (default: browser)
		var initialTabBehavior = "browser";
		if(wiki) {
			initialTabBehavior = wiki.getTiddlerText("$:/config/codemirror-6/simple/tabBehavior", "browser");
		}
		this._tabBehavior = initialTabBehavior;

		// Build tab behavior extensions
		var tabBehaviorExtensions = [];
		if(initialTabBehavior === "indent" && indentWithTab) {
			// Use CodeMirror's indent behavior
			tabBehaviorExtensions.push(cmKeymap.of([indentWithTab]));
		} else {
			// Browser behavior: Tab/Shift-Tab pass through for focus navigation
			tabBehaviorExtensions.push(cmKeymap.of([{
					key: "Tab",
					run: function() {
						return false;
					}
				},
				{
					key: "Shift-Tab",
					run: function() {
						return false;
					}
				}
			]));
		}
		extensions.push(Prec.high(this._compartments.tabBehavior.of(tabBehaviorExtensions)));

		// ========================================================================
		// Update Listener
		// ========================================================================

		extensions.push(
			EditorView.updateListener.of(function(update) {
				if(update.docChanged) {
					self._handleInput();
				}
				if(update.focusChanged && update.view.hasFocus) {
					self._handleFocus();
				}
			})
		);

		// ========================================================================
		// TiddlyWiki Event Integration (keyboard widget support)
		// ========================================================================

		extensions.push(
			Prec.high(EditorView.domEventHandlers({
				keydown: function(event, view) {
					// Handle Tab/Shift-Tab based on configured behavior
					if(event.key === "Tab") {
						if(self._tabBehavior === "browser") {
							// Browser mode: explicitly handle focus navigation
							// ContentEditable doesn't naturally support Tab focus navigation
							// Must respect tabindex ordering like real browser behavior
							var direction = event.shiftKey ? -1 : 1;

							// Get document from widget context
							var doc = self.widget && self.widget.document ? self.widget.document : document;

							// Get all focusable elements
							var allFocusables = Array.from(doc.querySelectorAll(
								'input:not([disabled]):not([tabindex="-1"]), ' +
								'textarea:not([disabled]):not([tabindex="-1"]), ' +
								'select:not([disabled]):not([tabindex="-1"]), ' +
								'button:not([disabled]):not([tabindex="-1"]), ' +
								'a[href]:not([tabindex="-1"]), ' +
								'[tabindex]:not([tabindex="-1"]):not([disabled]), ' +
								'[contenteditable="true"]:not([tabindex="-1"])'
							)).filter(function(el) {
								return el.offsetParent !== null; // visible
							});

							// Get our editor's tabindex
							var editorTabIndex = parseInt(self.domNode.getAttribute("tabindex"), 10) || 0;

							// Sort by tabindex (browser order: positive tabindex first in order, then 0/none in DOM order)
							var withPositiveTabindex = [];
							var withZeroOrNoTabindex = [];

							allFocusables.forEach(function(el) {
								var ti = parseInt(el.getAttribute("tabindex"), 10);
								if(ti > 0) {
									withPositiveTabindex.push({
										el: el,
										tabindex: ti
									});
								} else {
									withZeroOrNoTabindex.push(el);
								}
							});

							// Sort positive tabindex elements by their tabindex value
							withPositiveTabindex.sort(function(a, b) {
								return a.tabindex - b.tabindex;
							});

							// Build final ordered list: positive tabindex first, then zero/none in DOM order
							var focusables = withPositiveTabindex.map(function(item) {
								return item.el;
							}).concat(withZeroOrNoTabindex);

							// Find current element in the list
							var currentIndex = -1;
							for(var i = 0; i < focusables.length; i++) {
								if(focusables[i] === view.contentDOM ||
									focusables[i] === view.dom ||
									focusables[i] === self.domNode ||
									self.domNode.contains(focusables[i])) {
									currentIndex = i;
									break;
								}
							}

							var nextIndex = currentIndex + direction;
							if(nextIndex >= 0 && nextIndex < focusables.length) {
								event.preventDefault();
								focusables[nextIndex].focus();
								return true;
							}
							// If no next element, let browser handle (might exit the page)
							return false;
						}
						// indent mode: let CodeMirror keymap handle it
						return false;
					}

					// Get $tw from widget context
					var twGlobal = (self.widget && self.widget.wiki && self.widget.wiki.getTiddlerText) ? $tw : null;

					// Priority TiddlyWiki shortcuts first
					if(twGlobal && twGlobal.keyboardManager.handleKeydownEvent(event, {
							onlyPriority: true
						})) {
						return true;
					}

					// Check parent keyboard widgets (they have priority over CM keymaps)
					var widget = self.widget;
					while(widget) {
						if(widget.parseTreeNode && widget.parseTreeNode.type === "keyboard") {
							var keyInfoArray = widget.keyInfoArray;
							if(twGlobal && twGlobal.keyboardManager.checkKeyDescriptors(event, keyInfoArray)) {
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
				}
			}))
		);

		// ========================================================================
		// Input Mode: Prevent Newlines
		// ========================================================================

		if(this.isInputMode) {
			// Block Enter and Ctrl+Enter keys
			// Propagate arrow keys to parent widgets for popup navigation (only when popup is open)
			extensions.push(
				Prec.highest(EditorView.domEventHandlers({
					keydown: function(event, view) {
						if(event.key === "Enter" && !event.altKey && !event.metaKey) {
							if(self.widget && typeof self.widget.handleKeydownEvent === "function") {
								return self.widget.handleKeydownEvent(event);
							}
							return true;
						}
						// Propagate arrow keys to parent widgets (for $keyboard widget popup navigation)
						// Only when the focusPopup is open (has text in state tiddler)
						if(event.key === "ArrowUp" || event.key === "ArrowDown") {
							if(self.widget && self.widget.editFocusPopup && self.widget.wiki) {
								var popupState = self.widget.wiki.getTiddlerText(self.widget.editFocusPopup, "");
								if(popupState) {
									// Popup is open - propagate to parent
									if(typeof self.widget.handleKeydownEvent === "function") {
										if(self.widget.handleKeydownEvent(event)) {
											return true;
										}
									}
								}
							}
						}
						// Propagate Escape to parent widgets (for closing popups, only when open)
						if(event.key === "Escape") {
							if(self.widget && self.widget.editFocusPopup && self.widget.wiki) {
								var popupState = self.widget.wiki.getTiddlerText(self.widget.editFocusPopup, "");
								if(popupState) {
									if(typeof self.widget.handleKeydownEvent === "function") {
										if(self.widget.handleKeydownEvent(event)) {
											return true;
										}
									}
								}
							}
						}
						return false;
					}
				}))
			);

			// Filter out newlines from any input (paste, etc.)
			extensions.push(
				EditorState.transactionFilter.of(function(tr) {
					if(!tr.docChanged) return tr;

					// Check if any inserted text contains newlines
					var hasNewlines = false;
					tr.changes.iterChanges(function(fromA, toA, fromB, toB, inserted) {
						if(inserted.toString().indexOf("\n") !== -1 || inserted.toString().indexOf("\r") !== -1) {
							hasNewlines = true;
						}
					});

					if(!hasNewlines) return tr;

					// Build new changes with newlines stripped from inserted text
					// The from/to positions are relative to the original document (tr.startState.doc)
					var newChanges = [];
					tr.changes.iterChanges(function(fromA, toA, fromB, toB, inserted) {
						var text = inserted.toString();
						var cleaned = text.replace(/[\r\n]+/g, " ");
						newChanges.push({
							from: fromA,
							to: toA,
							insert: cleaned
						});
					});

					return {
						changes: newChanges,
						selection: tr.selection
					};
				})
			);
		}

		// ========================================================================
		// File Drop Handling
		// ========================================================================

		if(this._isFileDropEnabled && this.widget) {
			extensions.push(
				EditorView.domEventHandlers({
					drop: function(event, view) {
						if(self.widget && typeof self.widget.handleDropEvent === "function") {
							return self.widget.handleDropEvent(event);
						}
						return false;
					},
					paste: function(event, view) {
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
					dragenter: function(event, view) {
						if(self.widget && typeof self.widget.handleDragEnterEvent === "function") {
							return self.widget.handleDragEnterEvent(event);
						}
						return false;
					},
					dragover: function(event, view) {
						if(self.widget && typeof self.widget.handleDragOverEvent === "function") {
							return self.widget.handleDragOverEvent(event);
						}
						return false;
					},
					dragleave: function(event, view) {
						if(self.widget && typeof self.widget.handleDragLeaveEvent === "function") {
							return self.widget.handleDragLeaveEvent(event);
						}
						return false;
					},
					dragend: function(event, view) {
						if(self.widget && typeof self.widget.handleDragEndEvent === "function") {
							return self.widget.handleDragEndEvent(event);
						}
						return false;
					}
				})
			);
		}

		// ========================================================================
		// Paste Event - Stop Propagation
		// ========================================================================

		// Always stop paste event propagation to prevent TiddlyWiki's global import handler
		// This is separate from the file drop handler which may not be enabled
		if(!this._isFileDropEnabled || !this.widget) {
			extensions.push(
				EditorView.domEventHandlers({
					paste: function(event, view) {
						event.stopPropagation();
						return false;
					}
				})
			);
		}

		// ========================================================================
		// Widget Attributes
		// ========================================================================

		// Placeholder
		var placeholderFn = (core.view || {}).placeholder;
		if(placeholderFn && this.widget && this.widget.editPlaceholder) {
			extensions.push(placeholderFn(this.widget.editPlaceholder));
		}

		// TabIndex
		if(this.widget && this.widget.editTabIndex) {
			extensions.push(EditorView.contentAttributes.of({
				tabindex: String(this.widget.editTabIndex)
			}));
		}

		// Autocomplete attribute (HTML autocomplete hint for browser)
		if(this.widget && this.widget.editAutoComplete) {
			extensions.push(EditorView.contentAttributes.of({
				autocomplete: this.widget.editAutoComplete
			}));
		}

		// Disabled state
		if(this.widget && this.widget.isDisabled === "yes") {
			extensions.push(EditorState.readOnly.of(true));
		}

		// Store autoHeight settings for fixHeight method
		this._autoHeight = this.widget ? this.widget.editAutoHeight : true;
		this._minHeight = this.widget ? this.widget.editMinHeight : "100px";

		// Store focus selection settings
		this._focusSelectFromStart = this.widget ? this.widget.editFocusSelectFromStart : 0;
		this._focusSelectFromEnd = this.widget ? this.widget.editFocusSelectFromEnd : 0;

		// Store editSize for input mode styling
		this._editSize = this.widget ? this.widget.editSize : null;

		// Store editRows for textarea mode
		this._editRows = this.widget ? this.widget.editRows : null;

		// Store file drop setting
		this._isFileDropEnabled = this.widget ? this.widget.isFileDropEnabled : false;

		// ========================================================================
		// Create Editor
		// ========================================================================

		// Get document from widget context
		var ownerDocument = this.widget && this.widget.document ? this.widget.document : document;

		this.domNode = ownerDocument.createElement("div");
		this.domNode.className = "tc-editor-codemirror6-simple";
		this.domNode.className += this.isInputMode ?
			" tc-editor-codemirror6-input" :
			" tc-editor-codemirror6-textarea";

		if(this.widget && this.widget.editClass) {
			this.domNode.className += " " + this.widget.editClass;
		}

		// Apply editSize for input mode (affects width)
		if(this.isInputMode && this._editSize) {
			// Size attribute typically affects width in characters
			// Approximate using ch units for monospace or em for proportional
			var sizeNum = parseInt(this._editSize, 10);
			if(isFinite(sizeNum) && sizeNum > 0) {
				this.domNode.style.width = sizeNum + "ch";
			}
		}

		// Apply editRows for textarea mode (affects height)
		if(!this.isInputMode && this._editRows) {
			var rowsNum = parseInt(this._editRows, 10);
			if(isFinite(rowsNum) && rowsNum > 0) {
				// Approximate line height to set min-height
				// Typical line height is about 1.4em
				this.domNode.style.minHeight = (rowsNum * 1.4) + "em";
			}
		}

		var initialText = (options.value !== undefined && options.value !== null) ?
			String(options.value) :
			"";

		if(this.isInputMode) {
			initialText = initialText.replace(/[\r\n]+/g, " ");
		}

		this.view = new EditorView({
			state: EditorState.create({
				doc: initialText,
				extensions: extensions
			}),
			parent: this.domNode
		});

		// Insert into DOM
		this.parentNode.insertBefore(this.domNode, this.nextSibling);
		if(this.widget && this.widget.domNodes) {
			this.widget.domNodes.push(this.domNode);
		}

		// ========================================================================
		// Extend API from Active Plugins
		// ========================================================================

		for(var m = 0; m < this._activePlugins.length; m++) {
			var apiPlugin = this._activePlugins[m];
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
			} catch (e) {}
		}

		// ========================================================================
		// Register Events from Active Plugins
		// ========================================================================

		for(var n = 0; n < this._activePlugins.length; n++) {
			var eventPlugin = this._activePlugins[n];
			try {
				if(isFunction(eventPlugin.registerEvents)) {
					var eventHandlers = eventPlugin.registerEvents(this, context);
					if(isObject(eventHandlers)) {
						for(var eventName in eventHandlers) {
							if(eventHandlers.hasOwnProperty(eventName) && isFunction(eventHandlers[eventName])) {
								this.on(eventName, eventHandlers[eventName]);
							}
						}
					}
				}
			} catch (e) {}
		}
	}

	// ============================================================================
	// Core API
	// ============================================================================

	getText() {
		return this.view ? this.view.state.doc.toString() : "";
	}

	setText(text, type) {
		if(!this.view) return;
		if(this.view.hasFocus && text !== "") return;
		this.updateDomNodeText(text);
	}

	updateDomNodeText(text) {
		if(!this.view) return;

		if(this.isInputMode && text) {
			text = text.replace(/[\r\n]+/g, " ");
		}

		var current = this.view.state.doc.toString();
		if(text === current) return;

		// Flag to prevent inputActions from firing during programmatic updates
		// This matches native HTML behavior where setting input.value doesn't fire 'input' event
		this._isProgrammaticUpdate = true;
		this.view.dispatch({
			changes: {
				from: 0,
				to: this.view.state.doc.length,
				insert: text
			}
		});
		this._isProgrammaticUpdate = false;
	}

	focus() {
		if(!this.view) return;

		this.view.focus();

		// Handle focusSelectFromStart and focusSelectFromEnd
		var docLength = this.view.state.doc.length;
		var selectStart = this._focusSelectFromStart || 0;
		var selectEnd = this._focusSelectFromEnd || 0;

		// Calculate actual positions
		var from = Math.min(selectStart, docLength);
		var to = Math.max(0, docLength - selectEnd);

		// Only set selection if we have valid range
		if(from !== to || from !== 0) {
			this.view.dispatch({
				selection: {
					anchor: from,
					head: to
				}
			});
		}
	}

	fixHeight() {
		if(!this.view || !this.domNode) return;

		// For input mode, height is fixed (single line)
		if(this.isInputMode) return;

		// For textarea mode with autoHeight enabled
		if(this._autoHeight) {
			// Get the content height
			var contentHeight = this.view.contentHeight;
			var minHeight = parseInt(this._minHeight, 10) || 100;

			// If rows is specified, calculate a minimum based on rows
			if(this._editRows) {
				var rowsNum = parseInt(this._editRows, 10);
				if(isFinite(rowsNum) && rowsNum > 0) {
					// Use line height from the view if available, otherwise approximate
					var lineHeight = this.view.defaultLineHeight || 20;
					var rowsHeight = rowsNum * lineHeight;
					minHeight = Math.max(minHeight, rowsHeight);
				}
			}

			// Apply minimum height
			this.domNode.style.minHeight = minHeight + "px";

			// Let CodeMirror handle the rest via CSS
			// The .cm-editor should have height: auto or similar
		}
	}

	// ============================================================================
	// Completion Source Registry
	// ============================================================================

	/**
	 * Register a completion source
	 * @param {function} source - The completion source function
	 * @param {number} priority - Priority (higher = checked first)
	 * @param {string} configTiddler - Optional config tiddler path for dynamic enable/disable
	 */
	registerCompletionSource(source, priority, configTiddler) {
		if(!isFunction(source)) return;

		this._completionSources.push({
			source: source,
			priority: priority || 0,
			configTiddler: configTiddler || null
		});

		this._completionSources.sort(function(a, b) {
			return b.priority - a.priority;
		});
	}

	/**
	 * Get all registered completion sources (regardless of enabled state)
	 */
	getCompletionSources() {
		return this._completionSources.map(function(entry) {
			return entry.source;
		});
	}

	/**
	 * Get only enabled completion sources (checks config tiddlers dynamically)
	 */
	getEnabledCompletionSources() {
		var wiki = this._wiki;
		var enabled = [];

		for(var i = 0; i < this._completionSources.length; i++) {
			var entry = this._completionSources[i];

			// If no config tiddler, always enabled
			if(!entry.configTiddler) {
				enabled.push(entry.source);
				continue;
			}

			// Check config tiddler dynamically
			if(wiki && wiki.getTiddlerText(entry.configTiddler, "yes") === "yes") {
				enabled.push(entry.source);
			}
		}

		return enabled;
	}

	// ============================================================================
	// Event Handlers
	// ============================================================================

	_handleInput() {
		if(this.widget && typeof this.widget.saveChanges === "function") {
			this.widget.saveChanges(this.getText());
		}
		// Only invoke inputActions on actual user input, not programmatic updates
		// This prevents storeTitle from being updated when cycling through popup items
		if(this.widget && this.widget.editInputActions && !this._isProgrammaticUpdate) {
			this.widget.invokeActionString(this.widget.editInputActions, this, null, {
				actionValue: this.getText()
			});
		}
	}

	_handleFocus() {
		if(this.widget && this.widget.editCancelPopups && $tw.popup) {
			$tw.popup.cancel(0);
		}
		if(this.widget && this.widget.editFocusPopup && $tw.popup) {
			$tw.popup.triggerPopup({
				domNode: this.domNode,
				title: this.widget.editFocusPopup,
				wiki: this.widget.wiki,
				force: true
			});
		}
	}

	// ============================================================================
	// Text Operations (no-op for SimpleEngine compatibility)
	// ============================================================================

	createTextOperation() {
		return null;
	}

	executeTextOperation(operation) {}

	// ============================================================================
	// Compartment Management
	// ============================================================================

	reconfigure(compartmentName, extension) {
		if(!this.view) return;

		var compartment = this._compartments[compartmentName];
		if(!compartment) return;

		this.view.dispatch({
			effects: compartment.reconfigure(extension)
		});
	}

	// ============================================================================
	// Keymap Management
	// ============================================================================

	updateKeymap(newKeymapId) {
		if(!this.view || !this._compartments.keymap) return;
		if(newKeymapId === this._currentKeymap) return;

		var newKeymapExtensions = [];
		if(newKeymapId !== "default" && this._keymapPlugins[newKeymapId]) {
			var keymapPlugin = this._keymapPlugins[newKeymapId];
			if(isFunction(keymapPlugin.getExtensions)) {
				try {
					newKeymapExtensions = keymapPlugin.getExtensions(this._pluginContext) || [];
				} catch (e) {}
			}
		}

		this._currentKeymap = newKeymapId;
		this.reconfigure("keymap", newKeymapExtensions);
	}

	// ============================================================================
	// Tab Behavior Management
	// ============================================================================

	/**
	 * Update tab behavior on-the-fly
	 * @param {string} behavior - "browser" (default, Tab moves focus) or "indent" (Tab indents)
	 */
	updateTabBehavior(behavior) {
		if(!this.view || !this._compartments.tabBehavior) return;
		if(behavior === this._tabBehavior) return;

		var core = this.cm;
		var indentWithTab = (core.commands || {}).indentWithTab;
		var cmKeymap = core.view.keymap;
		var tabBehaviorExts = [];

		if(behavior === "indent" && indentWithTab) {
			// Use CodeMirror's indent behavior
			tabBehaviorExts.push(cmKeymap.of([indentWithTab]));
		} else {
			// Browser behavior: Tab/Shift-Tab pass through for focus navigation
			behavior = "browser"; // Normalize to "browser" if not "indent"
			tabBehaviorExts.push(cmKeymap.of([{
					key: "Tab",
					run: function() {
						return false;
					}
				},
				{
					key: "Shift-Tab",
					run: function() {
						return false;
					}
				}
			]));
		}

		this._tabBehavior = behavior;
		this.reconfigure("tabBehavior", tabBehaviorExts);
	}

	/**
	 * Get current tab behavior
	 * @returns {string} "browser" or "indent"
	 */
	getTabBehavior() {
		return this._tabBehavior;
	}

	// ============================================================================
	// Event System
	// ============================================================================

	on(eventName, handler) {
		if(!this._eventHandlers[eventName]) {
			this._eventHandlers[eventName] = [];
		}
		this._eventHandlers[eventName].push(handler);
	}

	_triggerEvent(eventName, data) {
		var handlers = this._eventHandlers[eventName];
		if(!handlers) return;

		for(var i = 0; i < handlers.length; i++) {
			try {
				handlers[i].call(this, data);
			} catch (e) {}
		}
	}

	// ============================================================================
	// Settings Management
	// ============================================================================

	_handleSettingsChanged(settings) {
		if(!this.view) return;

		var core = this.cm;
		var effects = [];
		var cached = getCachedExtensions();

		// Bracket matching (use cached extension)
		if(cached.bracketMatching && this._compartments.bracketMatching && settings.bracketMatching !== undefined) {
			var bmContent = settings.bracketMatching ? cached.bracketMatching : [];
			effects.push(this._compartments.bracketMatching.reconfigure(bmContent));
		}

		// Close brackets (use cached extensions)
		if(cached.closeBrackets && this._compartments.closeBrackets && settings.closeBrackets !== undefined) {
			var cbExtensions = [];
			if(settings.closeBrackets) {
				cbExtensions.push(cached.closeBrackets);
				if(cached.closeBracketsKeymap) {
					cbExtensions.push(cached.closeBracketsKeymap);
				}
			}
			effects.push(this._compartments.closeBrackets.reconfigure(cbExtensions));
		}

		// Spellcheck
		if(this._compartments.spellcheck && settings.spellcheck !== undefined) {
			var spellcheckEnabled = settings.spellcheck;
			effects.push(this._compartments.spellcheck.reconfigure(
				core.view.EditorView.contentAttributes.of({
					spellcheck: spellcheckEnabled ? "true" : "false",
					autocorrect: spellcheckEnabled ? "on" : "off",
					autocapitalize: spellcheckEnabled ? "on" : "off"
				})
			));
		}

		// Indentation settings
		if(settings.indent) {
			var indentUnitFn = (core.language || {}).indentUnit;
			var EditorState = core.state.EditorState;

			var unitStr = "\t";
			var multiplier = 4;

			if(settings.indent.indentUnitMultiplier) {
				var parsed = parseInt(settings.indent.indentUnitMultiplier, 10);
				if(isFinite(parsed) && parsed > 0 && parsed <= 16) {
					multiplier = parsed;
				}
			}

			if(settings.indent.indentUnit === "spaces") {
				unitStr = " ".repeat(multiplier);
			}

			if(indentUnitFn && this._compartments.indentUnit) {
				effects.push(this._compartments.indentUnit.reconfigure(indentUnitFn.of(unitStr)));
			}

			if(EditorState && EditorState.tabSize && this._compartments.tabSize) {
				effects.push(this._compartments.tabSize.reconfigure(EditorState.tabSize.of(multiplier)));
			}
		}

		// Keymap - check mode-specific settings with fallback chain
		// Fallback: input/textarea specific → simple-keymap → main keymap
		var keymapChanged = settings.keymap !== undefined ||
			settings.simpleKeymap !== undefined ||
			settings.simpleKeymapInput !== undefined ||
			settings.simpleKeymapTextarea !== undefined;

		if(keymapChanged) {
			var wiki = this.widget && this.widget.wiki;
			var newKeymapId = "default";
			if(wiki) {
				var modeSpecificConfig = this.isInputMode ?
					"$:/config/codemirror-6/simple/keymap-input" :
					"$:/config/codemirror-6/simple/keymap-textarea";
				newKeymapId = wiki.getTiddlerText(modeSpecificConfig, "") ||
					wiki.getTiddlerText("$:/config/codemirror-6/simple/keymap", "") ||
					wiki.getTiddlerText("$:/config/codemirror-6/editor/keymap", "default") ||
					"default";
			}
			if(newKeymapId !== this._currentKeymap) {
				this.updateKeymap(newKeymapId);
			}
		}

		// Trailing whitespace highlighting
		if(settings.showTrailingWhitespace !== undefined && this._compartments.trailingWhitespace) {
			var highlightTrailingWhitespace = (core.view || {}).highlightTrailingWhitespace;
			var trailingExts = [];
			if(settings.showTrailingWhitespace && highlightTrailingWhitespace) {
				trailingExts.push(highlightTrailingWhitespace());
			}
			effects.push(this._compartments.trailingWhitespace.reconfigure(trailingExts));
		}

		// All whitespace highlighting
		if(settings.showWhitespace !== undefined && this._compartments.whitespace) {
			var highlightWhitespace = (core.view || {}).highlightWhitespace;
			var wsExts = [];
			if(settings.showWhitespace && highlightWhitespace) {
				wsExts.push(highlightWhitespace());
			}
			effects.push(this._compartments.whitespace.reconfigure(wsExts));
		}

		// Multi-cursor editing
		if(settings.multiCursor !== undefined && this._compartments.multiCursor) {
			var EditorState = core.state.EditorState;
			var multiCursorExts = [];
			if(settings.multiCursor) {
				if(EditorState.allowMultipleSelections) {
					multiCursorExts.push(EditorState.allowMultipleSelections.of(true));
				}

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

					class McSecondarySelectionPlugin {
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

					multiCursorExts.push(mcViewPlugin.fromClass(McSecondarySelectionPlugin, {
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
					multiCursorExts.push(mcSecondaryCursorLayer);
				}

				var rectangularSelection = (core.view || {}).rectangularSelection;
				if(rectangularSelection) {
					multiCursorExts.push(rectangularSelection());
				}
				var crosshairCursor = (core.view || {}).crosshairCursor;
				if(crosshairCursor) {
					multiCursorExts.push(crosshairCursor());
				}
			}
			effects.push(this._compartments.multiCursor.reconfigure(multiCursorExts));
		}

		// Bidirectional text support toggle
		if(settings.bidiPerLine !== undefined && this._compartments.bidi) {
			var bidiExtensions = [];
			var EditorView = core.view.EditorView;
			if(settings.bidiPerLine && EditorView.perLineTextDirection) {
				bidiExtensions.push(EditorView.perLineTextDirection.of(true));

				// Bidi isolation for syntax elements (only when bidi is enabled)
				var syntaxTree = (core.language || {}).syntaxTree;
				var ViewPlugin = (core.view || {}).ViewPlugin;
				var Decoration = (core.view || {}).Decoration;
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

		// Tab behavior toggle ("browser" or "indent")
		if(settings.tabBehavior !== undefined && this._compartments.tabBehavior) {
			if(settings.tabBehavior !== this._tabBehavior) {
				var indentWithTab = (core.commands || {}).indentWithTab;
				var cmKeymap = core.view.keymap;
				var tabBehaviorExts = [];

				if(settings.tabBehavior === "indent" && indentWithTab) {
					// Use CodeMirror's indent behavior
					tabBehaviorExts.push(cmKeymap.of([indentWithTab]));
				} else {
					// Browser behavior: Tab/Shift-Tab pass through for focus navigation
					tabBehaviorExts.push(cmKeymap.of([{
							key: "Tab",
							run: function() {
								return false;
							}
						},
						{
							key: "Shift-Tab",
							run: function() {
								return false;
							}
						}
					]));
				}

				this._tabBehavior = settings.tabBehavior;
				effects.push(this._compartments.tabBehavior.reconfigure(tabBehaviorExts));
			}
		}

		// Apply all effects (built-in compartments)
		if(effects.length > 0) {
			this.view.dispatch({
				effects: effects
			});
		}

		// Trigger settingsChanged event for all registered plugin handlers
		// Plugins handle their own compartments via registerEvents
		this._triggerEvent("settingsChanged", settings);
	}

	// ========================================================================
	// Destruction / Cleanup
	// ========================================================================

	/**
	 * Destroy the editor and clean up all resources.
	 * This prevents memory leaks when the editor is removed from the DOM.
	 */
	destroy() {
		if(this._destroyed) return;
		this._destroyed = true;

		// Call destroy on all active plugins
		for(var i = 0; i < this._activePlugins.length; i++) {
			var plugin = this._activePlugins[i];
			if(isFunction(plugin.destroy)) {
				try {
					plugin.destroy(this);
				} catch (_e) {}
			}
		}

		// Destroy the CodeMirror view
		try {
			if(this.view) this.view.destroy();
		} catch (_e) {}

		// Remove DOM node
		try {
			if(this.domNode && this.domNode.parentNode) {
				this.domNode.parentNode.removeChild(this.domNode);
			}
		} catch (_e) {}

		// Nullify references to allow garbage collection
		this.view = null;
		this.domNode = null;
		this.widget = null;
		this.parentNode = null;
		this.nextSibling = null;
		this.options = null;
		this.cm = null;
		this._compartments = null;
		this._eventHandlers = null;
		this._activePlugins = null;
		this._keymapPlugins = null;
		this._completionSources = null;
		this._pluginContext = null;
	}

	/**
	 * Check if this engine has been destroyed.
	 * @returns {boolean} True if destroyed
	 */
	isDestroyed() {
		return this._destroyed;
	}
}

exports.CodeMirrorSimpleEngine = CodeMirrorSimpleEngine;
