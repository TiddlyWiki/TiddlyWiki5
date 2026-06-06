/*\
title: $:/plugins/tiddlywiki/codemirror-6-lang-cpp/plugin.js
type: application/javascript
module-type: codemirror6-plugin

C/C++ language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langCpp, hasConfiguredTag;
try {
	langCpp = require("$:/plugins/tiddlywiki/codemirror-6-lang-cpp/lang-cpp.js");
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

function isCppType(type) {
	return CPP_TYPES.indexOf(type) !== -1;
}

exports.plugin = {
	name: "lang-cpp",
	description: "C/C++ syntax highlighting",
	priority: 50,

	/*
	Expose the real content types handled by this plugin.

	This lets the engine resolve a winning tag override to a real C/C++
	language mode.
	*/
	contentTypes: CPP_TYPES,
	types: CPP_TYPES,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;

		return {
			cppLanguage: new Compartment()
		};
	},

	getTagOverrideType: function(context) {
		if(context.tagOverrideWinner === TAGS_CONFIG_TIDDLER) {
			return CPP_TYPES[0];
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
				isCppType(effectiveType);
		}

		/*
		Normal mode:
		- dropdown/session override
		- codemirror-type field
		- actual type field
		- configured C/C++ language tag
		*/
		if(isCppType(effectiveType)) return true;
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;

		return false;
	},

	/*
	Runtime language switching uses this.

	This must return raw compartment content only.
	Do not return cppLanguage.of(...) from here.
	*/
	getCompartmentContent: function(_context) {
		return [
			langCpp.cpp()
		];
	},

	/*
	Initial editor construction uses this.

	This may wrap the raw content in the plugin's compartment.
	*/
	getExtensions: function(context) {
		var compartments = context.engine._compartments;

		if(compartments.cppLanguage) {
			return [
				compartments.cppLanguage.of(
					this.getCompartmentContent(context)
				)
			];
		}

		return this.getCompartmentContent(context);
	}
};
