/*\
title: $:/plugins/tiddlywiki/codemirror-6-lang-php/plugin.js
type: application/javascript
module-type: codemirror6-plugin

PHP language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langPhp, hasConfiguredTag;
try {
	langPhp = require("$:/plugins/tiddlywiki/codemirror-6-lang-php/lang-php.js");
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	return;
}

if(!langPhp || !hasConfiguredTag) return;

// Content types that activate this plugin
var PHP_TYPES = [
	"text/x-php",
	"application/x-php",
	"text/php"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-php/tags";

function isPhpType(type) {
	return PHP_TYPES.indexOf(type) !== -1;
}

exports.plugin = {
	name: "lang-php",
	description: "PHP syntax highlighting",
	priority: 50,

	/*
	Expose the real content types handled by this plugin.

	This lets the engine resolve a winning tag override to a real PHP
	language mode.
	*/
	contentTypes: PHP_TYPES,
	types: PHP_TYPES,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;

		return {
			phpLanguage: new Compartment()
		};
	},

	getTagOverrideType: function(context) {
		if(context.tagOverrideWinner === TAGS_CONFIG_TIDDLER) {
			return PHP_TYPES[0];
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
				isPhpType(effectiveType);
		}

		/*
		Normal mode:
		- dropdown/session override
		- codemirror-type field
		- actual type field
		- configured PHP language tag
		*/
		if(isPhpType(effectiveType)) return true;
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;

		return false;
	},

	/*
	Runtime language switching uses this.

	This must return raw compartment content only.
	Do not return phpLanguage.of(...) from here.
	*/
	getCompartmentContent: function(_context) {
		return [
			langPhp.php()
		];
	},

	/*
	Initial editor construction uses this.

	This may wrap the raw content in the plugin's compartment.
	*/
	getExtensions: function(context) {
		var compartments = context.engine._compartments;

		if(compartments.phpLanguage) {
			return [
				compartments.phpLanguage.of(
					this.getCompartmentContent(context)
				)
			];
		}

		return this.getCompartmentContent(context);
	}
};
