/*\
title: $:/plugins/tiddlywiki/codemirror-6/lang-html/plugin.js
type: application/javascript
module-type: codemirror6-plugin

HTML language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langHtml, core, hasConfiguredTag;
try {
	// Use the HTML language from the core lib (already bundled)
	langHtml = require("$:/plugins/tiddlywiki/codemirror-6/lib/codemirror-lang-html.js");
	core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	return;
}

if(!langHtml || !core || !hasConfiguredTag) return;

// Content types that activate this plugin
var HTML_TYPES = [
	"text/html",
	"text/xhtml"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-html/tags";

function isHtmlType(type) {
	return HTML_TYPES.indexOf(type) !== -1;
}

exports.plugin = {
	name: "lang-html",
	description: "HTML syntax highlighting",
	priority: 50,

	/*
	Expose the real content types handled by this plugin.

	This lets the engine resolve a winning tag override to a real language
	type, so tag overrides become full language modes.
	*/
	contentTypes: HTML_TYPES,
	types: HTML_TYPES,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			htmlLanguage: new Compartment()
		};
	},

	getTagOverrideType: function(context) {
		if(context.tagOverrideWinner === TAGS_CONFIG_TIDDLER) {
			return HTML_TYPES[0];
		}
		return null;
	},

	condition: function(context) {
		var effectiveType = context.effectiveType || context.tiddlerType || "";

		/*
		If a tag override is active, only the winning tag/plugin may activate.

		Do not use hasConfiguredTag() here. A tiddler may contain multiple
		configured language tags, but the engine has already selected the
		winner.
		*/
		if(context.hasTagOverride) {
			return context.tagOverrideWinner === TAGS_CONFIG_TIDDLER ||
				isHtmlType(effectiveType);
		}

		/*
		Normal mode:
		- dropdown/session override
		- codemirror-type field
		- actual type field
		- configured HTML language tag
		*/
		if(isHtmlType(effectiveType)) return true;
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;

		return false;
	},

	/*
	Runtime language switching uses this.

	This must return raw compartment content only.
	Do not return htmlLanguage.of(...) from here.
	*/
	getCompartmentContent: function(_context) {
		var extensions = [
			langHtml.html()
		];

		// Add HTML completions, registered by register.js at startup
		if(core.htmlCompletionExtension) {
			extensions.push(core.htmlCompletionExtension);
		}

		return extensions;
	},

	/*
	Initial editor construction uses this.

	This may wrap the raw content in the plugin's compartment.
	*/
	getExtensions: function(context) {
		var compartments = context.engine._compartments;

		if(compartments.htmlLanguage) {
			return [
				compartments.htmlLanguage.of(
					this.getCompartmentContent(context)
				)
			];
		}

		return this.getCompartmentContent(context);
	}
};
