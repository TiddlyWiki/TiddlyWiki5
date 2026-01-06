/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-lezer/plugin.js
type: application/javascript
module-type: codemirror6-plugin

Lezer grammar language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var langLezer = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-lezer/lang-lezer.js");

// Content types that activate this plugin
var LEZER_TYPES = [
	"text/x-lezer"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-lezer/tags";
var hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;

exports.plugin = {
	name: "lang-lezer",
	description: "Lezer grammar syntax highlighting",
	priority: 50,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			lezerLanguage: new Compartment()
		};
	},

	condition: function(context) {
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) {
			return true;
		}
		var type = context.tiddlerType;
		return LEZER_TYPES.indexOf(type) !== -1;
	},

	getCompartmentContent: function(context) {
		return [langLezer.lezer()];
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		if(compartments.lezerLanguage) {
			return [compartments.lezerLanguage.of(this.getCompartmentContent(context))];
		}
		return this.getCompartmentContent(context);
	}
};
