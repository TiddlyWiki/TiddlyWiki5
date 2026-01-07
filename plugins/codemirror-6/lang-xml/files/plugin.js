/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-xml/plugin.js
type: application/javascript
module-type: codemirror6-plugin

XML language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

var langXml = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-xml/lang-xml.js");

// Content types that activate this plugin
var XML_TYPES = [
	"text/xml",
	"application/xml",
	"image/svg+xml"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-xml/tags";
var hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;

exports.plugin = {
	name: "lang-xml",
	description: "XML syntax highlighting",
	priority: 50,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			xmlLanguage: new Compartment()
		};
	},

	condition: function(context) {
		// Tag-based override takes precedence
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) {
			return true;
		}
		// Fall back to content type check
		var type = context.tiddlerType;
		return XML_TYPES.indexOf(type) !== -1;
	},

	getCompartmentContent: function(_context) {
		return [langXml.xml()];
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		if(compartments.xmlLanguage) {
			return [compartments.xmlLanguage.of(this.getCompartmentContent(context))];
		}
		return this.getCompartmentContent(context);
	}
};
