/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-wast/plugin.js
type: application/javascript
module-type: codemirror6-plugin

WebAssembly Text (WAT/WAST) language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

var langWast = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-wast/lang-wast.js");

// Content types that activate this plugin
var WAST_TYPES = [
	"text/x-wast",
	"text/x-wat"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-wast/tags";
var hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;

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
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) {
			return true;
		}
		var type = context.tiddlerType;
		return WAST_TYPES.indexOf(type) !== -1;
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
