/*\
title: $:/plugins/tiddlywiki/codemirror-6-lang-lezer/plugin.js
type: application/javascript
module-type: codemirror6-plugin

Lezer grammar language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langLezer, hasConfiguredTag;
try {
	langLezer = require("$:/plugins/tiddlywiki/codemirror-6-lang-lezer/lang-lezer.js");
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	return;
}

if(!langLezer || !hasConfiguredTag) return;

// Content types that activate this plugin
var LEZER_TYPES = [
	"text/x-lezer"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-lezer/tags";

function isLezerType(type) {
	return LEZER_TYPES.indexOf(type) !== -1;
}

exports.plugin = {
	name: "lang-lezer",
	description: "Lezer grammar syntax highlighting",
	priority: 50,

	/*
	Expose the real content types handled by this plugin.

	This lets the engine resolve a winning tag override to a real Lezer
	grammar language mode.
	*/
	contentTypes: LEZER_TYPES,
	types: LEZER_TYPES,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;

		return {
			lezerLanguage: new Compartment()
		};
	},

	getTagOverrideType: function(context) {
		if(context.tagOverrideWinner === TAGS_CONFIG_TIDDLER) {
			return LEZER_TYPES[0];
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
				isLezerType(effectiveType);
		}

		/*
		Normal mode:
		- dropdown/session override
		- codemirror-type field
		- actual type field
		- configured Lezer language tag
		*/
		if(isLezerType(effectiveType)) return true;
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;

		return false;
	},

	/*
	Runtime language switching uses this.

	This must return raw compartment content only.
	Do not return lezerLanguage.of(...) from here.
	*/
	getCompartmentContent: function(_context) {
		return [
			langLezer.lezer()
		];
	},

	/*
	Initial editor construction uses this.

	This may wrap the raw content in the plugin's compartment.
	*/
	getExtensions: function(context) {
		var compartments = context.engine._compartments;

		if(compartments.lezerLanguage) {
			return [
				compartments.lezerLanguage.of(
					this.getCompartmentContent(context)
				)
			];
		}

		return this.getCompartmentContent(context);
	}
};
