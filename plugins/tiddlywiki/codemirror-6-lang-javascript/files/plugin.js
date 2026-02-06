/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-javascript/plugin.js
type: application/javascript
module-type: codemirror6-plugin

JavaScript/TypeScript/JSX/TSX language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var hasConfiguredTag;
try {
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	return;
}

if(!hasConfiguredTag) return;

// Content types that activate this plugin
var JS_TYPES = [
	"application/javascript",
	"text/javascript",
	"application/x-javascript"
];

var TS_TYPES = [
	"application/typescript",
	"application/x-typescript"
];

var JSX_TYPES = [
	"text/jsx",
	"application/jsx"
];

var TSX_TYPES = [
	"text/tsx",
	"application/tsx"
];

var ALL_TYPES = JS_TYPES.concat(TS_TYPES, JSX_TYPES, TSX_TYPES);

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-javascript/tags";

// Get the correct LanguageSupport based on content type
// NOTE: We don't return completion extension here - it's created fresh in getExtensions
function getLanguageVariant(core, contentType) {
	var support = null;
	var variantName = "javascript";

	if(TS_TYPES.indexOf(contentType) !== -1) {
		support = core.typescriptSupport;
		variantName = "typescript";
	} else if(JSX_TYPES.indexOf(contentType) !== -1) {
		support = core.jsxSupport;
		variantName = "jsx";
	} else if(TSX_TYPES.indexOf(contentType) !== -1) {
		support = core.tsxSupport;
		variantName = "tsx";
	} else {
		// Default to JavaScript
		support = core.javascriptSupport;
		variantName = "javascript";
	}

	// Fallback for backwards compatibility
	if(!support) {
		support = core.javascriptSupport;
	}

	return {
		support: support,
		variant: variantName
	};
}

exports.plugin = {
	name: "lang-javascript",
	description: "JavaScript/TypeScript/JSX/TSX syntax highlighting and completions",
	priority: 50,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			javascriptLanguage: new Compartment()
		};
	},

	condition: function(context) {
		// If any tag override is active, only the winning plugin activates
		if(context.hasTagOverride) {
			return context.tagOverrideWinner === TAGS_CONFIG_TIDDLER;
		}
		// Normal mode: tag match or type match
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;
		return ALL_TYPES.indexOf(context.tiddlerType) !== -1;
	},

	getCompartmentContent: function(context) {
		var variant = getLanguageVariant(this._core, context.tiddlerType);
		return variant.support;
	},

	getExtensions: function(context) {
		var core = this._core;
		var compartments = context.engine._compartments;
		var variant = getLanguageVariant(core, context.tiddlerType);

		if(!variant.support) {
			return [];
		}

		// Get ONLY the language, not the full LanguageSupport extension
		var language = variant.support.language;

		// Build extensions array - just the language, no LanguageSupport wrapper
		var extensions = [];
		if(compartments.javascriptLanguage) {
			extensions.push(compartments.javascriptLanguage.of(language));
		} else {
			extensions.push(language);
		}

		// For direct JS tiddlers, DON'T add the language.data.of() extension
		// Instead, register completion source directly with the engine
		// This avoids duplication from the languageData system
		var completionSource = core.javascriptCompletionSource;
		if(completionSource && context.engine && context.engine.registerCompletionSource) {
			// Register with engine's completion system instead of language data
			// Pass plugin reference so it can be unregistered when plugin becomes inactive
			context.engine.registerCompletionSource(completionSource, 50, this);
		} else {
			// Fallback: use the data.of extension
			var completionExt = core.javascriptCompletionExtension;
			if(completionExt) {
				extensions.push(completionExt);
			}
		}

		return extensions;
	}
};
