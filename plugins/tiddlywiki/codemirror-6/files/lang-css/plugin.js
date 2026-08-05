/*\
title: $:/plugins/tiddlywiki/codemirror-6/lang-css/plugin.js
type: application/javascript
module-type: codemirror6-plugin

CSS language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var core, hasConfiguredTag;
try {
	core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	// Dependencies not available - plugin will not load
	return;
}

if(!core || !hasConfiguredTag) return;

/*
The language grammar is required on first use, not at module load.

Every codemirror6-plugin module gets executed when the language registry runs, so a
top-level require here pulled this grammar -- and the CodeMirror dependency graph
behind it -- in as soon as anything touched the editor, including for wikis whose
user never opens a file of this type. require() is memoised by TiddlyWiki, so the
work still happens exactly once, on the first editor that actually needs it.
*/
var langCss;
function getLangCss() {
	if(langCss === undefined) {
		try {
			langCss = require("$:/plugins/tiddlywiki/codemirror-6/lang-css/lang-css.js") || null;
		} catch (e) {
			langCss = null;
		}
	}
	return langCss;
}

// Content types that activate this plugin
var CSS_TYPES = [
	"text/css"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-css/tags";

function isCssType(type) {
	return CSS_TYPES.indexOf(type) !== -1;
}

exports.plugin = {
	name: "lang-css",
	description: "CSS syntax highlighting",
	priority: 50,

	/*
	Expose the real language types handled by this plugin.

	This gives the engine a clean way to resolve a winning tag override
	to a full language mode instead of treating the tag override as a
	separate half-mode.
	*/
	contentTypes: CSS_TYPES,
	types: CSS_TYPES,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			cssLanguage: new Compartment()
		};
	},

	getTagOverrideType: function(context) {
		if(context.tagOverrideWinner === TAGS_CONFIG_TIDDLER) {
			return CSS_TYPES[0];
		}
		return null;
	},

	condition: function(context) {
		var effectiveType = context.effectiveType || context.tiddlerType || "";

		/*
		If a tag override is active, only the winning tag/plugin may activate.

		Important:
		Do not also allow hasConfiguredTag() here, because a tiddler may have
		multiple configured language tags. The engine decides the winner.
		*/
		if(context.hasTagOverride) {
			return context.tagOverrideWinner === TAGS_CONFIG_TIDDLER ||
				isCssType(effectiveType);
		}

		/*
		Normal mode:
		- dropdown/session override
		- codemirror-type field
		- actual type field
		- configured CSS language tag
		*/
		if(isCssType(effectiveType)) return true;
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;

		return false;
	},

	/*
	Runtime language switching uses this.

	This must return raw compartment content only.
	Do not return cssLanguage.of(...) from here.
	*/
	getCompartmentContent: function(_context) {
		var lang = getLangCss();
		var extensions = lang ? [lang.css()] : [];

		// Add enhanced CSS completions with page class support
		// registered by register.js at startup
		if(core.cssCompletionExtension) {
			extensions.push(core.cssCompletionExtension);
		}

		return extensions;
	},

	/*
	Initial editor construction uses this.

	This may wrap the raw content in the plugin's compartment.
	*/
	getExtensions: function(context) {
		var compartments = context.engine._compartments;

		if(compartments.cssLanguage) {
			return [
				compartments.cssLanguage.of(
					this.getCompartmentContent(context)
				)
			];
		}

		return this.getCompartmentContent(context);
	}
};
