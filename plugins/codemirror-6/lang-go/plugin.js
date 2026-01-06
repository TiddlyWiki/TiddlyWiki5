/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-go/plugin.js
type: application/javascript
module-type: codemirror6-plugin

Go language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var langGo = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-go/lang-go.js");

// Content types that activate this plugin
var GO_TYPES = [
	"text/x-go",
	"application/x-go"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-go/tags";
var hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;

exports.plugin = {
	name: "lang-go",
	description: "Go syntax highlighting",
	priority: 50,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			goLanguage: new Compartment()
		};
	},

	condition: function(context) {
		if (hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) {
			return true;
		}
		var type = context.tiddlerType;
		return GO_TYPES.indexOf(type) !== -1;
	},

	getCompartmentContent: function(context) {
		return [langGo.go()];
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		if (compartments.goLanguage) {
			return [compartments.goLanguage.of(this.getCompartmentContent(context))];
		}
		return this.getCompartmentContent(context);
	}
};
