/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-go/plugin.js
type: application/javascript
module-type: codemirror6-plugin

Go language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langGo, core, hasConfiguredTag;
try {
	langGo = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-go/lang-go.js");
	core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	return;
}

if(!langGo || !core || !hasConfiguredTag) return;

// Content types that activate this plugin
var GO_TYPES = [
	"text/x-go",
	"application/x-go"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-go/tags";

exports.plugin = {
	name: "lang-go",
	description: "Go syntax highlighting",
	priority: 50,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			goLanguage: new Compartment()
		};
	},

	condition: function(context) {
		// If any tag override is active, only the winning plugin activates
		if(context.hasTagOverride) {
			return context.tagOverrideWinner === TAGS_CONFIG_TIDDLER;
		}
		// Normal mode: tag match or type match
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;
		return GO_TYPES.indexOf(context.tiddlerType) !== -1;
	},

	getCompartmentContent: function(_context) {
		var extensions = [langGo.go()];
		// Add Go completions (registered by register.js at startup)
		if(core.goCompletionExtension) {
			extensions.push(core.goCompletionExtension);
		}
		return extensions;
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		if(compartments.goLanguage) {
			return [compartments.goLanguage.of(this.getCompartmentContent(context))];
		}
		return this.getCompartmentContent(context);
	}
};
