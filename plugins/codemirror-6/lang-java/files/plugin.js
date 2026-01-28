/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-java/plugin.js
type: application/javascript
module-type: codemirror6-plugin

Java language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langJava, hasConfiguredTag;
try {
	langJava = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-java/lang-java.js");
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	return;
}

if(!langJava || !hasConfiguredTag) return;

// Content types that activate this plugin
var JAVA_TYPES = [
	"text/x-java",
	"text/x-java-source"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-java/tags";

exports.plugin = {
	name: "lang-java",
	description: "Java syntax highlighting",
	priority: 50,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			javaLanguage: new Compartment()
		};
	},

	condition: function(context) {
		// If any tag override is active, only the winning plugin activates
		if(context.hasTagOverride) {
			return context.tagOverrideWinner === TAGS_CONFIG_TIDDLER;
		}
		// Normal mode: tag match or type match
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;
		return JAVA_TYPES.indexOf(context.tiddlerType) !== -1;
	},

	getCompartmentContent: function(_context) {
		return [langJava.java()];
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		if(compartments.javaLanguage) {
			return [compartments.javaLanguage.of(this.getCompartmentContent(context))];
		}
		return this.getCompartmentContent(context);
	}
};
