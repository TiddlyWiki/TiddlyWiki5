/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-sass/plugin.js
type: application/javascript
module-type: codemirror6-plugin

Sass/SCSS language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langSass, hasConfiguredTag;
try {
	langSass = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-sass/lang-sass.js");
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	return;
}

if(!langSass || !hasConfiguredTag) return;

// Content types that activate this plugin
var SASS_TYPES = [
	"text/x-sass",
	"text/x-scss"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-sass/tags";

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
		// If any tag override is active, only the winning plugin activates
		if(context.hasTagOverride) {
			return context.tagOverrideWinner === TAGS_CONFIG_TIDDLER;
		}
		// Normal mode: tag match or type match
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;
		return SASS_TYPES.indexOf(context.tiddlerType) !== -1;
	},

	getCompartmentContent: function(_context) {
		// Default to SCSS (more common)
		return [langSass.sass()];
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		if(compartments.sassLanguage) {
			return [compartments.sassLanguage.of(this.getCompartmentContent(context))];
		}
		return this.getCompartmentContent(context);
	}
};
