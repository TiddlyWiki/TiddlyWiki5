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

var langHtml = safeRequire("$:/plugins/tiddlywiki/codemirror-6/lib/codemirror-lang-html.js");

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
exports.langHtml = langHtml || {};

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
	if (langDesc && registeredLanguages.indexOf(langDesc) === -1) {
		registeredLanguages.push(langDesc);
	}
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
 */
exports.registerNestedLanguageCompletion = function(config) {
	if (config && config.name && config.language && config.source) {
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
