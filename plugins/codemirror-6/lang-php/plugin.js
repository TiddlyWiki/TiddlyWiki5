/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-php/plugin.js
type: application/javascript
module-type: codemirror6-plugin

PHP language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var langPhp = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-php/lang-php.js");

// Content types that activate this plugin
var PHP_TYPES = [
	"text/x-php",
	"application/x-php",
	"text/php"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-php/tags";
var hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;

exports.plugin = {
	name: "lang-php",
	description: "PHP syntax highlighting",
	priority: 50,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			phpLanguage: new Compartment()
		};
	},

	condition: function(context) {
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) {
			return true;
		}
		var type = context.tiddlerType;
		return PHP_TYPES.indexOf(type) !== -1;
	},

	getCompartmentContent: function(context) {
		return [langPhp.php()];
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		if(compartments.phpLanguage) {
			return [compartments.phpLanguage.of(this.getCompartmentContent(context))];
		}
		return this.getCompartmentContent(context);
	}
};
