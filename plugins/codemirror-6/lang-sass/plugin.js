/*\
title: $:/plugins/BurningTreeC/tiddlywiki-codemirror/plugins/lang-sass/plugin.js
type: application/javascript
module-type: codemirror6-plugin

Sass/SCSS language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var langSass = require("$:/plugins/BurningTreeC/tiddlywiki-codemirror/plugins/lang-sass/lang-sass.js");

// Content types that activate this plugin
var SASS_TYPES = [
	"text/x-sass",
	"text/x-scss"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-sass/tags";
var hasConfiguredTag = require("$:/plugins/BurningTreeC/tiddlywiki-codemirror/utils.js").hasConfiguredTag;

exports.plugin = {
	name: "lang-sass",
	description: "Sass/SCSS syntax highlighting",
	priority: 50,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			sassLanguage: new Compartment()
		};
	},

	condition: function(context) {
		if (hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) {
			return true;
		}
		var type = context.tiddlerType;
		return SASS_TYPES.indexOf(type) !== -1;
	},

	getCompartmentContent: function(context) {
		// Default to SCSS (more common)
		return [langSass.sass()];
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		if (compartments.sassLanguage) {
			return [compartments.sassLanguage.of(this.getCompartmentContent(context))];
		}
		return this.getCompartmentContent(context);
	}
};
