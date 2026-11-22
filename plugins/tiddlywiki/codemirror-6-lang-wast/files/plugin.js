/*\
title: $:/plugins/tiddlywiki/codemirror-6-lang-wast/plugin.js
type: application/javascript
module-type: codemirror6-plugin

WebAssembly Text (WAT/WAST) language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var hasConfiguredTag;
try {
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	return;
}

if(!hasConfiguredTag) return;

/*
The language grammar is required on first use, not at module load.

Every codemirror6-plugin module is executed when the language registry runs, so a
top-level require here pulled this grammar -- and the CodeMirror dependency graph
behind it -- into the boot path of any wiki with this plugin installed, whether or
not a file of this type was ever opened. require() is memoised by TiddlyWiki, so the
work still happens exactly once, on the first editor that needs it.
*/
var langWast;
function _langWast() {
	if(langWast === undefined) {
		try {
			langWast = require("$:/plugins/tiddlywiki/codemirror-6-lang-wast/lang-wast.js") || null;
		} catch (e) {
			langWast = null;
		}
	}
	return langWast;
}

// Content types that activate this plugin
var WAST_TYPES = [
	"text/x-wast",
	"text/x-wat"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-wast/tags";

function isWastType(type) {
	return WAST_TYPES.indexOf(type) !== -1;
}

exports.plugin = {
	name: "lang-wast",
	description: "WebAssembly Text syntax highlighting",
	priority: 50,

	/*
	Expose the real content types handled by this plugin.

	This lets the engine resolve a winning tag override to a real WAT/WAST
	language mode.
	*/
	contentTypes: WAST_TYPES,
	types: WAST_TYPES,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;

		return {
			wastLanguage: new Compartment()
		};
	},

	getTagOverrideType: function(context) {
		if(context.tagOverrideWinner === TAGS_CONFIG_TIDDLER) {
			return WAST_TYPES[0];
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
				isWastType(effectiveType);
		}

		/*
		Normal mode:
		- dropdown/session override
		- codemirror-type field
		- actual type field
		- configured WAT/WAST language tag
		*/
		if(isWastType(effectiveType)) return true;
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;

		return false;
	},

	/*
	Runtime language switching uses this.

	This must return raw compartment content only.
	Do not return wastLanguage.of(...) from here.
	*/
	getCompartmentContent: function(_context) {
		return [
			_langWast().wast()
		];
	},

	/*
	Initial editor construction uses this.

	This may wrap the raw content in the plugin's compartment.
	*/
	getExtensions: function(context) {
		var compartments = context.engine._compartments;

		if(compartments.wastLanguage) {
			return [
				compartments.wastLanguage.of(
					this.getCompartmentContent(context)
				)
			];
		}

		return this.getCompartmentContent(context);
	}
};
