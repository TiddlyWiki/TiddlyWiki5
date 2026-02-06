/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-yaml/plugin.js
type: application/javascript
module-type: codemirror6-plugin

YAML language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langYaml, hasConfiguredTag;
try {
	langYaml = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-yaml/lang-yaml.js");
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	return;
}

if(!langYaml || !hasConfiguredTag) return;

// Content types that activate this plugin
var YAML_TYPES = [
	"text/x-yaml",
	"text/yaml",
	"application/x-yaml",
	"application/yaml"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-yaml/tags";

exports.plugin = {
	name: "lang-yaml",
	description: "YAML syntax highlighting",
	priority: 50,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			yamlLanguage: new Compartment()
		};
	},

	condition: function(context) {
		// If any tag override is active, only the winning plugin activates
		if(context.hasTagOverride) {
			return context.tagOverrideWinner === TAGS_CONFIG_TIDDLER;
		}
		// Normal mode: tag match or type match
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;
		return YAML_TYPES.indexOf(context.tiddlerType) !== -1;
	},

	getCompartmentContent: function(_context) {
		return [langYaml.yaml()];
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		if(compartments.yamlLanguage) {
			return [compartments.yamlLanguage.of(this.getCompartmentContent(context))];
		}
		return this.getCompartmentContent(context);
	}
};
