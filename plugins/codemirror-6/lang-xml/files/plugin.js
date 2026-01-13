/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-xml/plugin.js
type: application/javascript
module-type: codemirror6-plugin

XML language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langXml, svgSchema, hasConfiguredTag;
try {
	langXml = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-xml/lang-xml.js");
	svgSchema = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-xml/svg-schema.js");
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	return;
}

if(!langXml || !svgSchema || !hasConfiguredTag) return;

// Content types that activate this plugin
var XML_TYPES = [
	"text/xml",
	"application/xml",
	"image/svg+xml"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-xml/tags";
var SVG_COMPLETIONS_CONFIG = "$:/config/codemirror-6/lang-xml/svg-completions";

function isSvgCompletionsEnabled() {
	var value = $tw.wiki.getTiddlerText(SVG_COMPLETIONS_CONFIG, "yes").trim().toLowerCase();
	return value === "yes" || value === "true";
}

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
		// If any tag override is active, only the winning plugin activates
		if(context.hasTagOverride) {
			return context.tagOverrideWinner === TAGS_CONFIG_TIDDLER;
		}
		// Normal mode: tag match or type match
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;
		return XML_TYPES.indexOf(context.tiddlerType) !== -1;
	},

	getCompartmentContent: function(context) {
		var type = context.tiddlerType;
		var isSvg = type === "image/svg+xml";

		// Use SVG schema for SVG files if enabled
		if(isSvg && isSvgCompletionsEnabled()) {
			return [langXml.xml({
				elements: svgSchema.svgElements,
				attributes: svgSchema.svgAttributes
			})];
		}

		// Plain XML without schema
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
