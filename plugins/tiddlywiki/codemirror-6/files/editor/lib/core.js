/*\
title: $:/plugins/tiddlywiki/codemirror-6/lib/core.js
type: application/javascript
module-type: library

CM6 core adapter for the BurningTreeC CM6 engine.

Exports a stable object with namespaces:
- state
- view
- commands
- language
- autocomplete
- (optional) langHtml
- lezerCommon
- lezerHighlight

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function safeRequire(title) {
	try {
		return require(title);
	} catch (e) {
		return null;
	}
}

var state = safeRequire("$:/plugins/tiddlywiki/codemirror-6/lib/codemirror-state.js");
var view = safeRequire("$:/plugins/tiddlywiki/codemirror-6/lib/codemirror-view.js");
var commands = safeRequire("$:/plugins/tiddlywiki/codemirror-6/lib/codemirror-commands.js");
var language = safeRequire("$:/plugins/tiddlywiki/codemirror-6/lib/codemirror-language.js");
var autocomplete = safeRequire("$:/plugins/tiddlywiki/codemirror-6/lib/codemirror-autocomplete.js");

// NOT required here: see the lazy `langHtml` export below.

// Lezer
var lezerCommon = safeRequire("$:/plugins/tiddlywiki/codemirror-6/lib/lezer-common.js");
var lezerHighlight = safeRequire("$:/plugins/tiddlywiki/codemirror-6/lib/lezer-highlight.js");

// Basic validation: engine expects state + view at minimum
if (!state || !view) {
	throw new Error(
		"library-core.js: Missing CM6 core modules. " +
		"Expected at least codemirror-state.js and codemirror-view.js under $:/plugins/tiddlywiki/codemirror-6/lib/."
	);
}

exports.state = state;
exports.view = view;
exports.commands = commands || {};
exports.language = language || {};
exports.autocomplete = autocomplete || {};
/*
Resolved on first access rather than at load.

The HTML grammar is 164 KB and requiring it here put it in the boot path of every
wiki that touches the editor at all. Nothing in this plugin or the language plugins
reads core.langHtml -- lang-html requires the grammar directly, on demand -- so this
exists for external consumers, and they can pay for it if they use it.
*/
var _langHtml;
Object.defineProperty(exports, "langHtml", {
	configurable: true,
	enumerable: true,
	get: function() {
		if (_langHtml === undefined) {
			_langHtml = safeRequire("$:/plugins/tiddlywiki/codemirror-6/lib/codemirror-lang-html.js") || {};
		}
		return _langHtml;
	}
});

exports.lezerCommon = lezerCommon || {};
exports.lezerHighlight = lezerHighlight || {};

// Convenience re-exports (optional, but handy)
exports.EditorState = state.EditorState;
exports.Compartment = state.Compartment;
exports.EditorView = view.EditorView;
exports.keymap = view.keymap;

// ============================================================================
// Language Registration API
// ============================================================================

// Registered languages array
var registeredLanguages = [];

/**
 * Register a language for code block syntax highlighting.
 * Language plugins should call this during initialization.
 *
 * @param {LanguageDescription} langDesc - A LanguageDescription from @codemirror/language
 *
 * Example usage in a language plugin:
 *   var core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
 *   var langJs = require("$:/plugins/.../lang-javascript.js");
 *   core.registerLanguage(core.language.LanguageDescription.of({
 *     name: "JavaScript",
 *     alias: ["js", "ecmascript", "node"],
 *     extensions: ["js", "mjs", "cjs"],
 *     support: langJs.javascript()
 *   }));
 */
exports.registerLanguage = function(langDesc) {
	if (!langDesc || registeredLanguages.indexOf(langDesc) !== -1) {
		return;
	}
	/*
	Deduped by name as well as by identity.

	Call sites build a fresh LanguageDescription each time, so an identity check alone
	does not stop the same language being registered twice -- which is what happened to
	TiddlyWiki, registered both by the registry and from the language plugin's init().
	Every duplicate is a second parser configuration built and retained, and every
	engine copies the whole list into its codeLanguages.

	First registration wins, so a lazy description is not replaced by an eager one that
	arrives later with the grammar already loaded.
	*/
	if (langDesc.name) {
		for (var i = 0; i < registeredLanguages.length; i++) {
			if (registeredLanguages[i].name === langDesc.name) {
				return;
			}
		}
	}
	registeredLanguages.push(langDesc);
};

/**
 * Get all registered languages.
 * The engine uses this to pass languages to the parser plugin.
 *
 * @returns {LanguageDescription[]} Array of registered LanguageDescriptions
 */
exports.getLanguages = function() {
	return registeredLanguages.slice(); // Return a copy
};

/**
 * Clear all registered languages (mainly for testing).
 */
exports.clearLanguages = function() {
	registeredLanguages = [];
};

// ============================================================================
// Nested Language Completion API
// ============================================================================

// Registered nested language completion sources
var nestedLanguageCompletions = [];

/**
 * Register a completion source for a nested language (used in code blocks).
 * Language plugins should call this during initialization.
 *
 * @param {Object} config - Configuration object
 * @param {string} config.name - Language name (e.g., "javascript", "python")
 * @param {Language} config.language - Language object with isActiveAt(state, pos) method
 * @param {Function} config.source - Completion source function(context) => CompletionResult | null
 *
 * Example usage:
 *   core.registerNestedLanguageCompletion({
 *     name: "javascript",
 *     language: javascriptLanguage,  // Language object with isActiveAt method
 *     source: jsCompletionSource
 *   });
 *
 * A language may also be supplied lazily, as getLanguage(), for languages whose
 * grammar is only loaded on demand:
 *
 *   core.registerNestedLanguageCompletion({
 *     name: "javascript",
 *     getLanguage: function() { return loadGrammar().javascriptLanguage; },
 *     source: function(context) { return loadGrammar().completion(context); }
 *   });
 *
 * The entry is registered immediately -- which matters, because lang-tiddlywiki
 * decides whether to wire up nested completion at all from whether this list is
 * non-empty when it builds its language support -- while `language` is resolved
 * on first access, i.e. when a completion is actually requested.
 */
exports.registerNestedLanguageCompletion = function(config) {
	if (!config || !config.name || !config.source) {
		return;
	}
	// Deliberately does NOT read config.language while deciding: on a lazy entry that
	// would resolve the getter here, at registration, which is exactly what it exists
	// to avoid.
	var isLazy = typeof config.getLanguage === "function" &&
		!Object.prototype.hasOwnProperty.call(config, "language");
	if (isLazy) {
		var resolved = false, value = null, getLanguage = config.getLanguage;
		Object.defineProperty(config, "language", {
			configurable: true,
			enumerable: true,
			get: function() {
				if (!resolved) {
					resolved = true;
					try {
						value = getLanguage();
					} catch (e) {
						value = null;
					}
				}
				return value;
			}
		});
	}
	if (isLazy || config.language) {
		// Check for duplicates by name
		for (var i = 0; i < nestedLanguageCompletions.length; i++) {
			if (nestedLanguageCompletions[i].name === config.name) {
				// Replace existing
				nestedLanguageCompletions[i] = config;
				return;
			}
		}
		nestedLanguageCompletions.push(config);
	}
};

/**
 * Get all registered nested language completion sources.
 *
 * @returns {Array} Array of { name, language, source } objects
 */
exports.getNestedLanguageCompletions = function() {
	return nestedLanguageCompletions.slice(); // Return a copy
};
