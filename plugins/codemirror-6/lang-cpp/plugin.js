/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-cpp/plugin.js
type: application/javascript
module-type: codemirror6-plugin

C/C++ language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var langCpp = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-cpp/lang-cpp.js");

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
var hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;

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
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) {
			return true;
		}
		var type = context.tiddlerType;
		return CPP_TYPES.indexOf(type) !== -1;
	},

	getCompartmentContent: function(context) {
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
