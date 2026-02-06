/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/edit-text/edit-text.js
type: application/javascript
module-type: widget

Edit-text widget using CodeMirror engine
With dynamic configuration support for all settings
Falls back to FramedEngine/SimpleEngine if CodeMirror is not available

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

if(!$tw.browser) return;

// Check if another CodeMirror engine is already registered
var hasExistingCM = false;
$tw.modules.forEachModuleOfType("widget", function(title, module) {
	if(module["edit-codemirror"] || module["edit-codemirror-6"]) {
		hasExistingCM = true;
	}
});
if(hasExistingCM) {
	return;
}

var editTextWidgetFactory = require("$:/core/modules/editor/factory.js").editTextWidgetFactory,
	SimpleEngine = require("$:/core/modules/editor/engines/simple.js").SimpleEngine,
	FramedEngine = require("$:/core/modules/editor/engines/framed.js").FramedEngine;

// Try to load CodeMirror engines
var CodeMirrorEngine = null,
	CodeMirrorSimpleEngine = null,
	useCodeMirror = false;

try {
	CodeMirrorEngine = require("$:/plugins/tiddlywiki/codemirror-6/engine.js").CodeMirrorEngine;
	CodeMirrorSimpleEngine = require("$:/plugins/tiddlywiki/codemirror-6/plugins/edit-text/engine.js").CodeMirrorSimpleEngine;
	useCodeMirror = !!(CodeMirrorEngine && CodeMirrorSimpleEngine);
} catch (e) {
	// CodeMirror not available, will use fallback
}

// If CodeMirror is not available, use native TiddlyWiki engines and exit early
if(!useCodeMirror) {
	exports["edit-text"] = editTextWidgetFactory(FramedEngine, SimpleEngine);
	return;
}

// ============================================================================
// CodeMirror is available - set up full CM6 widget
// ============================================================================

// Input types that should use CodeMirror (text-based inputs that benefit from syntax highlighting)
var CM_SUPPORTED_TYPES = {
	"text": true,
	"search": true,
	"": true, // default/unspecified
	undefined: true
};

/**
 * Wrapper engine that delegates to CodeMirrorSimpleEngine for text-based inputs,
 * but falls back to TiddlyWiki's native SimpleEngine for specialized types
 * (number, password, email, date, color, range, etc.)
 */
function SmartSimpleEngine(options) {
	var widget = options.widget;
	var inputType = widget && widget.editType;

	// For types that don't benefit from CodeMirror, use native SimpleEngine
	if(!CM_SUPPORTED_TYPES[inputType]) {
		return new SimpleEngine(options);
	}

	// For text-based types, use CodeMirror
	return new CodeMirrorSimpleEngine(options);
}

// Create base widget from factory
var BaseEditTextWidget = editTextWidgetFactory(CodeMirrorEngine, SmartSimpleEngine);

// Theme-related tiddlers to watch for changes
var THEME_TIDDLERS = [
	"$:/config/codemirror-6/editor/theme",
	"$:/config/codemirror-6/editor/theme-light",
	"$:/config/codemirror-6/editor/theme-dark",
	"$:/config/codemirror-6/editor/auto-match-palette",
	"$:/palette"
];

// Helper to get boolean config
function boolConfig(wiki, tiddler, defaultVal) {
	var val = wiki.getTiddlerText(tiddler);
	if(val === undefined || val === null || val === "") {
		return defaultVal !== false;
	}
	return val === "yes";
}

// Check if any tiddler in a list changed
function hopAny(changedTiddlers, list) {
	for(var i = 0; i < list.length; i++) {
		if(changedTiddlers[list[i]]) return true;
	}
	return false;
}

// Subclass using ES6 class syntax to add config change handling
class CM6EditTextWidget extends BaseEditTextWidget {
	constructor(parseTreeNode, options) {
		super(parseTreeNode, options);
	}

	// ============================================================================
	// Theme management
	// ============================================================================

	/**
	 * Get the current theme based on config and palette settings.
	 * Supports auto-matching TiddlyWiki palette color-scheme.
	 */
	_getCurrentTheme() {
		var wiki = this.wiki;
		var autoMatch = wiki.getTiddlerText(
			"$:/config/codemirror-6/editor/auto-match-palette",
			"yes"
		) === "yes";

		if(autoMatch) {
			var palette = wiki.getTiddler("$:/palette");
			var colorScheme = palette && palette.fields["color-scheme"];
			var isDark = colorScheme === "dark";

			return wiki.getTiddlerText(
				isDark ?
				"$:/config/codemirror-6/editor/theme-dark" :
				"$:/config/codemirror-6/editor/theme-light",
				isDark ? "vanilla-dark" : "vanilla"
			);
		}

		return wiki.getTiddlerText("$:/config/codemirror-6/editor/theme", "vanilla");
	}

	/**
	 * Apply theme directly to DOM via data attribute.
	 */
	_applyTheme() {
		if(!this.engine || !this.engine.domNode) return;
		this.engine.domNode.setAttribute("data-cm6-theme", this._getCurrentTheme());
	}

	// ============================================================================
	// Settings management
	// ============================================================================

	/**
	 * Build a settings snapshot from current config tiddlers
	 */
	_buildSettingsSnapshot() {
		var wiki = this.wiki;

		return {
			// Editing features
			bracketMatching: boolConfig(wiki, "$:/config/codemirror-6/editor/bracketMatching", true),
			closeBrackets: boolConfig(wiki, "$:/config/codemirror-6/editor/closeBrackets", true),

			// Spellcheck
			spellcheck: boolConfig(wiki, "$:/config/codemirror-6/editor/spellcheck", false),

			// Indentation
			indent: {
				indentUnit: wiki.getTiddlerText("$:/config/codemirror-6/editor/indentUnit", "tabs"),
				indentUnitMultiplier: wiki.getTiddlerText("$:/config/codemirror-6/editor/indentUnitMultiplier", "4")
			},

			// Keymap settings (engine resolves fallback chain based on mode)
			keymap: wiki.getTiddlerText("$:/config/codemirror-6/editor/keymap", "default") || "default",
			simpleKeymap: wiki.getTiddlerText("$:/config/codemirror-6/simple/keymap", ""),
			simpleKeymapInput: wiki.getTiddlerText("$:/config/codemirror-6/simple/keymap-input", ""),
			simpleKeymapTextarea: wiki.getTiddlerText("$:/config/codemirror-6/simple/keymap-textarea", ""),

			// Theme (for plugins that might need it)
			theme: this._getCurrentTheme(),

			// Line numbers and active line (for line-numbers plugin)
			lineNumbers: boolConfig(wiki, "$:/config/codemirror-6/editor/lineNumbers", true),
			highlightActiveLine: boolConfig(wiki, "$:/config/codemirror-6/editor/highlightActiveLine", true),

			// Autocompletion features
			emojiPicker: boolConfig(wiki, "$:/config/codemirror-6/emoji-picker/enabled", true),
			snippets: boolConfig(wiki, "$:/config/codemirror-6/snippets/enabled", true),
			completeAnyWord: boolConfig(wiki, "$:/config/codemirror-6/editor/completeAnyWord", false),

			// Visual features
			colorPicker: boolConfig(wiki, "$:/config/codemirror-6/color-picker/enabled", false),
			imagePreview: boolConfig(wiki, "$:/config/codemirror-6/image-preview/enabled", false),
			wordCount: boolConfig(wiki, "$:/config/codemirror-6/word-count/enabled", false),
			showTrailingWhitespace: boolConfig(wiki, "$:/config/codemirror-6/editor/showTrailingWhitespace", false),
			showWhitespace: boolConfig(wiki, "$:/config/codemirror-6/editor/showWhitespace", false),

			// Navigation features
			linkPreview: boolConfig(wiki, "$:/config/codemirror-6/link-preview/enabled", true),
			clickNavigate: boolConfig(wiki, "$:/config/codemirror-6/click-navigate/enabled", true),

			// Tag and widget handling
			autoCloseTags: wiki.getTiddlerText("$:/config/codemirror-6/auto-close-tags/enabled", "yes") !== "no",

			// Multi-cursor editing
			multiCursor: boolConfig(wiki, "$:/config/codemirror-6/editor/multiCursor", true)
		};
	}

	/**
	 * Apply settings to the engine
	 */
	_applyEngineSettings() {
		var engine = this.engine;
		if(!engine) return;

		var settings = this._buildSettingsSnapshot();

		// Trigger settingsChanged event on engine
		if(typeof engine._triggerEvent === "function") {
			engine._triggerEvent("settingsChanged", settings);
		}

		// Also call the handler directly if it exists
		if(typeof engine._handleSettingsChanged === "function") {
			engine._handleSettingsChanged(settings);
		}
	}

	// ============================================================================
	// Render override to apply theme on creation
	// ============================================================================

	render(parent, nextSibling) {
		var result = super.render(parent, nextSibling);
		// Apply theme after engine is created
		this._applyTheme();
		return result;
	}

	// ============================================================================
	// Refresh override to handle config changes
	// ============================================================================

	refresh(changedTiddlers) {
		// Theme changes: apply directly (fast path, DOM only)
		if(hopAny(changedTiddlers, THEME_TIDDLERS)) {
			this._applyTheme();
		}

		// Check if any config tiddler changed (for simple engine with settings support)
		if(this.engine && typeof this.engine._handleSettingsChanged === "function") {
			var settingsChanged = false;
			var keys = Object.keys(changedTiddlers);
			for(var i = 0; i < keys.length; i++) {
				if(keys[i].indexOf("$:/config/codemirror-6/") === 0) {
					settingsChanged = true;
					break;
				}
			}
			if(settingsChanged) {
				this._applyEngineSettings();
			}
		}

		// Call parent refresh
		return super.refresh(changedTiddlers);
	}
}

exports["edit-text"] = CM6EditTextWidget;
