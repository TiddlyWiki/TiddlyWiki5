/*\
title: $:/plugins/tiddlywiki/codemirror-6/lang-markdown/plugin.js
type: application/javascript
module-type: codemirror6-plugin

Markdown language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langMarkdown, hasConfiguredTag;
try {
	langMarkdown = require("$:/plugins/tiddlywiki/codemirror-6/lang-markdown/lang-markdown.js");
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	return;
}

if(!langMarkdown || !hasConfiguredTag) return;

// Content types that activate this plugin
var MARKDOWN_TYPES = [
	"text/x-markdown",
	"text/markdown"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-markdown/tags";

function isMarkdownType(type) {
	return MARKDOWN_TYPES.indexOf(type) !== -1;
}

exports.plugin = {
	name: "lang-markdown",
	description: "Markdown syntax highlighting",
	priority: 50,

	/*
	Expose the real content types handled by this plugin.

	This lets the engine resolve a winning tag override to a real language
	type, so tag overrides behave like full language modes.
	*/
	contentTypes: MARKDOWN_TYPES,
	types: MARKDOWN_TYPES,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;

		return {
			markdownLanguage: new Compartment()
		};
	},

	getTagOverrideType: function(context) {
		if(context.tagOverrideWinner === TAGS_CONFIG_TIDDLER) {
			return MARKDOWN_TYPES[0];
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
				isMarkdownType(effectiveType);
		}

		/*
		Normal mode:
		- dropdown/session override
		- codemirror-type field
		- actual type field
		- configured Markdown language tag
		*/
		if(isMarkdownType(effectiveType)) return true;
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;

		return false;
	},

	/*
	Runtime language switching uses this.

	This must return raw compartment content only.
	Do not return markdownLanguage.of(...) from here.
	*/
	getCompartmentContent: function(_context) {
		return [
			langMarkdown.markdown()
		];
	},

	/*
	Initial editor construction uses this.

	This may wrap the raw content in the plugin's compartment.
	*/
	getExtensions: function(context) {
		var compartments = context.engine._compartments;

		if(compartments.markdownLanguage) {
			return [
				compartments.markdownLanguage.of(
					this.getCompartmentContent(context)
				)
			];
		}

		return this.getCompartmentContent(context);
	}
};
