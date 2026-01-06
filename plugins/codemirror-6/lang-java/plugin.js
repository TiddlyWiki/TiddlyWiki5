/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-java/plugin.js
type: application/javascript
module-type: codemirror6-plugin

Java language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var langJava = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-java/lang-java.js");

// Content types that activate this plugin
var JAVA_TYPES = [
	"text/x-java",
	"text/x-java-source"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-java/tags";
var hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;

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
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) {
			return true;
		}
		var type = context.tiddlerType;
		return JAVA_TYPES.indexOf(type) !== -1;
	},

	getCompartmentContent: function(context) {
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
