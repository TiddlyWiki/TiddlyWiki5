/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-python/plugin.js
type: application/javascript
module-type: codemirror6-plugin

Python language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

var langPython = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-python/lang-python.js");

// Content types that activate this plugin
var PYTHON_TYPES = [
	"text/x-python",
	"application/x-python"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-python/tags";
var hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;

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
		// Tag-based override takes precedence
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) {
			return true;
		}
		// Fall back to content type check
		var type = context.tiddlerType;
		return PYTHON_TYPES.indexOf(type) !== -1;
	},

	getCompartmentContent: function(_context) {
		return [langPython.python()];
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		if(compartments.pythonLanguage) {
			return [compartments.pythonLanguage.of(this.getCompartmentContent(context))];
		}
		return this.getCompartmentContent(context);
	}
};
