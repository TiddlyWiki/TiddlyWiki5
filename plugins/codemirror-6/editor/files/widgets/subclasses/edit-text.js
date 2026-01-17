/*\
title: $:/plugins/tiddlywiki/codemirror-6/widgets/subclasses/edit-text.js
type: application/javascript
module-type: widget-subclass

Widget subclass for CodeMirror 6 editor (production-ready)

- Overrides toolbar text operations to route through CM6 engine + plugins
- Centralizes config → emits a single settingsChanged snapshot
- Keeps TW core factory.js unmodified
- Theme management with auto-match palette support
- Plugin registry for extensibility (Zen Mode, etc.)

\*/

/*jslint node: true, browser: true */
/*global $tw: false */

"use strict";

// Only register the subclass in browser environments
// Node.js builds don't have the base class (edit-codemirror-6) available
if(!$tw.browser) {
	return;
}

exports.baseClass = "edit-codemirror-6";

exports.constructor = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

exports.prototype = {};

// ============================================================================
// Editor Operations - handlers for toolbar text operations
// ============================================================================

// ============================================================================
// Undo/Redo handlers
// ============================================================================

exports.prototype.handleUndo = function(event) {
	if(this.engine && typeof this.engine.undo === "function") {
		this.engine.undo();
		this.engine.focus();
	}
	return false; // Don't propagate
};

exports.prototype.handleRedo = function(event) {
	if(this.engine && typeof this.engine.redo === "function") {
		this.engine.redo();
		this.engine.focus();
	}
	return false; // Don't propagate
};

// ============================================================================
// Search and Goto Line handlers
// ============================================================================

exports.prototype.handleToggleSearch = function(event) {
	if(this.engine && typeof this.engine.toggleSearch === "function") {
		this.engine.toggleSearch();
	}
	return false; // Don't propagate
};

exports.prototype.handleToggleGotoLine = function(event) {
	if(this.engine && typeof this.engine.toggleGotoLine === "function") {
		this.engine.toggleGotoLine();
	}
	return false; // Don't propagate
};

// ============================================================================
// Remove Trailing Whitespace handler
// ============================================================================

exports.prototype.handleRemoveTrailingWhitespace = function(event) {
	if(!this.engine || !this.engine.view) return false;

	var view = this.engine.view;
	var doc = view.state.doc;
	var changes = [];

	// Iterate through all lines and find trailing whitespace
	for(var i = 1; i <= doc.lines; i++) {
		var line = doc.line(i);
		var text = line.text;
		var trimmed = text.replace(/\s+$/, "");

		if(trimmed.length < text.length) {
			// There's trailing whitespace to remove
			changes.push({
				from: line.from + trimmed.length,
				to: line.to
			});
		}
	}

	if(changes.length > 0) {
		view.dispatch({
			changes: changes
		});
	}

	this.engine.focus();
	return false; // Don't propagate
};

// ============================================================================
// Spaces to Tabs handler
// ============================================================================

exports.prototype.handleSpacesToTabs = function(event) {
	if(!this.engine || !this.engine.view) return false;

	var view = this.engine.view;
	var doc = view.state.doc;
	var changes = [];

	// Get the configured tab size (indent unit multiplier)
	var tabSize = 4; // default
	var wiki = this.wiki;
	if(wiki) {
		var configuredSize = wiki.getTiddlerText("$:/config/codemirror-6/editor/indentUnitMultiplier");
		if(configuredSize) {
			var parsed = parseInt(configuredSize, 10);
			if(isFinite(parsed) && parsed > 0 && parsed <= 16) {
				tabSize = parsed;
			}
		}
	}

	// Iterate through all lines and convert leading spaces to tabs
	for(var i = 1; i <= doc.lines; i++) {
		var line = doc.line(i);
		var text = line.text;

		// Find leading whitespace
		var leadingMatch = /^[ \t]*/.exec(text);
		if(!leadingMatch || leadingMatch[0].length === 0) continue;

		var leading = leadingMatch[0];

		// Skip if no spaces in leading whitespace
		if(leading.indexOf(" ") === -1) continue;

		// Calculate the visual column width of the leading whitespace
		var column = 0;
		for(var j = 0; j < leading.length; j++) {
			if(leading[j] === "\t") {
				// Tab advances to next tab stop
				column = Math.floor(column / tabSize) * tabSize + tabSize;
			} else {
				column++;
			}
		}

		// Convert to tabs: each tabSize columns = 1 tab
		var numTabs = Math.floor(column / tabSize);
		var remainingSpaces = column % tabSize;
		var newLeading = "\t".repeat(numTabs) + " ".repeat(remainingSpaces);

		// Only change if different
		if(newLeading !== leading) {
			changes.push({
				from: line.from,
				to: line.from + leading.length,
				insert: newLeading
			});
		}
	}

	if(changes.length > 0) {
		view.dispatch({
			changes: changes
		});
	}

	this.engine.focus();
	return false; // Don't propagate
};

// ============================================================================
// Override updateEditorDomNode to not reset language on every refresh
// ============================================================================

exports.prototype.updateEditorDomNode = function(text) {
	if(!this.engine) return;
	this.engine.setText(text);
};

// ============================================================================
// Language Switcher handlers
// ============================================================================

exports.prototype.handleSetLanguage = function(event) {
	if(!this.engine) return false;

	var newType = event.paramObject ? event.paramObject.type : null;
	if(newType === undefined || newType === null) return false;

	// Check persistence mode from config
	var persistMode = this.wiki.getTiddlerText("$:/config/codemirror-6/editor/languageSwitcherPersist", "session");

	if(persistMode === "field" && this.editTitle) {
		// Save to tiddler field for persistence
		if(newType === "") {
			// Empty means "use default" - remove the override field
			this.wiki.setText(this.editTitle, "codemirror-type", null, undefined);
		} else {
			this.wiki.setText(this.editTitle, "codemirror-type", null, newType);
		}
	}

	// Switch the language in the editor
	this.engine.setType(newType);

	// Close the picker if open
	this.hideLanguagePicker();
	this.engine.focus();

	return false; // Don't propagate
};

exports.prototype.handleShowLanguagePicker = function(event) {
	if(!this.engine || !this.engine.domNode) return false;

	this.showLanguagePicker();
	return false;
};

exports.prototype.showLanguagePicker = function() {
	var self = this;
	var domNode = this.engine.domNode;
	var wiki = this.wiki;

	// Remove existing picker if any
	this.hideLanguagePicker();

	// Create picker container
	var picker = document.createElement("div");
	picker.className = "cm6-language-picker";
	this._languagePicker = picker;

	// Build language options dynamically from installed language plugins
	var languages = [{
		type: "",
		label: "Default (from type)",
		sortOrder: -1
	}];

	// Get all language tiddlers
	var langTiddlers = wiki.filterTiddlers("[all[tiddlers+shadows]tag[$:/tags/CodeMirror/Language]]");
	langTiddlers.forEach(function(title) {
		var tiddler = wiki.getTiddler(title);
		if(!tiddler) return;

		var pluginField = tiddler.fields.plugin;

		// Check if language is available:
		// - No plugin required (plugin field is blank/undefined)
		// - Or plugin exists as shadow or regular tiddler
		var isAvailable = !pluginField ||
			wiki.tiddlerExists(pluginField) ||
			wiki.isShadowTiddler(pluginField);

		if(isAvailable) {
			languages.push({
				type: tiddler.fields.type || "",
				label: tiddler.fields.name || title,
				sortOrder: parseInt(tiddler.fields["sort-order"], 10) || 0
			});
		}
	});

	// Sort by sort-order, then by label
	languages.sort(function(a, b) {
		if(a.sortOrder !== b.sortOrder) {
			return a.sortOrder - b.sortOrder;
		}
		return a.label.localeCompare(b.label);
	});

	languages.forEach(function(lang) {
		var btn = document.createElement("button");
		btn.className = "cm6-language-picker-option";
		btn.textContent = lang.label;
		btn.addEventListener("click", function(e) {
			e.preventDefault();
			e.stopPropagation();
			self.engine.setType(lang.type);

			// Check persistence mode
			var persistMode = self.wiki.getTiddlerText("$:/config/codemirror-6/editor/languageSwitcherPersist", "session");
			if(persistMode === "field" && self.editTitle) {
				if(lang.type === "") {
					self.wiki.setText(self.editTitle, "codemirror-type", null, undefined);
				} else {
					self.wiki.setText(self.editTitle, "codemirror-type", null, lang.type);
				}
			}

			self.hideLanguagePicker();
			self.engine.focus();
		});
		picker.appendChild(btn);
	});

	// Close on Escape
	picker.addEventListener("keydown", function(e) {
		if(e.key === "Escape") {
			self.hideLanguagePicker();
			self.engine.focus();
		}
	});

	// Close on click outside
	setTimeout(function() {
		self.document.addEventListener("click", self._pickerClickOutside = function(e) {
			if(!picker.contains(e.target)) {
				self.hideLanguagePicker();
			}
		});
	}, 0);

	// Insert at top of editor
	domNode.insertBefore(picker, domNode.firstChild);

	// Focus first option
	var firstBtn = picker.querySelector("button");
	if(firstBtn) firstBtn.focus();
};

exports.prototype.hideLanguagePicker = function() {
	if(this._languagePicker) {
		this._languagePicker.remove();
		this._languagePicker = null;
	}
	if(this._pickerClickOutside) {
		this.document.removeEventListener("click", this._pickerClickOutside);
		this._pickerClickOutside = null;
	}
};

// ============================================================================
// Plugin Registry - allows external plugins to hook into the widget
// ============================================================================

/**
 * Global registry for CM6 widget plugins.
 * Plugins register handlers that get called at various lifecycle points.
 * 
 * Usage from a plugin:
 *   var registry = require("$:/plugins/tiddlywiki/codemirror-6/widgets/subclasses/edit-text.js").registry;
 *   registry.register("zenMode", {
 *       onRender: function(widget) { ... },
 *       onMessage: { "tm-cm6-zen-mode": function(widget, event) { ... } }
 *   });
 */
var pluginRegistry = {
	_plugins: {},

	/**
	 * Register a plugin with the widget system
	 * @param {string} name - Unique plugin identifier
	 * @param {object} handlers - Object containing lifecycle hooks and message handlers
	 */
	register: function(name, handlers) {
		this._plugins[name] = handlers;
	},

	/**
	 * Unregister a plugin
	 * @param {string} name - Plugin identifier to remove
	 */
	unregister: function(name) {
		delete this._plugins[name];
	},

	/**
	 * Check if a plugin is registered
	 * @param {string} name - Plugin identifier
	 * @returns {boolean}
	 */
	has: function(name) {
		return !!this._plugins[name];
	},

	/**
	 * Get a registered plugin's handlers
	 * @param {string} name - Plugin identifier
	 * @returns {object|undefined}
	 */
	get: function(name) {
		return this._plugins[name];
	},

	/**
	 * Call a lifecycle hook on all registered plugins
	 * @param {string} hook - Hook name (e.g., "onRender", "onRefresh")
	 * @param {object} widget - The widget instance
	 * @param {...*} args - Additional arguments to pass
	 */
	callHook: function(hook, widget) {
		var args = Array.prototype.slice.call(arguments, 1);
		var pluginNames = Object.keys(this._plugins);
		for(var i = 0; i < pluginNames.length; i++) {
			var plugin = this._plugins[pluginNames[i]];
			if(plugin && typeof plugin[hook] === "function") {
				try {
					plugin[hook].apply(null, args);
				} catch (e) {}
			}
		}
	},

	/**
	 * Try to handle a message via registered plugins
	 * @param {string} message - Message type (e.g., "tm-cm6-zen-mode")
	 * @param {object} widget - The widget instance
	 * @param {object} event - The event object
	 * @returns {boolean} - True if a plugin handled the message
	 */
	handleMessage: function(message, widget, event) {
		var pluginNames = Object.keys(this._plugins);
		for(var i = 0; i < pluginNames.length; i++) {
			var plugin = this._plugins[pluginNames[i]];
			if(plugin && plugin.onMessage && typeof plugin.onMessage[message] === "function") {
				try {
					plugin.onMessage[message](widget, event);
					return true;
				} catch (e) {}
			}
		}
		return false;
	}
};

// Export registry for external plugins
exports.registry = pluginRegistry;

// ============================================================================
// Local utilities (kept local to avoid prototype pollution)
// ============================================================================

function boolConfig(wiki, title) {
	return wiki.getTiddlerText(title) === "yes";
}

function intConfig(wiki, title, fallback) {
	var v = parseInt(wiki.getTiddlerText(title), 10);
	return isFinite(v) ? v : fallback;
}

function isMainTextEditorBody(widget) {
	return !!(widget.editClass && widget.editClass.indexOf("tc-edit-texteditor-body") !== -1);
}

function hopAny(changedTiddlers, list) {
	return $tw.utils.hopArray(changedTiddlers, list);
}

// Theme-related tiddlers to watch for changes
var THEME_TIDDLERS = [
	"$:/config/codemirror-6/editor/theme",
	"$:/config/codemirror-6/editor/theme-light",
	"$:/config/codemirror-6/editor/theme-dark",
	"$:/config/codemirror-6/editor/auto-match-palette",
	"$:/palette"
];

// ============================================================================
// Theme management
// ============================================================================

/**
 * Get the current theme based on config and palette settings.
 * Supports auto-matching TiddlyWiki palette color-scheme.
 */
exports.prototype._getCurrentTheme = function() {
	var wiki = this.wiki;
	var autoMatch = wiki.getTiddlerText(
		"$:/config/codemirror-6/editor/auto-match-palette",
		"yes"
	) === "yes";

	if(autoMatch) {
		var paletteName = wiki.getTiddlerText("$:/palette");
		var palette = wiki.getTiddler(paletteName);
		var isDark = palette && palette.fields["color-scheme"] === "dark";

		return wiki.getTiddlerText(
			isDark ?
			"$:/config/codemirror-6/editor/theme-dark" :
			"$:/config/codemirror-6/editor/theme-light",
			isDark ? "vanilla-dark" : "vanilla"
		);
	}

	return wiki.getTiddlerText("$:/config/codemirror-6/editor/theme", "vanilla");
};

/**
 * Apply theme directly to DOM (fast path, no engine round-trip).
 * Theme is pure CSS via data attribute, not CM6 state.
 */
exports.prototype._applyTheme = function() {
	if(!this.engine || !this.engine.domNode) return;
	this.engine.domNode.setAttribute("data-cm6-theme", this._getCurrentTheme());
};

// ============================================================================
// Settings snapshot → engine/plugins
// ============================================================================

/**
 * Build a single settings snapshot from wiki config + widget state.
 * This avoids scattered engine toggles and allows plugins to own behavior.
 */
exports.prototype._buildSettingsSnapshot = function() {
	var wiki = this.wiki;
	var body = isMainTextEditorBody(this);

	return {
		// identity/context
		tiddlerTitle: this.editTitle,
		tiddlerType: this.editType || undefined, // Only override if explicitly set, else let engine read from tiddler
		hasStylesheetTag: !!this.hasStylesheetTag,
		readOnly: !!this.isDisabled || this.getAttribute("readonly", "no") === "yes",

		// UI / editor chrome
		editorBody: body,
		lineNumbers: boolConfig(wiki, "$:/config/codemirror-6/editor/lineNumbers") && body,
		highlightActiveLine: boolConfig(wiki, "$:/config/codemirror-6/editor/highlightActiveLine") && body,

		// text services
		spellcheck: boolConfig(wiki, "$:/config/codemirror-6/editor/spellcheck"),
		autocorrect: boolConfig(wiki, "$:/config/codemirror-6/editor/autocorrect"),
		translate: boolConfig(wiki, "$:/state/codemirror-6/translate/" + this.editTitle),

		// bracket/structure helpers
		bracketMatching: boolConfig(wiki, "$:/config/codemirror-6/editor/bracketMatching"),
		closeBrackets: boolConfig(wiki, "$:/config/codemirror-6/editor/closeBrackets"),

		// code folding
		foldGutter: boolConfig(wiki, "$:/config/codemirror-6/fold/enabled") && body,

		// indentation
		indent: {
			indentUnit: wiki.getTiddlerText("$:/config/codemirror-6/editor/indentUnit"),
			indentUnitMultiplier: wiki.getTiddlerText("$:/config/codemirror-6/editor/indentUnitMultiplier"),
			indentWithTab: boolConfig(wiki, "$:/config/codemirror-6/editor/indentWithTab")
		},

		// autocompletion
		autocompletion: {
			selectOnOpen: boolConfig(wiki, "$:/config/codemirror-6/editor/selectOnOpen"),
			icons: boolConfig(wiki, "$:/config/codemirror-6/editor/autocompleteIcons"),
			maxRenderedOptions: intConfig(wiki, "$:/config/codemirror-6/editor/maxRenderedOptions", 100),
			activateOnTyping: boolConfig(wiki, "$:/config/codemirror-6/editor/activateOnTyping"),
			completeAnyWord: boolConfig(wiki, "$:/config/codemirror-6/editor/completeAnyWord")
		},

		// theme (for plugins that might need it)
		theme: this._getCurrentTheme(),

		// keymap (vim/emacs/default)
		keymap: wiki.getTiddlerText("$:/config/codemirror-6/editor/keymap", "default"),

		// multi-cursor support
		multiCursor: boolConfig(wiki, "$:/config/codemirror-6/editor/multiCursor"),

		// trailing whitespace highlighting
		showTrailingWhitespace: boolConfig(wiki, "$:/config/codemirror-6/editor/showTrailingWhitespace"),

		// all whitespace highlighting
		showWhitespace: boolConfig(wiki, "$:/config/codemirror-6/editor/showWhitespace"),

		// bidirectional text support
		bidiPerLine: boolConfig(wiki, "$:/config/codemirror-6/editor/bidiPerLine"),

		// plugin toggles
		colorPicker: boolConfig(wiki, "$:/config/codemirror-6/color-picker/enabled"),
		imagePreview: boolConfig(wiki, "$:/config/codemirror-6/image-preview/enabled") && body,
		wordCount: boolConfig(wiki, "$:/config/codemirror-6/word-count/enabled") && body,

		// navigation features
		linkPreview: boolConfig(wiki, "$:/config/codemirror-6/link-preview/enabled"),
		clickNavigate: boolConfig(wiki, "$:/config/codemirror-6/click-navigate/enabled"),

		// tag and widget handling
		autoCloseTags: wiki.getTiddlerText("$:/config/codemirror-6/auto-close-tags/enabled", "yes") !== "no",

		// autocompletion sources
		emojiPicker: boolConfig(wiki, "$:/config/codemirror-6/emoji-picker/enabled"),
		snippets: boolConfig(wiki, "$:/config/codemirror-6/snippets/enabled")
	};
};

/**
 * Apply all config/state-driven engine settings in one place.
 * Triggers both internal engine handlers and plugin event handlers.
 */
exports.prototype.applyEngineSettings = function() {
	var engine = this.engine;
	if(!engine || (engine.isDestroyed && engine.isDestroyed())) return;

	var settings = this._buildSettingsSnapshot();

	// Trigger internal engine handlers (for compartment reconfiguration)
	if(typeof engine._triggerEvent === "function") {
		engine._triggerEvent("settingsChanged", settings);
	}

	// Also dispatch to plugins
	if(typeof engine.dispatchPluginEvent === "function") {
		engine.dispatchPluginEvent("settingsChanged", settings);
	}
};

/**
 * Cache whether the edited tiddler is tagged as stylesheet.
 */
exports.prototype.updateStylesheetTagCache = function() {
	var editTiddler = this.wiki.getTiddler(this.editTitle);
	this.hasStylesheetTag = !!(editTiddler && editTiddler.hasTag("$:/tags/Stylesheet"));
};

// ============================================================================
// Lifecycle
// ============================================================================

exports.prototype.render = function(parent, nextSibling) {
	// Call base class render
	Object.getPrototypeOf(Object.getPrototypeOf(this)).render.call(this, parent, nextSibling);

	// Register undo/redo event listeners
	this.addEventListener("tm-cm6-undo", "handleUndo");
	this.addEventListener("tm-cm6-redo", "handleRedo");
	this.addEventListener("tm-cm6-remove-trailing-whitespace", "handleRemoveTrailingWhitespace");
	this.addEventListener("tm-cm6-spaces-to-tabs", "handleSpacesToTabs");
	this.addEventListener("tm-cm6-set-language", "handleSetLanguage");
	this.addEventListener("tm-cm6-show-language-picker", "handleShowLanguagePicker");
	this.addEventListener("tm-cm6-toggle-search", "handleToggleSearch");
	this.addEventListener("tm-cm6-toggle-goto-line", "handleToggleGotoLine");

	// Init shortcut caches
	this.shortcutKeysList = [];
	this.shortcutActionList = [];
	this.shortcutParsedList = [];
	this.shortcutPriorityList = [];
	this.shortcutTiddlers = [];

	// Cache stylesheet tag status for type switching
	this.updateStylesheetTagCache();

	// Load shortcuts once initially
	this.updateShortcutLists(this.getShortcutTiddlerList());

	// Apply theme immediately (fast DOM attribute)
	this._applyTheme();

	// Store references for plugin access
	if(this.engine && this.engine.domNode) {
		this.engine.domNode._cm6Engine = this.engine;
		this.engine.domNode._cm6Widget = this;

		// Store on tiddler frame for external lookup
		var frame = this.engine.domNode.closest(".tc-tiddler-frame");
		if(frame) {
			frame._cm6Widget = this;
		}
	}

	// Notify registered plugins
	pluginRegistry.callHook("onRender", this);

	// Emit initial settings snapshot
	this.applyEngineSettings();
};

exports.prototype.execute = function() {
	Object.getPrototypeOf(Object.getPrototypeOf(this)).execute.call(this);
	this.editType = this.getAttribute("type", "");
};

exports.prototype.getShortcutTiddlerList = function() {
	return this.wiki.getTiddlersWithTag("$:/tags/KeyboardShortcut/CodeMirror");
};

/**
 * Detect changes to platform keyboard config tiddlers ($:/config/<platform>/...)
 */
exports.prototype.detectNewShortcuts = function(changedTiddlers) {
	var shortcutConfigTiddlers = [];
	var handled = false;

	$tw.utils.each($tw.keyboardManager.lookupNames, function(platformDescriptor) {
		var descriptorPrefix = "$:/config/" + platformDescriptor + "/";
		Object.keys(changedTiddlers).forEach(function(t) {
			var prefix = t.substr(0, t.lastIndexOf("/") + 1);
			if(prefix === descriptorPrefix) {
				shortcutConfigTiddlers.push(t);
				handled = true;
			}
		});
	});

	return handled ? $tw.utils.hopArray(changedTiddlers, shortcutConfigTiddlers) : false;
};

exports.prototype.updateShortcutLists = function(tiddlerList) {
	this.shortcutTiddlers = tiddlerList || [];

	this.shortcutKeysList.length = this.shortcutTiddlers.length;
	this.shortcutActionList.length = this.shortcutTiddlers.length;
	this.shortcutParsedList.length = this.shortcutTiddlers.length;
	this.shortcutPriorityList.length = this.shortcutTiddlers.length;

	for(var i = 0; i < this.shortcutTiddlers.length; i++) {
		var title = this.shortcutTiddlers[i];
		var t = this.wiki.getTiddler(title);
		var fields = (t && t.fields) ? t.fields : {};

		this.shortcutKeysList[i] = fields.key !== undefined ? fields.key : undefined;
		this.shortcutActionList[i] = fields.text;

		this.shortcutParsedList[i] = this.shortcutKeysList[i] !== undefined ?
			$tw.keyboardManager.parseKeyDescriptors(this.shortcutKeysList[i]) :
			undefined;

		this.shortcutPriorityList[i] = fields.priority === "yes";
	}
};

// ============================================================================
// Keyboard shortcut handling for CodeMirror-specific shortcuts
// ============================================================================

/**
 * Handle keydown events - check against registered CodeMirror shortcuts
 * Called by the engine's keydown handler
 */
exports.prototype.handleKeydownEvent = function(event) {
	// First check CodeMirror-specific shortcuts ($:/tags/KeyboardShortcut/CodeMirror)
	for(var i = 0; i < this.shortcutParsedList.length; i++) {
		var parsed = this.shortcutParsedList[i];
		if(parsed && $tw.keyboardManager.checkKeyDescriptors(event, parsed)) {
			// Found a match - execute the action
			var action = this.shortcutActionList[i];
			if(action) {
				event.preventDefault();
				event.stopPropagation();
				// Parse and invoke the action widgets
				this.invokeActionString(action, this, event);
				return true;
			}
		}
	}
	// No CodeMirror-specific shortcut matched, delegate to parent class
	// This handles toolbar shortcuts (Ctrl+B for bold, etc.) by checking
	// data-tw-keyboard-shortcut attributes on toolbar buttons
	return Object.getPrototypeOf(Object.getPrototypeOf(this)).handleKeydownEvent.call(this, event);
};

// ============================================================================
// Message handling with plugin support
// ============================================================================

/**
 * Handle messages - first check registered plugins, then engine plugins, then fall back to built-in handlers
 */
exports.prototype.dispatchEvent = function(event) {
	// Try plugin registry handlers first
	if(event.type && pluginRegistry.handleMessage(event.type, this, event)) {
		return true;
	}

	// Try engine plugin handlers (codemirror6-plugin modules with onMessage)
	if(event.type && this.engine && this.engine._activePlugins) {
		for(var i = 0; i < this.engine._activePlugins.length; i++) {
			var plugin = this.engine._activePlugins[i];
			if(plugin.onMessage && typeof plugin.onMessage[event.type] === "function") {
				try {
					plugin.onMessage[event.type](this, event);
					return true;
				} catch (e) {}
			}
		}
	}

	// Check local event listeners (same as Widget.prototype.dispatchEvent)
	event.widget = event.widget || this;
	var listeners = this.eventListeners[event.type];
	if(listeners) {
		var self = this;
		var shouldPropagate = true;
		$tw.utils.each(listeners, function(handler) {
			var propagate;
			if(typeof handler === "string") {
				propagate = self[handler].call(self, event);
			} else {
				propagate = handler.call(self, event);
			}
			if(propagate === false) {
				shouldPropagate = false;
			}
		});
		if(!shouldPropagate) {
			return false;
		}
	}

	// Dispatch to parent widget
	if(this.parentWidget) {
		return this.parentWidget.dispatchEvent(event);
	}
	return true;
};

// ============================================================================
// IMPORTANT: override toolbar operation routing (new architecture)
// ============================================================================

/**
 * Handle an edit text operation message from the toolbar.
 *
 * Calls the core texteditoroperation handlers to modify the operation object,
 * then executes via the CM6 engine.
 */
exports.prototype.handleEditTextOperationMessage = function(event) {
	if(!this.engine || (this.engine.isDestroyed && this.engine.isDestroyed())) return;

	// Prepare information about the operation
	var operation = this.engine.createTextOperation();

	// Capture prefix/suffix from event params for multi-cursor support
	if(event.paramObject) {
		if(event.paramObject.prefix !== undefined) {
			operation.prefix = event.paramObject.prefix;
		}
		if(event.paramObject.suffix !== undefined) {
			operation.suffix = event.paramObject.suffix;
		}
	}

	// Invoke the handler for the selected operation (e.g., wrap-selection, prefix-lines)
	var handler = this.editorOperations[event.param];
	if(handler) {
		handler.call(this, event, operation);
	}

	// Execute the operation via the engine
	var newText = this.engine.executeTextOperation(operation);

	// Fix height and save changes
	this.engine.fixHeight();
	this.saveChanges(newText);
};

// ============================================================================
// Events / DOM integration
// ============================================================================

exports.prototype.handlePasteEvent = function(event) {
	if(event.clipboardData && event.clipboardData.files && event.clipboardData.files.length) {
		event.preventDefault();
		event.stopPropagation();
		this.dispatchDOMEvent(this.cloneEvent(event, ["clipboardData"]));
		return true;
	}
	return false;
};

// ============================================================================
// Refresh (hardened)
// ============================================================================

exports.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	var wiki = this.wiki;

	// Wrapper class changes
	if(changedAttributes["class"]) {
		if(this.engine && typeof this.engine.assignDomNodeClasses === "function") {
			this.engine.assignDomNodeClasses();
		}
	}

	// Stylesheet tag change may affect type resolution
	var editTiddler = wiki.getTiddler(this.editTitle);
	if(editTiddler) {
		var newHasStylesheetTag = editTiddler.hasTag("$:/tags/Stylesheet");
		if(newHasStylesheetTag !== this.hasStylesheetTag) {
			this.hasStylesheetTag = newHasStylesheetTag;
			this.applyEngineSettings();
		}
	} else if(this.hasStylesheetTag) {
		this.hasStylesheetTag = false;
		this.applyEngineSettings();
	}

	// If type attribute changed, re-emit settings (includes tiddlerType)
	if(changedAttributes.type) {
		this.editType = this.getAttribute("type", "");
		this.applyEngineSettings();
	}

	// Theme changes: apply directly (fast path, DOM only)
	if(hopAny(changedTiddlers, THEME_TIDDLERS)) {
		this._applyTheme();
	}

	// Any config/state under these prefixes triggers settingsChanged
	var settingsChanged = false;
	Object.keys(changedTiddlers).forEach(function(t) {
		if(t.indexOf("$:/config/codemirror-6/") === 0) settingsChanged = true;
		if(t.indexOf("$:/state/codemirror-6/translate/") === 0) settingsChanged = true;
	});
	if(settingsChanged) {
		this.applyEngineSettings();
	}

	// Shortcut changes: recompute and notify (engine/plugins should rebuild keymaps)
	var newList = this.getShortcutTiddlerList();
	var hasShortcutChanged =
		hopAny(changedTiddlers, this.shortcutTiddlers) ||
		hopAny(changedTiddlers, newList) ||
		!!this.detectNewShortcuts(changedTiddlers);

	if(hasShortcutChanged) {
		this.updateShortcutLists(newList);

		// Emit a dedicated event so a keymap plugin can rebuild
		if(this.engine && typeof this.engine.dispatchPluginEvent === "function") {
			this.engine.dispatchPluginEvent("shortcutsChanged", {
				keys: this.shortcutKeysList,
				actions: this.shortcutActionList,
				parsed: this.shortcutParsedList,
				priority: this.shortcutPriorityList,
				tiddlers: this.shortcutTiddlers
			});
		}
	}

	// Check for tag changes on the edited tiddler (for tag-based language switching)
	if(this.editTitle && changedTiddlers[this.editTitle] && this.engine) {
		this.engine.refreshLanguageConditions();
	}

	// Notify registered plugins of refresh
	pluginRegistry.callHook("onRefresh", this, changedTiddlers);

	// Notify engine plugins of refresh (codemirror6-plugin modules)
	if(this.engine && typeof this.engine.dispatchPluginEvent === "function") {
		this.engine.dispatchPluginEvent("onRefresh", this, changedTiddlers);
	}

	// Call base refresh
	return Object.getPrototypeOf(Object.getPrototypeOf(this)).refresh.call(this, changedTiddlers);
};
