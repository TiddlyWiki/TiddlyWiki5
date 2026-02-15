/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-cpp/plugin.js
type: application/javascript
module-type: codemirror6-plugin

C/C++ language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langCpp, hasConfiguredTag;
try {
	langCpp = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-cpp/lang-cpp.js");
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	return;
}

if(!langCpp || !hasConfiguredTag) return;

// Content types that activate this plugin
var CPP_TYPES = [
	"text/x-c",
	"text/x-c++",
	"text/x-csrc",
	"text/x-c++src",
	"text/x-chdr",
	"text/x-c++hdr"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-cpp/tags";

exports.plugin = {
	name: "lang-cpp",
	description: "C/C++ syntax highlighting",
	priority: 50,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			cppLanguage: new Compartment()
		};
	},

	condition: function(context) {
		// If any tag override is active, only the winning plugin activates
		if(context.hasTagOverride) {
			return context.tagOverrideWinner === TAGS_CONFIG_TIDDLER;
		}
		// Normal mode: tag match or type match
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;
		return CPP_TYPES.indexOf(context.tiddlerType) !== -1;
	},

	getCompartmentContent: function(_context) {
		return [langCpp.cpp()];
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		if(compartments.cppLanguage) {
			return [compartments.cppLanguage.of(this.getCompartmentContent(context))];
		}
		return this.getCompartmentContent(context);
	}
};
