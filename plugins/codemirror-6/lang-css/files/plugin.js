/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-css/plugin.js
type: application/javascript
module-type: codemirror6-plugin

CSS language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langCss, core, hasConfiguredTag;
try {
	langCss = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-css/lang-css.js");
	core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	// Dependencies not available - plugin will not load
	return;
}

if(!langCss || !core || !hasConfiguredTag) return;

// Content types that activate this plugin
var CSS_TYPES = [
	"text/css"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-css/tags";

exports.plugin = {
	name: "lang-css",
	description: "CSS syntax highlighting",
	priority: 50,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			cssLanguage: new Compartment()
		};
	},

	condition: function(context) {
		// If any tag override is active, only the winning plugin activates
		if(context.hasTagOverride) {
			return context.tagOverrideWinner === TAGS_CONFIG_TIDDLER;
		}
		// Normal mode: tag match or type match
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;
		return CSS_TYPES.indexOf(context.tiddlerType) !== -1;
	},

	getCompartmentContent: function(_context) {
		var extensions = [langCss.css()];
		// Add enhanced CSS completions with page class support
		// (registered by register.js at startup)
		if(core.cssCompletionExtension) {
			extensions.push(core.cssCompletionExtension);
		}
		return extensions;
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		if(compartments.cssLanguage) {
			return [compartments.cssLanguage.of(this.getCompartmentContent(context))];
		}
		return this.getCompartmentContent(context);
	}
};
