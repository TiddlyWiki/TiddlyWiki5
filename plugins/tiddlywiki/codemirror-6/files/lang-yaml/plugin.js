/*\
title: $:/plugins/tiddlywiki/codemirror-6/lang-yaml/plugin.js
type: application/javascript
module-type: codemirror6-plugin

YAML language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langYaml, hasConfiguredTag;
try {
	langYaml = require("$:/plugins/tiddlywiki/codemirror-6/lang-yaml/lang-yaml.js");
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

function isYamlType(type) {
	return YAML_TYPES.indexOf(type) !== -1;
}

exports.plugin = {
	name: "lang-yaml",
	description: "YAML syntax highlighting",
	priority: 50,

	/*
	Expose the real content types handled by this plugin.

	This lets the engine resolve a winning tag override to a real YAML
	language mode.
	*/
	contentTypes: YAML_TYPES,
	types: YAML_TYPES,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;

		return {
			yamlLanguage: new Compartment()
		};
	},

	getTagOverrideType: function(context) {
		if(context.tagOverrideWinner === TAGS_CONFIG_TIDDLER) {
			return YAML_TYPES[0];
		}

		return null;
	},

	condition: function(context) {
		var effectiveType = context.effectiveType || context.tiddlerType || "";

		/*
		If a tag override is active, only the winning tag/plugin may activate.

		Do not use hasConfiguredTag() here. A tiddler may contain multiple
		configured language tags, but the engine has already selected the
		winner.
		*/
		if(context.hasTagOverride) {
			return context.tagOverrideWinner === TAGS_CONFIG_TIDDLER ||
				isYamlType(effectiveType);
		}

		/*
		Normal mode:
		- dropdown/session override
		- codemirror-type field
		- actual type field
		- configured YAML language tag
		*/
		if(isYamlType(effectiveType)) return true;
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;

		return false;
	},

	/*
	Runtime language switching uses this.

	This must return raw compartment content only.
	Do not return yamlLanguage.of(...) from here.
	*/
	getCompartmentContent: function(_context) {
		return [
			langYaml.yaml()
		];
	},

	/*
	Initial editor construction uses this.

	This may wrap the raw content in the plugin's compartment.
	*/
	getExtensions: function(context) {
		var compartments = context.engine._compartments;

		if(compartments.yamlLanguage) {
			return [
				compartments.yamlLanguage.of(
					this.getCompartmentContent(context)
				)
			];
		}

		return this.getCompartmentContent(context);
	}
};
