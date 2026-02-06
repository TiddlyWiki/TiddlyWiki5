/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-rust/plugin.js
type: application/javascript
module-type: codemirror6-plugin

Rust language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langRust, hasConfiguredTag;
try {
	langRust = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-rust/lang-rust.js");
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

exports.plugin = {
	name: "lang-rust",
	description: "Rust syntax highlighting",
	priority: 50,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			rustLanguage: new Compartment()
		};
	},

	condition: function(context) {
		// If any tag override is active, only the winning plugin activates
		if(context.hasTagOverride) {
			return context.tagOverrideWinner === TAGS_CONFIG_TIDDLER;
		}
		// Normal mode: tag match or type match
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;
		return RUST_TYPES.indexOf(context.tiddlerType) !== -1;
	},

	getCompartmentContent: function(_context) {
		return [langRust.rust()];
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		if(compartments.rustLanguage) {
			return [compartments.rustLanguage.of(this.getCompartmentContent(context))];
		}
		return this.getCompartmentContent(context);
	}
};
