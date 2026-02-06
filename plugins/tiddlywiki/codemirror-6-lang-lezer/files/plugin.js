/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-lezer/plugin.js
type: application/javascript
module-type: codemirror6-plugin

Lezer grammar language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langLezer, hasConfiguredTag;
try {
	langLezer = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-lezer/lang-lezer.js");
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	return;
}

if(!langLezer || !hasConfiguredTag) return;

// Content types that activate this plugin
var LEZER_TYPES = [
	"text/x-lezer"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-lezer/tags";

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
		// If any tag override is active, only the winning plugin activates
		if(context.hasTagOverride) {
			return context.tagOverrideWinner === TAGS_CONFIG_TIDDLER;
		}
		// Normal mode: tag match or type match
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;
		return LEZER_TYPES.indexOf(context.tiddlerType) !== -1;
	},

	getCompartmentContent: function(_context) {
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
