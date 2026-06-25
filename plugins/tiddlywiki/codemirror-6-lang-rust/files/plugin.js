/*\
title: $:/plugins/tiddlywiki/codemirror-6-lang-rust/plugin.js
type: application/javascript
module-type: codemirror6-plugin

Rust language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langRust, hasConfiguredTag;
try {
	langRust = require("$:/plugins/tiddlywiki/codemirror-6-lang-rust/lang-rust.js");
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	return;
}

if(!langRust || !hasConfiguredTag) return;

// Content types that activate this plugin
var RUST_TYPES = [
	"text/x-rust",
	"text/rust"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-rust/tags";

function isRustType(type) {
	return RUST_TYPES.indexOf(type) !== -1;
}

exports.plugin = {
	name: "lang-rust",
	description: "Rust syntax highlighting",
	priority: 50,

	/*
	Expose the real content types handled by this plugin.

	This lets the engine resolve a winning tag override to a real Rust
	language mode.
	*/
	contentTypes: RUST_TYPES,
	types: RUST_TYPES,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;

		return {
			rustLanguage: new Compartment()
		};
	},

	getTagOverrideType: function(context) {
		if(context.tagOverrideWinner === TAGS_CONFIG_TIDDLER) {
			return RUST_TYPES[0];
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
				isRustType(effectiveType);
		}

		/*
		Normal mode:
		- dropdown/session override
		- codemirror-type field
		- actual type field
		- configured Rust language tag
		*/
		if(isRustType(effectiveType)) return true;
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;

		return false;
	},

	/*
	Runtime language switching uses this.

	This must return raw compartment content only.
	Do not return rustLanguage.of(...) from here.
	*/
	getCompartmentContent: function(_context) {
		return [
			langRust.rust()
		];
	},

	/*
	Initial editor construction uses this.

	This may wrap the raw content in the plugin's compartment.
	*/
	getExtensions: function(context) {
		var compartments = context.engine._compartments;

		if(compartments.rustLanguage) {
			return [
				compartments.rustLanguage.of(
					this.getCompartmentContent(context)
				)
			];
		}

		return this.getCompartmentContent(context);
	}
};
