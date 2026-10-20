/*\
title: $:/plugins/tiddlywiki/codemirror-6/lang-javascript/plugin.js
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

function isJavaScriptType(type) {
	return ALL_TYPES.indexOf(type) !== -1;
}

// Get the correct LanguageSupport based on content type
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

	/*
	Expose the real content types handled by this plugin.

	This lets the engine resolve a winning tag override to a full language
	mode instead of treating tag override as a partial/side mode.
	*/
	contentTypes: ALL_TYPES,
	types: ALL_TYPES,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			javascriptLanguage: new Compartment()
		};
	},

	getTagOverrideType: function(context) {
		if(context.tagOverrideWinner === TAGS_CONFIG_TIDDLER) {
			return JS_TYPES[0];
		}
		return null;
	},

	condition: function(context) {
		var effectiveType = context.effectiveType || context.tiddlerType || "";

		/*
		If a tag override is active, only the winning tag/plugin may activate.

		Do not use hasConfiguredTag() in this branch. A tiddler may contain
		multiple configured language tags, but the engine has already selected
		the winning one.
		*/
		if(context.hasTagOverride) {
			return context.tagOverrideWinner === TAGS_CONFIG_TIDDLER ||
				isJavaScriptType(effectiveType);
		}

		/*
		Normal mode:
		- dropdown/session override
		- codemirror-type field
		- actual type field
		- configured JavaScript language tag
		*/
		if(isJavaScriptType(effectiveType)) return true;
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;

		return false;
	},

	/*
	Runtime language switching uses this.

	This must return raw compartment content only.
	Do not return javascriptLanguage.of(...) from here.
	*/
	getCompartmentContent: function(context) {
		var core = this._core;
		var effectiveType = context.effectiveType || context.tiddlerType || JS_TYPES[0];
		var variant = getLanguageVariant(core, effectiveType);
		var extensions = [];

		if(!variant.support) {
			return [];
		}

		/*
		Use only the language extension inside the language compartment.

		Do not put the whole LanguageSupport wrapper here, because its
		languageData may duplicate the explicit completion registration below.
		*/
		if(variant.support.language) {
			extensions.push(variant.support.language);
		} else {
			extensions.push(variant.support);
		}

		/*
		Register completion source with the engine's completion system.

		Because getCompartmentContent() is also used during runtime switching,
		completions become available after dropdown/session/tag overrides too.
		*/
		if(context.engine && context.engine.registerCompletionSource) {
			if(context.engine.unregisterCompletionSourcesForPlugin) {
				context.engine.unregisterCompletionSourcesForPlugin(this);
			}

			if(core.javascriptCompletionSource) {
				context.engine.registerCompletionSource(
					core.javascriptCompletionSource,
					50,
					this
				);
			}
		} else if(core.javascriptCompletionExtension) {
			/*
			Fallback only.

			This is raw extension content, so it is still safe to return from
			getCompartmentContent().
			*/
			extensions.push(core.javascriptCompletionExtension);
		}

		return extensions;
	},

	/*
	Initial editor construction uses this.

	This may wrap the raw content in the plugin's compartment.
	*/
	getExtensions: function(context) {
		var compartments = context.engine._compartments;

		if(compartments.javascriptLanguage) {
			return [
				compartments.javascriptLanguage.of(
					this.getCompartmentContent(context)
				)
			];
		}

		return this.getCompartmentContent(context);
	}
};
