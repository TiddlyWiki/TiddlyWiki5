/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-html/plugin.js
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

exports.plugin = {
	name: "lang-html",
	description: "HTML syntax highlighting",
	priority: 50,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			htmlLanguage: new Compartment()
		};
	},

	condition: function(context) {
		// If any tag override is active, only the winning plugin activates
		if(context.hasTagOverride) {
			return context.tagOverrideWinner === TAGS_CONFIG_TIDDLER;
		}
		// Normal mode: tag match or type match
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;
		return HTML_TYPES.indexOf(context.tiddlerType) !== -1;
	},

	getCompartmentContent: function(_context) {
		var extensions = [langHtml.html()];
		// Add HTML completions (registered by register.js at startup)
		if(core.htmlCompletionExtension) {
			extensions.push(core.htmlCompletionExtension);
		}
		return extensions;
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		if(compartments.htmlLanguage) {
			return [compartments.htmlLanguage.of(this.getCompartmentContent(context))];
		}
		return this.getCompartmentContent(context);
	}
};
