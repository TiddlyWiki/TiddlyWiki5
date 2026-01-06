/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-css/plugin.js
type: application/javascript
module-type: codemirror6-plugin

CSS language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var langCss = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-css/lang-css.js");

// Content types that activate this plugin
var CSS_TYPES = [
	"text/css"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-css/tags";
var hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;

exports.plugin = {
	name: "lang-css",
	description: "CSS syntax highlighting",
	priority: 50,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			cssLanguage: new Compartment()
		};
	},

	condition: function(context) {
		// Tag-based override takes precedence
		if (hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) {
			return true;
		}
		// Fall back to content type check
		var type = context.tiddlerType;
		return CSS_TYPES.indexOf(type) !== -1;
	},

	getCompartmentContent: function(context) {
		return [langCss.css()];
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		if (compartments.cssLanguage) {
			return [compartments.cssLanguage.of(this.getCompartmentContent(context))];
		}
		return this.getCompartmentContent(context);
	}
};
