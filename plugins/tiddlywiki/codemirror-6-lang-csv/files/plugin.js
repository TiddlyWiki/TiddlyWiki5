/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-csv/plugin.js
type: application/javascript
module-type: codemirror6-plugin

CSV language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langCsv, hasConfiguredTag;
try {
	langCsv = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-csv/lang-csv.js");
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

exports.plugin = {
	name: "lang-csv",
	description: "CSV syntax highlighting",
	priority: 50,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			csvLanguage: new Compartment()
		};
	},

	condition: function(context) {
		// If any tag override is active, only the winning plugin activates
		if(context.hasTagOverride) {
			return context.tagOverrideWinner === TAGS_CONFIG_TIDDLER;
		}
		// Normal mode: tag match or type match
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;
		return CSV_TYPES.indexOf(context.tiddlerType) !== -1;
	},

	getCompartmentContent: function(_context) {
		return [langCsv.csv()];
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		var extensions = [];

		// Language compartment
		if(compartments.csvLanguage) {
			extensions.push(compartments.csvLanguage.of(this.getCompartmentContent(context)));
		} else {
			extensions = extensions.concat(this.getCompartmentContent(context));
		}

		return extensions;
	}
};
