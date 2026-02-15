/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-markdown/plugin.js
type: application/javascript
module-type: codemirror6-plugin

Markdown language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langMarkdown, hasConfiguredTag;
try {
	langMarkdown = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-markdown/lang-markdown.js");
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

exports.plugin = {
	name: "lang-markdown",
	description: "Markdown syntax highlighting",
	priority: 50,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			markdownLanguage: new Compartment()
		};
	},

	condition: function(context) {
		// If any tag override is active, only the winning plugin activates
		if(context.hasTagOverride) {
			return context.tagOverrideWinner === TAGS_CONFIG_TIDDLER;
		}
		// Normal mode: tag match or type match
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;
		return MARKDOWN_TYPES.indexOf(context.tiddlerType) !== -1;
	},

	getCompartmentContent: function(_context) {
		return [langMarkdown.markdown()];
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		if(compartments.markdownLanguage) {
			return [compartments.markdownLanguage.of(this.getCompartmentContent(context))];
		}
		return this.getCompartmentContent(context);
	}
};
