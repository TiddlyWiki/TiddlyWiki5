/*\
title: $:/plugins/tiddlywiki/codemirror-6-lang-java/plugin.js
type: application/javascript
module-type: codemirror6-plugin

Java language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langJava, hasConfiguredTag;
try {
	langJava = require("$:/plugins/tiddlywiki/codemirror-6-lang-java/lang-java.js");
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

function isJavaType(type) {
	return JAVA_TYPES.indexOf(type) !== -1;
}

exports.plugin = {
	name: "lang-java",
	description: "Java syntax highlighting",
	priority: 50,

	/*
	Expose the real content types handled by this plugin.

	This lets the engine resolve a winning tag override to a real Java
	language mode.
	*/
	contentTypes: JAVA_TYPES,
	types: JAVA_TYPES,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;

		return {
			javaLanguage: new Compartment()
		};
	},

	getTagOverrideType: function(context) {
		if(context.tagOverrideWinner === TAGS_CONFIG_TIDDLER) {
			return JAVA_TYPES[0];
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
				isJavaType(effectiveType);
		}

		/*
		Normal mode:
		- dropdown/session override
		- codemirror-type field
		- actual type field
		- configured Java language tag
		*/
		if(isJavaType(effectiveType)) return true;
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;

		return false;
	},

	/*
	Runtime language switching uses this.

	This must return raw compartment content only.
	Do not return javaLanguage.of(...) from here.
	*/
	getCompartmentContent: function(_context) {
		return [
			langJava.java()
		];
	},

	/*
	Initial editor construction uses this.

	This may wrap the raw content in the plugin's compartment.
	*/
	getExtensions: function(context) {
		var compartments = context.engine._compartments;

		if(compartments.javaLanguage) {
			return [
				compartments.javaLanguage.of(
					this.getCompartmentContent(context)
				)
			];
		}

		return this.getCompartmentContent(context);
	}
};
