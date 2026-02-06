/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-python/plugin.js
type: application/javascript
module-type: codemirror6-plugin

Python language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langPython, core, hasConfiguredTag;
try {
	langPython = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-python/lang-python.js");
	core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	return;
}

if(!langPython || !core || !hasConfiguredTag) return;

// Content types that activate this plugin
var PYTHON_TYPES = [
	"text/x-python",
	"application/x-python"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-python/tags";

exports.plugin = {
	name: "lang-python",
	description: "Python syntax highlighting",
	priority: 50,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			pythonLanguage: new Compartment()
		};
	},

	condition: function(context) {
		// If any tag override is active, only the winning plugin activates
		if(context.hasTagOverride) {
			return context.tagOverrideWinner === TAGS_CONFIG_TIDDLER;
		}
		// Normal mode: tag match or type match
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;
		return PYTHON_TYPES.indexOf(context.tiddlerType) !== -1;
	},

	getCompartmentContent: function(_context) {
		var extensions = [langPython.python()];
		// Add Python completions (registered by register.js at startup)
		if(core.pythonCompletionExtension) {
			extensions.push(core.pythonCompletionExtension);
		}
		return extensions;
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		if(compartments.pythonLanguage) {
			return [compartments.pythonLanguage.of(this.getCompartmentContent(context))];
		}
		return this.getCompartmentContent(context);
	}
};
