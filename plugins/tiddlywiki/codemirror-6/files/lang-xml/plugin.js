/*\
title: $:/plugins/tiddlywiki/codemirror-6/lang-xml/plugin.js
type: application/javascript
module-type: codemirror6-plugin

XML language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var hasConfiguredTag;
try {
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	return;
}

if(!hasConfiguredTag) return;

/*
The language grammar is required on first use, not at module load.

Every codemirror6-plugin module gets executed when the language registry runs, so a
top-level require here pulled this grammar -- and the CodeMirror dependency graph
behind it -- in as soon as anything touched the editor, including for wikis whose
user never opens a file of this type. require() is memoised by TiddlyWiki, so the
work still happens exactly once, on the first editor that actually needs it.
*/
var langXml;
function getLangXml() {
	if(langXml === undefined) {
		try {
			langXml = require("$:/plugins/tiddlywiki/codemirror-6/lang-xml/lang-xml.js") || null;
		} catch (e) {
			langXml = null;
		}
	}
	return langXml;
}

var svgSchema;
function getSvgSchema() {
	if(svgSchema === undefined) {
		try {
			svgSchema = require("$:/plugins/tiddlywiki/codemirror-6/lang-xml/svg-schema.js") || null;
		} catch (e) {
			svgSchema = null;
		}
	}
	return svgSchema;
}

// Content types that activate this plugin
var XML_TYPES = [
	"text/xml",
	"application/xml",
	"image/svg+xml"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-xml/tags";
var SVG_COMPLETIONS_CONFIG = "$:/config/codemirror-6/lang-xml/svg-completions";

function isXmlType(type) {
	return XML_TYPES.indexOf(type) !== -1;
}

function isSvgCompletionsEnabled() {
	var value = $tw.wiki.getTiddlerText(SVG_COMPLETIONS_CONFIG, "yes").trim().toLowerCase();
	return value === "yes" || value === "true";
}

exports.plugin = {
	name: "lang-xml",
	description: "XML syntax highlighting",
	priority: 50,

	/*
	Expose the real content types handled by this plugin.

	This lets the engine resolve a winning tag override to a real XML/SVG
	language mode.
	*/
	contentTypes: XML_TYPES,
	types: XML_TYPES,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;

		return {
			xmlLanguage: new Compartment()
		};
	},

	getTagOverrideType: function(context) {
		if(context.tagOverrideWinner === TAGS_CONFIG_TIDDLER) {
			return XML_TYPES[0];
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
				isXmlType(effectiveType);
		}

		/*
		Normal mode:
		- dropdown/session override
		- codemirror-type field
		- actual type field
		- configured XML language tag
		*/
		if(isXmlType(effectiveType)) return true;
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;

		return false;
	},

	/*
	Runtime language switching uses this.

	This must return raw compartment content only.
	Do not return xmlLanguage.of(...) from here.
	*/
	getCompartmentContent: function(context) {
		var effectiveType = context.effectiveType || context.tiddlerType || "";
		var isSvg = effectiveType === "image/svg+xml";

		// Use SVG schema for SVG files if enabled
		var lang = getLangXml();
		if(!lang) {
			return [];
		}
		if(isSvg && isSvgCompletionsEnabled()) {
			var schema = getSvgSchema();
			if(schema) {
				return [
					lang.xml({
						elements: schema.svgElements,
						attributes: schema.svgAttributes
					})
				];
			}
		}

		// Plain XML without schema
		return [
			lang.xml()
		];
	},

	/*
	Initial editor construction uses this.

	This may wrap the raw content in the plugin's compartment.
	*/
	getExtensions: function(context) {
		var compartments = context.engine._compartments;

		if(compartments.xmlLanguage) {
			return [
				compartments.xmlLanguage.of(
					this.getCompartmentContent(context)
				)
			];
		}

		return this.getCompartmentContent(context);
	}
};
