/*\
title: $:/plugins/BurningTreeC/tiddlywiki-codemirror/plugins/lang-javascript/plugin.js
type: application/javascript
module-type: codemirror6-plugin

JavaScript/TypeScript language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var langJs = require("$:/plugins/BurningTreeC/tiddlywiki-codemirror/plugins/lang-javascript/lang-javascript.js");

// Content types that activate this plugin
var JS_TYPES = [
	"application/javascript",
	"text/javascript",
	"application/x-javascript"
];

var TS_TYPES = [
	"application/typescript",
	"application/x-typescript"
];

var JSX_TYPES = [
	"text/jsx",
	"application/jsx"
];

var TSX_TYPES = [
	"text/tsx",
	"application/tsx"
];

var ALL_TYPES = JS_TYPES.concat(TS_TYPES, JSX_TYPES, TSX_TYPES);

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-javascript/tags";
var hasConfiguredTag = require("$:/plugins/BurningTreeC/tiddlywiki-codemirror/utils.js").hasConfiguredTag;

exports.plugin = {
	name: "lang-javascript",
	description: "JavaScript/TypeScript syntax highlighting",
	priority: 50,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			javascriptLanguage: new Compartment()
		};
	},

	condition: function(context) {
		// Tag-based override takes precedence
		if (hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) {
			return true;
		}
		// Fall back to content type check
		var type = context.tiddlerType;
		return ALL_TYPES.indexOf(type) !== -1;
	},

	getCompartmentContent: function(context) {
		var type = context.tiddlerType;
		var isTypescript = TS_TYPES.indexOf(type) !== -1 || TSX_TYPES.indexOf(type) !== -1;
		var isJsx = JSX_TYPES.indexOf(type) !== -1 || TSX_TYPES.indexOf(type) !== -1;
		return [langJs.javascript({ typescript: isTypescript, jsx: isJsx })];
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		if (compartments.javascriptLanguage) {
			return [compartments.javascriptLanguage.of(this.getCompartmentContent(context))];
		}
		return this.getCompartmentContent(context);
	}
};
