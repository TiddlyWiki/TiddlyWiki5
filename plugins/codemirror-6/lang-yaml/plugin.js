/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-yaml/plugin.js
type: application/javascript
module-type: codemirror6-plugin

YAML language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var langYaml = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-yaml/lang-yaml.js");

// Content types that activate this plugin
var YAML_TYPES = [
	"text/x-yaml",
	"text/yaml",
	"application/x-yaml",
	"application/yaml"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-yaml/tags";
var hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;

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
		// Tag-based override takes precedence
		if (hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) {
			return true;
		}
		// Fall back to content type check
		var type = context.tiddlerType;
		return YAML_TYPES.indexOf(type) !== -1;
	},

	getCompartmentContent: function(context) {
		return [langYaml.yaml()];
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		if (compartments.yamlLanguage) {
			return [compartments.yamlLanguage.of(this.getCompartmentContent(context))];
		}
		return this.getCompartmentContent(context);
	}
};
