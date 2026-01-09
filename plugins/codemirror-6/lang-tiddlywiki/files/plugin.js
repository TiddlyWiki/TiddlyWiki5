/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-tiddlywiki/plugin.js
type: application/javascript
module-type: codemirror6-plugin

TiddlyWiki wikitext language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Content types that activate this plugin
var WIKITEXT_TYPES = [
	"text/vnd.tiddlywiki",
	"text/vnd.tiddlywiki-multiple",
	"application/x-tiddler-dictionary",
	""  // Empty type defaults to wikitext
];

exports.plugin = {
	name: "lang-tiddlywiki",
	description: "TiddlyWiki wikitext syntax highlighting and completions",
	priority: 900, // High priority - this is the main language

	init: function(cm6Core) {
		this._core = cm6Core;
		this._support = null;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			tiddlywikiLanguage: new Compartment()
		};
	},

	condition: function(context) {
		var type = context.tiddlerType;
		return WIKITEXT_TYPES.indexOf(type) !== -1;
	},

	_getLanguageSupport: function() {
		if(this._support) return this._support;

		// Find the TiddlyWiki LanguageDescription from registered languages
		var languages = this._core.getLanguages ? this._core.getLanguages() : [];
		for(var i = 0; i < languages.length; i++) {
			var lang = languages[i];
			if(lang.name === "TiddlyWiki" && lang.support) {
				this._support = lang.support;
				return this._support;
			}
		}
		return null;
	},

	getCompartmentContent: function(_context) {
		var support = this._getLanguageSupport();
		if(support) {
			// LanguageSupport.extension contains all the extensions including keymap
			return [support];
		}
		return [];
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		if(compartments.tiddlywikiLanguage) {
			return [compartments.tiddlywikiLanguage.of(this.getCompartmentContent(context))];
		}
		return this.getCompartmentContent(context);
	}
};
