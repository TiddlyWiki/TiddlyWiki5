/*\
title: $:/plugins/BurningTreeC/tiddlywiki-codemirror/plugins/lang-markdown/plugin.js
type: application/javascript
module-type: codemirror6-plugin

Markdown language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var langMarkdown = require("$:/plugins/BurningTreeC/tiddlywiki-codemirror/plugins/lang-markdown/lang-markdown.js");

// Content types that activate this plugin
var MARKDOWN_TYPES = [
	"text/x-markdown",
	"text/markdown"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-markdown/tags";
var hasConfiguredTag = require("$:/plugins/BurningTreeC/tiddlywiki-codemirror/utils.js").hasConfiguredTag;

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
		// Tag-based override takes precedence
		if (hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) {
			return true;
		}
		// Fall back to content type check
		var type = context.tiddlerType;
		return MARKDOWN_TYPES.indexOf(type) !== -1;
	},

	getCompartmentContent: function(context) {
		return [langMarkdown.markdown()];
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		if (compartments.markdownLanguage) {
			return [compartments.markdownLanguage.of(this.getCompartmentContent(context))];
		}
		return this.getCompartmentContent(context);
	}
};
