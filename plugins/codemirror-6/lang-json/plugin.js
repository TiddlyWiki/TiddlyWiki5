/*\
title: $:/plugins/BurningTreeC/tiddlywiki-codemirror/plugins/lang-json/plugin.js
type: application/javascript
module-type: codemirror6-plugin

JSON language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var langJson = require("$:/plugins/BurningTreeC/tiddlywiki-codemirror/plugins/lang-json/lang-json.js");

// Try to load lint library (may not be available if lint plugin not installed)
var lintLib = null;
try {
	lintLib = require("$:/plugins/BurningTreeC/tiddlywiki-codemirror/plugins/lint/codemirror-lint.js");
} catch (e) {
	// Lint library not available
}

// Content types that activate this plugin
var JSON_TYPES = [
	"application/json",
	"text/json"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-json/tags";
var hasConfiguredTag = require("$:/plugins/BurningTreeC/tiddlywiki-codemirror/utils.js").hasConfiguredTag;

exports.plugin = {
	name: "lang-json",
	description: "JSON syntax highlighting and linting",
	priority: 50,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			jsonLanguage: new Compartment()
		};
	},

	condition: function(context) {
		// Tag-based override takes precedence
		if (hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) {
			return true;
		}
		// Fall back to content type check
		var type = context.tiddlerType;
		return JSON_TYPES.indexOf(type) !== -1;
	},

	getCompartmentContent: function(context) {
		var extensions = [langJson.json()];

		// Add JSON linting if lint library is available
		if (lintLib && lintLib.linter && langJson.jsonParseLinter) {
			extensions.push(lintLib.linter(langJson.jsonParseLinter()));
			if (lintLib.lintGutter) {
				extensions.push(lintLib.lintGutter());
			}
		}

		return extensions;
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		if (compartments.jsonLanguage) {
			return [compartments.jsonLanguage.of(this.getCompartmentContent(context))];
		}
		return this.getCompartmentContent(context);
	}
};
