/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-wast/plugin.js
type: application/javascript
module-type: codemirror6-plugin

WebAssembly Text (WAT/WAST) language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langWast, hasConfiguredTag;
try {
	langWast = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-wast/lang-wast.js");
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	return;
}

if(!langWast || !hasConfiguredTag) return;

// Content types that activate this plugin
var WAST_TYPES = [
	"text/x-wast",
	"text/x-wat"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-wast/tags";

exports.plugin = {
	name: "lang-wast",
	description: "WebAssembly Text syntax highlighting",
	priority: 50,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			wastLanguage: new Compartment()
		};
	},

	condition: function(context) {
		// If any tag override is active, only the winning plugin activates
		if(context.hasTagOverride) {
			return context.tagOverrideWinner === TAGS_CONFIG_TIDDLER;
		}
		// Normal mode: tag match or type match
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;
		return WAST_TYPES.indexOf(context.tiddlerType) !== -1;
	},

	getCompartmentContent: function(_context) {
		return [langWast.wast()];
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		if(compartments.wastLanguage) {
			return [compartments.wastLanguage.of(this.getCompartmentContent(context))];
		}
		return this.getCompartmentContent(context);
	}
};
