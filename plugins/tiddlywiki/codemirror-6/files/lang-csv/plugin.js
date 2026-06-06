/*\
title: $:/plugins/tiddlywiki/codemirror-6/lang-csv/plugin.js
type: application/javascript
module-type: codemirror6-plugin

CSV language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langCsv, hasConfiguredTag;
try {
	langCsv = require("$:/plugins/tiddlywiki/codemirror-6/lang-csv/lang-csv.js");
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	return;
}

if(!langCsv || !hasConfiguredTag) return;

// Content types that activate this plugin
var CSV_TYPES = [
	"text/csv"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-csv/tags";

function isCsvType(type) {
	return CSV_TYPES.indexOf(type) !== -1;
}

exports.plugin = {
	name: "lang-csv",
	description: "CSV syntax highlighting",
	priority: 50,

	/*
	Expose the real content types handled by this plugin.

	This lets the engine resolve a winning tag override to a real language
	type, instead of treating tag override as a separate partial mode.
	*/
	contentTypes: CSV_TYPES,
	types: CSV_TYPES,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			csvLanguage: new Compartment()
		};
	},

	getTagOverrideType: function(context) {
		if(context.tagOverrideWinner === TAGS_CONFIG_TIDDLER) {
			return CSV_TYPES[0];
		}
		return null;
	},

	condition: function(context) {
		var effectiveType = context.effectiveType || context.tiddlerType || "";

		/*
		If a tag override is active, only the winning tag/plugin may activate.

		Do not use hasConfiguredTag() in this branch. A tiddler may contain
		multiple configured language tags, but the engine has already selected
		the winning one.
		*/
		if(context.hasTagOverride) {
			return context.tagOverrideWinner === TAGS_CONFIG_TIDDLER ||
				isCsvType(effectiveType);
		}

		/*
		Normal mode:
		- dropdown/session override
		- codemirror-type field
		- actual type field
		- configured CSV language tag
		*/
		if(isCsvType(effectiveType)) return true;
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;

		return false;
	},

	/*
	Runtime language switching uses this.

	This must return raw compartment content only.
	Do not return csvLanguage.of(...) from here.
	*/
	getCompartmentContent: function(_context) {
		return [
			langCsv.csv()
		];
	},

	/*
	Initial editor construction uses this.

	This may wrap the raw content in the plugin's compartment.
	*/
	getExtensions: function(context) {
		var compartments = context.engine._compartments;

		if(compartments.csvLanguage) {
			return [
				compartments.csvLanguage.of(
					this.getCompartmentContent(context)
				)
			];
		}

		return this.getCompartmentContent(context);
	}
};
