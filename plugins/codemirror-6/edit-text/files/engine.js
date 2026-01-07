/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/edit-text/engine.js
type: application/javascript
module-type: library

Minimal CodeMirror 6 engine for TiddlyWiki5 - SimpleEngine API compatible
With syntax highlighting and autocompletion support

\*/

"use strict";

var CORE_LIB_TITLE = "$:/plugins/tiddlywiki/codemirror-6/lib/core.js";
var PLUGIN_MODULE_TYPE = "codemirror6-plugin";

var _coreCache = null;
var _pluginCache = null;

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
	if (!twShortcut) return null;
	// Split by space for multiple shortcuts, take first one
	var shortcuts = twShortcut.trim().split(/\s+/);
	if (shortcuts.length === 0) return null;

	var shortcut = shortcuts[0];
	// Convert each part to proper case
	return shortcut.split("-").map(function (part) {
		var lower = part.toLowerCase();
		if (lower === "ctrl") return "Ctrl";
		if (lower === "alt") return "Alt";
		if (lower === "shift") return "Shift";
		if (lower === "cmd" || lower === "meta" || lower === "mod") return "Mod";
		// For keys like "enter", "tab", etc., capitalize first letter
		if (part.length > 1 && /^[a-z]+$/.test(part)) {
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
	if (!wiki) return defaultShortcut;
	var configValue = wiki.getTiddlerText("$:/config/shortcuts/cm6-" + name);
	if (configValue) {
		return twShortcutToCM(configValue);
	}
	return defaultShortcut;
}

// ============================================================================
// Core Library Loading
// ============================================================================

function getCM6Core() {
	if (_coreCache) return _coreCache;

	try {
		var core = require(CORE_LIB_TITLE);
		if (core && core.state && core.view) {
			_coreCache = core;
			return core;
		}
	} catch (e) { }

	if ($tw && $tw.browser && typeof window !== "undefined") {
		if (window.CM6CORE && window.CM6CORE.state && window.CM6CORE.view) {
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
	if (_pluginCache) return _pluginCache;

	var plugins = [];
	var core = getCM6Core();

	if ($tw && $tw.modules && isFunction($tw.modules.forEachModuleOfType)) {
		$tw.modules.forEachModuleOfType(PLUGIN_MODULE_TYPE, function (title, pluginModule) {
			try {
				var pluginDef = pluginModule.default || pluginModule.plugin || pluginModule;

				if (pluginDef && (isFunction(pluginDef.getExtensions) ||
					isFunction(pluginDef.extendAPI) ||
					isFunction(pluginDef.registerCompartments) ||
					isFunction(pluginDef.registerEvents))) {
					pluginDef.name = pluginDef.name || title;
					pluginDef.priority = isNumber(pluginDef.priority) ? pluginDef.priority : 0;
					pluginDef._moduleName = title;

					if (isFunction(pluginDef.init)) {
						try {
							pluginDef.init(core);
						} catch (e) { }
					}

					plugins.push(pluginDef);
				}
			} catch (e) { }
		});
	}

	plugins.sort(function (a, b) {
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

	if (options.widget) {
		var widget = options.widget;

		if (widget.editTitle) {
			context.tiddlerTitle = widget.editTitle;
		} else if (widget.getAttribute) {
			context.tiddlerTitle = widget.getAttribute("tiddler");
		}

		var wiki = widget.wiki;
		if (context.tiddlerTitle && wiki) {
			var tiddler = wiki.getTiddler(context.tiddlerTitle);
			if (tiddler) {
				context.tiddlerFields = tiddler.fields;
				context.tiddlerType = tiddler.fields.type || "";

				if (tiddler.fields["codemirror-type"]) {
					context.tiddlerType = tiddler.fields["codemirror-type"];
				}
			}
		}

		if (widget.editField === "text" && !context.tiddlerType) {
			context.tiddlerType = "";
		}
	}

	if (options.tiddlerType !== undefined) {
		context.tiddlerType = options.tiddlerType;
	}
	if (options.tiddlerTitle !== undefined) {
		context.tiddlerTitle = options.tiddlerTitle;
	}

	return context;
}

// ============================================================================
// CodeMirror Simple Engine
// ============================================================================

function CodeMirrorSimpleEngine(options) {
	options = options || {};
	var self = this;

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
		multiCursor: new Compartment(),
		bidi: new Compartment(),
		autocompletion: new Compartment()
	};
	this._activePlugins = [];
	this._keymapPlugins = {};
	this._currentKeymap = "default";
	this._completionSources = [];
	this._eventHandlers = {};

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

	for (var i = 0; i < plugins.length; i++) {
		var plugin = plugins[i];
		var hasCondition = isFunction(plugin.condition);

		try {
			// Register compartments
			if (isFunction(plugin.registerCompartments)) {
				var pluginCompartments = plugin.registerCompartments();
				if (isObject(pluginCompartments)) {
					for (var compName in pluginCompartments) {
						if (pluginCompartments.hasOwnProperty(compName) && !this._compartments[compName]) {
							this._compartments[compName] = pluginCompartments[compName];
						}
					}
				}
			}

			// Track keymap plugins separately by their keymapId
			if (isString(plugin.keymapId)) {
				this._keymapPlugins[plugin.keymapId] = plugin;
				continue; // Don't add to active plugins - handled separately
			}

			// Check if plugin should be active
			var shouldActivate = true;
			if (hasCondition) {
				shouldActivate = plugin.condition(context);
			}

			if (shouldActivate) {
				this._activePlugins.push(plugin);
			}
		} catch (e) { }
	}

	// ========================================================================
	// Core Extensions
	// ========================================================================

	// Get wiki reference for config lookups
	var wiki = (this.widget && this.widget.wiki) || null;

	// Line wrapping only for textarea mode
	if (!this.isInputMode) {
		extensions.push(EditorView.lineWrapping);
	}

	// History (undo/redo)
	var history = (core.commands || {}).history;
	var historyKeymap = (core.commands || {}).historyKeymap;
	if (history) {
		extensions.push(history());
		if (historyKeymap && cmKeymap) {
			extensions.push(cmKeymap.of(historyKeymap));
		}
	}

	// Default keymap
	var defaultKeymap = (core.commands || {}).defaultKeymap || [];
	if (defaultKeymap.length && cmKeymap) {
		extensions.push(cmKeymap.of(defaultKeymap));
	}

	// Syntax highlighting (class-based for CSS theming)
	var syntaxHighlighting = (core.language || {}).syntaxHighlighting;
	var classHighlighter = (core.lezerHighlight || {}).classHighlighter;
	if (syntaxHighlighting && classHighlighter) {
		extensions.push(syntaxHighlighting(classHighlighter, { fallback: true }));
	}

	// Bracket matching (configurable via compartment)
	var bracketMatching = (core.language || {}).bracketMatching;
	if (bracketMatching) {
		var bmEnabled = !wiki || wiki.getTiddlerText("$:/config/codemirror-6/bracketMatching", "yes") === "yes";
		extensions.push(this._compartments.bracketMatching.of(bmEnabled ? bracketMatching() : []));
	}

	// Close brackets (configurable via compartment)
	var closeBrackets = (core.autocomplete || {}).closeBrackets;
	var closeBracketsKeymap = (core.autocomplete || {}).closeBracketsKeymap;
	if (closeBrackets) {
		var cbEnabled = !wiki || wiki.getTiddlerText("$:/config/codemirror-6/closeBrackets", "yes") === "yes";
		var cbConfig = {
			brackets: ["()", "[]", "{}", "''", '""', "``", "\u201c\u201d", "\u2018\u2019", "\u201e\u201d", "\u201a\u2019"]
		};
		var cbExtensions = cbEnabled ? [closeBrackets(cbConfig)] : [];
		if (cbEnabled && closeBracketsKeymap && cmKeymap) {
			cbExtensions.push(cmKeymap.of(closeBracketsKeymap));
		}
		extensions.push(this._compartments.closeBrackets.of(cbExtensions));
	}

	// Spellcheck (configurable via compartment)
	var spellcheckEnabled = wiki && wiki.getTiddlerText("$:/config/codemirror-6/spellcheck", "no") === "yes";
	extensions.push(this._compartments.spellcheck.of(
		EditorView.contentAttributes.of({
			spellcheck: spellcheckEnabled ? "true" : "false",
			autocorrect: spellcheckEnabled ? "on" : "off",
			autocapitalize: spellcheckEnabled ? "on" : "off"
		})
	));

	// Indentation settings (configurable via compartments)
	var indentUnitFn = (core.language || {}).indentUnit;
	if (indentUnitFn) {
		var indentType = wiki && wiki.getTiddlerText("$:/config/codemirror-6/indentUnit", "tabs");
		var indentMultiplier = 4;
		var multiplierText = wiki && wiki.getTiddlerText("$:/config/codemirror-6/indentUnitMultiplier", "4");
		if (multiplierText) {
			var parsed = parseInt(multiplierText, 10);
			if (isFinite(parsed) && parsed > 0 && parsed <= 16) {
				indentMultiplier = parsed;
			}
		}
		var unitStr = indentType === "spaces" ? " ".repeat(indentMultiplier) : "\t";
		extensions.push(this._compartments.indentUnit.of(indentUnitFn.of(unitStr)));
		extensions.push(this._compartments.tabSize.of(EditorState.tabSize.of(indentMultiplier)));
	}

	// Trailing whitespace highlighting (configurable via compartment)
	var highlightTrailingWhitespace = (core.view || {}).highlightTrailingWhitespace;
	if (highlightTrailingWhitespace) {
		var trailingEnabled = wiki && wiki.getTiddlerText("$:/config/codemirror-6/showTrailingWhitespace", "no") === "yes";
		var trailingExts = trailingEnabled ? [highlightTrailingWhitespace()] : [];
		extensions.push(this._compartments.trailingWhitespace.of(trailingExts));
	}

	// Multi-cursor editing (configurable via compartment)
	// Uses native browser selection for PRIMARY cursor/selection (proper text contrast)
	// Uses custom rendering for SECONDARY cursors/selections only
	var multiCursorEnabled = !wiki || wiki.getTiddlerText("$:/config/codemirror-6/multiCursor", "yes") !== "no";
	var multiCursorExts = [];
	if (multiCursorEnabled) {
		// EditorState.allowMultipleSelections.of(true) is needed for multi-cursor
		if (EditorState.allowMultipleSelections) {
			multiCursorExts.push(EditorState.allowMultipleSelections.of(true));
		}

		// Custom rendering for secondary cursors and selections
		// Uses native browser selection for primary, custom rendering for secondary
		var ViewPlugin = (core.view || {}).ViewPlugin;
		var Decoration = (core.view || {}).Decoration;
		var layer = (core.view || {}).layer;
		var RectangleMarker = (core.view || {}).RectangleMarker;
		var EditorSelection = (core.state || {}).EditorSelection;

		if (ViewPlugin && Decoration && layer && RectangleMarker && EditorSelection) {
			// Decoration for secondary selections (highlights only actual text, not empty lines)
			var secondarySelectionMark = Decoration.mark({
				class: "cm-selectionBackground-secondary"
			});

			// Plugin class for secondary selection highlighting
			var SecondarySelectionClass = function (view) {
				this.decorations = this.buildDecorations(view);
			};
			SecondarySelectionClass.prototype.buildDecorations = function (view) {
				var builder = [];
				var state = view.state;
				for (var i = 0; i < state.selection.ranges.length; i++) {
					var r = state.selection.ranges[i];
					// Skip primary selection and empty ranges
					if (r === state.selection.main || r.empty) continue;
					builder.push(secondarySelectionMark.range(r.from, r.to));
				}
				// Second argument true = ranges are unsorted, let Decoration.set sort them
				return Decoration.set(builder, true);
			};
			SecondarySelectionClass.prototype.update = function (update) {
				if (update.docChanged || update.selectionSet) {
					this.decorations = this.buildDecorations(update.view);
				}
			};

			multiCursorExts.push(ViewPlugin.fromClass(SecondarySelectionClass, {
				decorations: function (v) {
					return v.decorations;
				}
			}));

			// Create a cursor-only layer for secondary cursors
			var secondaryCursorLayer = layer({
				above: true,
				markers: function (view) {
					var state = view.state;
					var cursors = [];
					for (var i = 0; i < state.selection.ranges.length; i++) {
						var r = state.selection.ranges[i];
						// Skip the primary selection - let native cursor handle it
						if (r === state.selection.main) continue;
						// Draw cursor for this range
						var cursor = r.empty ? r : EditorSelection.cursor(r.head, r.head > r.anchor ? -1 : 1);
						var pieces = RectangleMarker.forRange(view, "cm-cursor cm-cursor-secondary", cursor);
						for (var j = 0; j < pieces.length; j++) {
							cursors.push(pieces[j]);
						}
					}
					return cursors;
				},
				update: function (update, _dom) {
					return update.docChanged || update.selectionSet;
				},
				"class": "cm-cursorLayer"
			});
			multiCursorExts.push(secondaryCursorLayer);
		}

		// Add rectangular selection keymap
		var rectangularSelection = (core.view || {}).rectangularSelection;
		if (rectangularSelection) {
			multiCursorExts.push(rectangularSelection());
		}
		// Cross-hair cursor for rectangular selection
		var crosshairCursor = (core.view || {}).crosshairCursor;
		if (crosshairCursor) {
			multiCursorExts.push(crosshairCursor());
		}
	}
	extensions.push(this._compartments.multiCursor.of(multiCursorExts));

	// ========================================================================
	// Bidirectional Text Support
	// ========================================================================

	// Enables automatic per-line text direction detection (RTL/LTR)
	var bidiEnabled = wiki && wiki.getTiddlerText("$:/config/codemirror-6/bidiPerLine", "no") === "yes";
	var bidiExtensions = [];
	var perLineTextDirection = EditorView.perLineTextDirection;
	if (bidiEnabled && perLineTextDirection) {
		bidiExtensions.push(perLineTextDirection);
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
		autocomplete: function (context) {
			var sources = self.getEnabledCompletionSources();
			for (var j = 0; j < sources.length; j++) {
				var result = sources[j](context);
				if (result) return result;
			}
			// Check completeAnyWord config dynamically
			if (self._wiki && self._wiki.getTiddlerText("$:/config/codemirror-6/completeAnyWord", "no") === "yes") {
				if (self._completeAnyWord) {
					return self._completeAnyWord(context);
				}
			}
			return null;
		}
	}];
	var emptyData = [];

	extensions.push(EditorState.languageData.of(function (state, pos, side) {
		var sources = self.getEnabledCompletionSources();
		var completeAnyWordEnabled = self._wiki &&
			self._wiki.getTiddlerText("$:/config/codemirror-6/completeAnyWord", "no") === "yes";
		if (sources.length === 0 && !completeAnyWordEnabled) {
			return emptyData;
		}
		return cachedAutocompleteData;
	}));

	// Autocompletion UI (with compartment for dynamic toggle)
	var autocompletionEnabled = !wiki || wiki.getTiddlerText("$:/config/codemirror-6/autocompletion", "yes") !== "no";
	var autocompletionExts = [];
	if (autocompletionEnabled && autocompletionFn) {
		autocompletionExts.push(autocompletionFn({
			activateOnTyping: true,
			maxRenderedOptions: 50
		}));
	}
	extensions.push(this._compartments.autocompletion.of(autocompletionExts));

	// ========================================================================
	// Plugin Extensions
	// ========================================================================

	for (var k = 0; k < this._activePlugins.length; k++) {
		var activePlugin = this._activePlugins[k];
		try {
			if (isFunction(activePlugin.getExtensions)) {
				var pluginExts = activePlugin.getExtensions(context);
				if (isArray(pluginExts)) {
					extensions = extensions.concat(pluginExts);
				}
			}
		} catch (e) { }
	}

	// ========================================================================
	// Keymap Loading
	// ========================================================================

	// Check for simple-editor specific keymap, fall back to main editor keymap
	var keymapId = "default";
	if (wiki) {
		keymapId = wiki.getTiddlerText("$:/config/codemirror-6/simple-keymap", "") ||
			wiki.getTiddlerText("$:/config/codemirror-6/keymap", "default") ||
			"default";
	}

	// Load keymap plugin extensions if a non-default keymap is selected
	var initialKeymapExtensions = [];
	if (keymapId !== "default" && this._keymapPlugins[keymapId]) {
		var keymapPlugin = this._keymapPlugins[keymapId];
		if (isFunction(keymapPlugin.getExtensions)) {
			try {
				initialKeymapExtensions = keymapPlugin.getExtensions(context) || [];
			} catch (e) { }
		}
	}
	this._currentKeymap = keymapId;
	extensions.push(this._compartments.keymap.of(initialKeymapExtensions));

	// ========================================================================
	// Update Listener
	// ========================================================================

	extensions.push(
		EditorView.updateListener.of(function (update) {
			if (update.docChanged) {
				self._handleInput();
			}
			if (update.focusChanged && update.view.hasFocus) {
				self._handleFocus();
			}
		})
	);

	// ========================================================================
	// Input Mode: Prevent Newlines
	// ========================================================================

	if (this.isInputMode) {
		// Block Enter and Ctrl+Enter keys
		// Block Tab key (let browser handle focus navigation instead of indenting)
		// Propagate arrow keys to parent widgets for popup navigation (only when popup is open)
		extensions.push(
			Prec.highest(EditorView.domEventHandlers({
				keydown: function (event, view) {
					if (event.key === "Enter" && !event.altKey && !event.metaKey) {
						if (self.widget && typeof self.widget.handleKeydownEvent === "function") {
							return self.widget.handleKeydownEvent(event);
						}
						return true;
					}
					// Let Tab pass through to browser for focus navigation
					if (event.key === "Tab") {
						return false; // Don't handle - let browser move focus
					}
					// Propagate arrow keys to parent widgets (for $keyboard widget popup navigation)
					// Only when the focusPopup is open (has text in state tiddler)
					if (event.key === "ArrowUp" || event.key === "ArrowDown") {
						if (self.widget && self.widget.editFocusPopup && self.widget.wiki) {
							var popupState = self.widget.wiki.getTiddlerText(self.widget.editFocusPopup, "");
							if (popupState) {
								// Popup is open - propagate to parent
								if (typeof self.widget.handleKeydownEvent === "function") {
									if (self.widget.handleKeydownEvent(event)) {
										return true;
									}
								}
							}
						}
					}
					// Propagate Escape to parent widgets (for closing popups, only when open)
					if (event.key === "Escape") {
						if (self.widget && self.widget.editFocusPopup && self.widget.wiki) {
							var popupState = self.widget.wiki.getTiddlerText(self.widget.editFocusPopup, "");
							if (popupState) {
								if (typeof self.widget.handleKeydownEvent === "function") {
									if (self.widget.handleKeydownEvent(event)) {
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

		// Override Tab in keymap to prevent CodeMirror indent behavior
		extensions.push(
			Prec.highest(cmKeymap.of([
				{ key: "Tab", run: function () { return false; } },
				{ key: "Shift-Tab", run: function () { return false; } }
			]))
		);

		// Filter out newlines from any input (paste, etc.)
		extensions.push(
			EditorState.transactionFilter.of(function (tr) {
				if (!tr.docChanged) return tr;

				var newDoc = tr.newDoc.toString();
				if (newDoc.indexOf("\n") === -1 && newDoc.indexOf("\r") === -1) {
					return tr;
				}

				var cleaned = newDoc.replace(/[\r\n]+/g, " ");
				return {
					changes: { from: 0, to: tr.newDoc.length, insert: cleaned },
					selection: tr.selection
				};
			})
		);
	}

	// ========================================================================
	// File Drop Handling
	// ========================================================================

	if (this._isFileDropEnabled && this.widget) {
		extensions.push(
			EditorView.domEventHandlers({
				drop: function (event, view) {
					if (self.widget && typeof self.widget.handleDropEvent === "function") {
						return self.widget.handleDropEvent(event);
					}
					return false;
				},
				paste: function (event, view) {
					if (self.widget && typeof self.widget.handlePasteEvent === "function") {
						return self.widget.handlePasteEvent(event);
					}
					return false;
				},
				dragenter: function (event, view) {
					if (self.widget && typeof self.widget.handleDragEnterEvent === "function") {
						return self.widget.handleDragEnterEvent(event);
					}
					return false;
				},
				dragover: function (event, view) {
					if (self.widget && typeof self.widget.handleDragOverEvent === "function") {
						return self.widget.handleDragOverEvent(event);
					}
					return false;
				},
				dragleave: function (event, view) {
					if (self.widget && typeof self.widget.handleDragLeaveEvent === "function") {
						return self.widget.handleDragLeaveEvent(event);
					}
					return false;
				},
				dragend: function (event, view) {
					if (self.widget && typeof self.widget.handleDragEndEvent === "function") {
						return self.widget.handleDragEndEvent(event);
					}
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
	if (placeholderFn && this.widget && this.widget.editPlaceholder) {
		extensions.push(placeholderFn(this.widget.editPlaceholder));
	}

	// TabIndex
	if (this.widget && this.widget.editTabIndex) {
		extensions.push(EditorView.contentAttributes.of({
			tabindex: String(this.widget.editTabIndex)
		}));
	}

	// Autocomplete attribute (HTML autocomplete hint for browser)
	if (this.widget && this.widget.editAutoComplete) {
		extensions.push(EditorView.contentAttributes.of({
			autocomplete: this.widget.editAutoComplete
		}));
	}

	// Disabled state
	if (this.widget && this.widget.isDisabled === "yes") {
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

	this.domNode = document.createElement("div");
	this.domNode.className = "tc-editor-codemirror6-simple";
	this.domNode.className += this.isInputMode
		? " tc-editor-codemirror6-input"
		: " tc-editor-codemirror6-textarea";

	if (this.widget && this.widget.editClass) {
		this.domNode.className += " " + this.widget.editClass;
	}

	// Apply editSize for input mode (affects width)
	if (this.isInputMode && this._editSize) {
		// Size attribute typically affects width in characters
		// Approximate using ch units for monospace or em for proportional
		var sizeNum = parseInt(this._editSize, 10);
		if (isFinite(sizeNum) && sizeNum > 0) {
			this.domNode.style.width = sizeNum + "ch";
		}
	}

	// Apply editRows for textarea mode (affects height)
	if (!this.isInputMode && this._editRows) {
		var rowsNum = parseInt(this._editRows, 10);
		if (isFinite(rowsNum) && rowsNum > 0) {
			// Approximate line height to set min-height
			// Typical line height is about 1.4em
			this.domNode.style.minHeight = (rowsNum * 1.4) + "em";
		}
	}

	var initialText = (options.value !== undefined && options.value !== null)
		? String(options.value)
		: "";

	if (this.isInputMode) {
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
	if (this.widget && this.widget.domNodes) {
		this.widget.domNodes.push(this.domNode);
	}

	// ========================================================================
	// Extend API from Active Plugins
	// ========================================================================

	for (var m = 0; m < this._activePlugins.length; m++) {
		var apiPlugin = this._activePlugins[m];
		try {
			if (isFunction(apiPlugin.extendAPI)) {
				var apiMethods = apiPlugin.extendAPI(this, context);
				if (isObject(apiMethods)) {
					for (var methodName in apiMethods) {
						if (apiMethods.hasOwnProperty(methodName) && isFunction(apiMethods[methodName])) {
							if (!this[methodName]) {
								this[methodName] = apiMethods[methodName].bind(this);
							}
						}
					}
				}
			}
		} catch (e) { }
	}

	// ========================================================================
	// Register Events from Active Plugins
	// ========================================================================

	for (var n = 0; n < this._activePlugins.length; n++) {
		var eventPlugin = this._activePlugins[n];
		try {
			if (isFunction(eventPlugin.registerEvents)) {
				var eventHandlers = eventPlugin.registerEvents(this, context);
				if (isObject(eventHandlers)) {
					for (var eventName in eventHandlers) {
						if (eventHandlers.hasOwnProperty(eventName) && isFunction(eventHandlers[eventName])) {
							this.on(eventName, eventHandlers[eventName]);
						}
					}
				}
			}
		} catch (e) { }
	}
}

// ============================================================================
// Core API
// ============================================================================

CodeMirrorSimpleEngine.prototype.getText = function () {
	return this.view ? this.view.state.doc.toString() : "";
};

CodeMirrorSimpleEngine.prototype.setText = function (text, type) {
	if (!this.view) return;
	if (this.view.hasFocus && text !== "") return;
	this.updateDomNodeText(text);
};

CodeMirrorSimpleEngine.prototype.updateDomNodeText = function (text) {
	if (!this.view) return;

	if (this.isInputMode && text) {
		text = text.replace(/[\r\n]+/g, " ");
	}

	var current = this.view.state.doc.toString();
	if (text === current) return;

	// Flag to prevent inputActions from firing during programmatic updates
	// This matches native HTML behavior where setting input.value doesn't fire 'input' event
	this._isProgrammaticUpdate = true;
	this.view.dispatch({
		changes: { from: 0, to: this.view.state.doc.length, insert: text }
	});
	this._isProgrammaticUpdate = false;
};

CodeMirrorSimpleEngine.prototype.focus = function () {
	if (!this.view) return;

	this.view.focus();

	// Handle focusSelectFromStart and focusSelectFromEnd
	var docLength = this.view.state.doc.length;
	var selectStart = this._focusSelectFromStart || 0;
	var selectEnd = this._focusSelectFromEnd || 0;

	// Calculate actual positions
	var from = Math.min(selectStart, docLength);
	var to = Math.max(0, docLength - selectEnd);

	// Only set selection if we have valid range
	if (from !== to || from !== 0) {
		this.view.dispatch({
			selection: { anchor: from, head: to }
		});
	}
};

CodeMirrorSimpleEngine.prototype.fixHeight = function () {
	if (!this.view || !this.domNode) return;

	// For input mode, height is fixed (single line)
	if (this.isInputMode) return;

	// For textarea mode with autoHeight enabled
	if (this._autoHeight) {
		// Get the content height
		var contentHeight = this.view.contentHeight;
		var minHeight = parseInt(this._minHeight, 10) || 100;

		// If rows is specified, calculate a minimum based on rows
		if (this._editRows) {
			var rowsNum = parseInt(this._editRows, 10);
			if (isFinite(rowsNum) && rowsNum > 0) {
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
};

// ============================================================================
// Completion Source Registry
// ============================================================================

/**
 * Register a completion source
 * @param {function} source - The completion source function
 * @param {number} priority - Priority (higher = checked first)
 * @param {string} configTiddler - Optional config tiddler path for dynamic enable/disable
 */
CodeMirrorSimpleEngine.prototype.registerCompletionSource = function (source, priority, configTiddler) {
	if (!isFunction(source)) return;

	this._completionSources.push({
		source: source,
		priority: priority || 0,
		configTiddler: configTiddler || null
	});

	this._completionSources.sort(function (a, b) {
		return b.priority - a.priority;
	});
};

/**
 * Get all registered completion sources (regardless of enabled state)
 */
CodeMirrorSimpleEngine.prototype.getCompletionSources = function () {
	return this._completionSources.map(function (entry) {
		return entry.source;
	});
};

/**
 * Get only enabled completion sources (checks config tiddlers dynamically)
 */
CodeMirrorSimpleEngine.prototype.getEnabledCompletionSources = function () {
	var wiki = this._wiki;
	var enabled = [];

	for (var i = 0; i < this._completionSources.length; i++) {
		var entry = this._completionSources[i];

		// If no config tiddler, always enabled
		if (!entry.configTiddler) {
			enabled.push(entry.source);
			continue;
		}

		// Check config tiddler dynamically
		if (wiki && wiki.getTiddlerText(entry.configTiddler, "yes") === "yes") {
			enabled.push(entry.source);
		}
	}

	return enabled;
};

// ============================================================================
// Event Handlers
// ============================================================================

CodeMirrorSimpleEngine.prototype._handleInput = function () {
	if (this.widget && typeof this.widget.saveChanges === "function") {
		this.widget.saveChanges(this.getText());
	}
	// Only invoke inputActions on actual user input, not programmatic updates
	// This prevents storeTitle from being updated when cycling through popup items
	if (this.widget && this.widget.editInputActions && !this._isProgrammaticUpdate) {
		this.widget.invokeActionString(this.widget.editInputActions, this, null, {
			actionValue: this.getText()
		});
	}
};

CodeMirrorSimpleEngine.prototype._handleFocus = function () {
	if (this.widget && this.widget.editCancelPopups && $tw.popup) {
		$tw.popup.cancel(0);
	}
	if (this.widget && this.widget.editFocusPopup && $tw.popup) {
		$tw.popup.triggerPopup({
			domNode: this.domNode,
			title: this.widget.editFocusPopup,
			wiki: this.widget.wiki,
			force: true
		});
	}
};

// ============================================================================
// Text Operations (no-op for SimpleEngine compatibility)
// ============================================================================

CodeMirrorSimpleEngine.prototype.createTextOperation = function () {
	return null;
};

CodeMirrorSimpleEngine.prototype.executeTextOperation = function (operation) {
};

// ============================================================================
// Compartment Management
// ============================================================================

CodeMirrorSimpleEngine.prototype.reconfigure = function (compartmentName, extension) {
	if (!this.view) return;

	var compartment = this._compartments[compartmentName];
	if (!compartment) return;

	this.view.dispatch({
		effects: compartment.reconfigure(extension)
	});
};

// ============================================================================
// Keymap Management
// ============================================================================

CodeMirrorSimpleEngine.prototype.updateKeymap = function (newKeymapId) {
	if (!this.view || !this._compartments.keymap) return;
	if (newKeymapId === this._currentKeymap) return;

	var newKeymapExtensions = [];
	if (newKeymapId !== "default" && this._keymapPlugins[newKeymapId]) {
		var keymapPlugin = this._keymapPlugins[newKeymapId];
		if (isFunction(keymapPlugin.getExtensions)) {
			try {
				newKeymapExtensions = keymapPlugin.getExtensions(this._pluginContext) || [];
			} catch (e) { }
		}
	}

	this._currentKeymap = newKeymapId;
	this.reconfigure("keymap", newKeymapExtensions);
};

// ============================================================================
// Event System
// ============================================================================

CodeMirrorSimpleEngine.prototype.on = function (eventName, handler) {
	if (!this._eventHandlers[eventName]) {
		this._eventHandlers[eventName] = [];
	}
	this._eventHandlers[eventName].push(handler);
};

CodeMirrorSimpleEngine.prototype._triggerEvent = function (eventName, data) {
	var handlers = this._eventHandlers[eventName];
	if (!handlers) return;

	for (var i = 0; i < handlers.length; i++) {
		try {
			handlers[i].call(this, data);
		} catch (e) { }
	}
};

// ============================================================================
// Settings Management
// ============================================================================

CodeMirrorSimpleEngine.prototype._handleSettingsChanged = function (settings) {
	if (!this.view) return;

	var core = this.cm;
	var effects = [];

	// Bracket matching
	var bracketMatching = (core.language || {}).bracketMatching;
	if (bracketMatching && this._compartments.bracketMatching && settings.bracketMatching !== undefined) {
		var bmContent = settings.bracketMatching ? bracketMatching() : [];
		effects.push(this._compartments.bracketMatching.reconfigure(bmContent));
	}

	// Close brackets
	var closeBrackets = (core.autocomplete || {}).closeBrackets;
	var closeBracketsKeymap = (core.autocomplete || {}).closeBracketsKeymap;
	var cmKeymap = core.view.keymap;
	if (closeBrackets && this._compartments.closeBrackets && settings.closeBrackets !== undefined) {
		var cbConfig = {
			brackets: ["()", "[]", "{}", "''", '""', "``", "\u201c\u201d", "\u2018\u2019", "\u201e\u201d", "\u201a\u2019"]
		};
		var cbExtensions = [];
		if (settings.closeBrackets) {
			cbExtensions.push(closeBrackets(cbConfig));
			if (closeBracketsKeymap && cmKeymap) {
				cbExtensions.push(cmKeymap.of(closeBracketsKeymap));
			}
		}
		effects.push(this._compartments.closeBrackets.reconfigure(cbExtensions));
	}

	// Spellcheck
	if (this._compartments.spellcheck && settings.spellcheck !== undefined) {
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
	if (settings.indent) {
		var indentUnitFn = (core.language || {}).indentUnit;
		var EditorState = core.state.EditorState;

		var unitStr = "\t";
		var multiplier = 4;

		if (settings.indent.indentUnitMultiplier) {
			var parsed = parseInt(settings.indent.indentUnitMultiplier, 10);
			if (isFinite(parsed) && parsed > 0 && parsed <= 16) {
				multiplier = parsed;
			}
		}

		if (settings.indent.indentUnit === "spaces") {
			unitStr = " ".repeat(multiplier);
		}

		if (indentUnitFn && this._compartments.indentUnit) {
			effects.push(this._compartments.indentUnit.reconfigure(indentUnitFn.of(unitStr)));
		}

		if (EditorState && EditorState.tabSize && this._compartments.tabSize) {
			effects.push(this._compartments.tabSize.reconfigure(EditorState.tabSize.of(multiplier)));
		}
	}

	// Keymap
	if (settings.keymap !== undefined && settings.keymap !== this._currentKeymap) {
		this.updateKeymap(settings.keymap);
	}

	// Trailing whitespace highlighting
	if (settings.showTrailingWhitespace !== undefined && this._compartments.trailingWhitespace) {
		var highlightTrailingWhitespace = (core.view || {}).highlightTrailingWhitespace;
		var trailingExts = [];
		if (settings.showTrailingWhitespace && highlightTrailingWhitespace) {
			trailingExts.push(highlightTrailingWhitespace());
		}
		effects.push(this._compartments.trailingWhitespace.reconfigure(trailingExts));
	}

	// Multi-cursor editing
	if (settings.multiCursor !== undefined && this._compartments.multiCursor) {
		var EditorState = core.state.EditorState;
		var multiCursorExts = [];
		if (settings.multiCursor) {
			if (EditorState.allowMultipleSelections) {
				multiCursorExts.push(EditorState.allowMultipleSelections.of(true));
			}

			// Custom rendering for secondary cursors and selections
			var mcViewPlugin = (core.view || {}).ViewPlugin;
			var mcDecoration = (core.view || {}).Decoration;
			var mcLayer = (core.view || {}).layer;
			var mcRectMarker = (core.view || {}).RectangleMarker;
			var mcEditorSel = (core.state || {}).EditorSelection;

			if (mcViewPlugin && mcDecoration && mcLayer && mcRectMarker && mcEditorSel) {
				// Secondary selection highlighting
				var mcSelMark = mcDecoration.mark({
					class: "cm-selectionBackground-secondary"
				});
				var McSecondarySelClass = function (view) {
					this.decorations = this.buildDecorations(view);
				};
				McSecondarySelClass.prototype.buildDecorations = function (view) {
					var builder = [];
					var state = view.state;
					for (var i = 0; i < state.selection.ranges.length; i++) {
						var r = state.selection.ranges[i];
						if (r === state.selection.main || r.empty) continue;
						builder.push(mcSelMark.range(r.from, r.to));
					}
					return mcDecoration.set(builder, true);
				};
				McSecondarySelClass.prototype.update = function (update) {
					if (update.docChanged || update.selectionSet) {
						this.decorations = this.buildDecorations(update.view);
					}
				};
				multiCursorExts.push(mcViewPlugin.fromClass(McSecondarySelClass, {
					decorations: function (v) {
						return v.decorations;
					}
				}));

				// Secondary cursor layer
				var mcSecondaryCursorLayer = mcLayer({
					above: true,
					markers: function (view) {
						var state = view.state;
						var cursors = [];
						for (var i = 0; i < state.selection.ranges.length; i++) {
							var r = state.selection.ranges[i];
							if (r === state.selection.main) continue;
							var cursor = r.empty ? r : mcEditorSel.cursor(r.head, r.head > r.anchor ? -1 : 1);
							var pieces = mcRectMarker.forRange(view, "cm-cursor cm-cursor-secondary", cursor);
							for (var j = 0; j < pieces.length; j++) {
								cursors.push(pieces[j]);
							}
						}
						return cursors;
					},
					update: function (update, _dom) {
						return update.docChanged || update.selectionSet;
					},
					"class": "cm-cursorLayer"
				});
				multiCursorExts.push(mcSecondaryCursorLayer);
			}

			var rectangularSelection = (core.view || {}).rectangularSelection;
			if (rectangularSelection) {
				multiCursorExts.push(rectangularSelection());
			}
			var crosshairCursor = (core.view || {}).crosshairCursor;
			if (crosshairCursor) {
				multiCursorExts.push(crosshairCursor());
			}
		}
		effects.push(this._compartments.multiCursor.reconfigure(multiCursorExts));
	}

	// Bidirectional text support toggle
	if (settings.bidiPerLine !== undefined && this._compartments.bidi) {
		var bidiExtensions = [];
		var EditorView = core.view.EditorView;
		if (settings.bidiPerLine && EditorView.perLineTextDirection) {
			bidiExtensions.push(EditorView.perLineTextDirection);
		}
		effects.push(this._compartments.bidi.reconfigure(bidiExtensions));
	}

	// Autocompletion toggle
	if (settings.autocompletion !== undefined && this._compartments.autocompletion) {
		var autocompletionExts = [];
		var autocompletionFn = (core.autocomplete || {}).autocompletion;
		if (settings.autocompletion && autocompletionFn) {
			autocompletionExts.push(autocompletionFn({
				activateOnTyping: true,
				maxRenderedOptions: 50
			}));
		}
		effects.push(this._compartments.autocompletion.reconfigure(autocompletionExts));
	}

	// Apply all effects (built-in compartments)
	if (effects.length > 0) {
		this.view.dispatch({ effects: effects });
	}

	// Trigger settingsChanged event for all registered plugin handlers
	// Plugins handle their own compartments via registerEvents
	this._triggerEvent("settingsChanged", settings);
};

exports.CodeMirrorSimpleEngine = CodeMirrorSimpleEngine;