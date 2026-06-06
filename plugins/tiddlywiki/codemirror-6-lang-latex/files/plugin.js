/*\
title: $:/plugins/tiddlywiki/codemirror-6-lang-latex/plugin.js
type: application/javascript
module-type: codemirror6-plugin

LaTeX language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langLatex, cmAutocomplete, hasConfiguredTag;
try {
	langLatex = require("$:/plugins/tiddlywiki/codemirror-6-lang-latex/lang-latex.js");
	cmAutocomplete = require("$:/plugins/tiddlywiki/codemirror-6/lib/codemirror-autocomplete.js");
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	return;
}

if(!langLatex || !cmAutocomplete || !hasConfiguredTag) return;

// Content types that activate this plugin
var LATEX_TYPES = [
	"text/x-latex",
	"text/x-tex",
	"application/x-latex",
	"application/x-tex"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-latex/tags";

// Cache the LanguageSupport for LaTeX with properly scoped autocompletion
var _latexSupport = null;

function isLatexType(type) {
	return LATEX_TYPES.indexOf(type) !== -1;
}

function getLatexSupport(core) {
	if(_latexSupport) return _latexSupport;

	// Use latexLanguage directly, without latex(), because latex() may use
	// autocompletion override and replace other completion sources.
	var LanguageSupport = core.language.LanguageSupport;
	var latexLanguage = langLatex.latexLanguage;
	var latexCompletionSource = langLatex.latexCompletionSource;
	var autocompletion = cmAutocomplete.autocompletion;

	if(LanguageSupport && latexLanguage) {
		var support = [];

		// Add LaTeX-specific completions via languageData, not override.
		// latexCompletionSource is a factory:
		// latexCompletionSource(autoCloseTagsEnabled) => CompletionSource
		if(latexCompletionSource) {
			var actualSource = latexCompletionSource(false);

			support.push(
				latexLanguage.data.of({
					autocomplete: actualSource
				})
			);
		}

		// Needed for pure LaTeX tiddlers where the TiddlyWiki language plugin
		// is not active.
		if(autocompletion) {
			support.push(
				autocompletion({
					activateOnTyping: true
				})
			);
		}

		_latexSupport = new LanguageSupport(latexLanguage, support);
	} else {
		// Fallback to full latex() if custom support cannot be created.
		_latexSupport = langLatex.latex();
	}

	return _latexSupport;
}

exports.plugin = {
	name: "lang-latex",
	description: "LaTeX syntax highlighting",
	priority: 50,

	/*
	Expose the real content types handled by this plugin.

	This lets the engine resolve a winning tag override to a real LaTeX
	language mode.
	*/
	contentTypes: LATEX_TYPES,
	types: LATEX_TYPES,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;

		return {
			latexLanguage: new Compartment()
		};
	},

	getTagOverrideType: function(context) {
		if(context.tagOverrideWinner === TAGS_CONFIG_TIDDLER) {
			return LATEX_TYPES[0];
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
				isLatexType(effectiveType);
		}

		/*
		Normal mode:
		- dropdown/session override
		- codemirror-type field
		- actual type field
		- configured LaTeX language tag
		*/
		if(isLatexType(effectiveType)) return true;
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;

		return false;
	},

	/*
	Runtime language switching uses this.

	This must return raw compartment content only.
	Do not return latexLanguage.of(...) from here.
	*/
	getCompartmentContent: function(_context) {
		return [
			getLatexSupport(this._core)
		];
	},

	/*
	Initial editor construction uses this.

	This may wrap the raw content in the plugin's compartment.
	*/
	getExtensions: function(context) {
		var compartments = context.engine._compartments;

		if(compartments.latexLanguage) {
			return [
				compartments.latexLanguage.of(
					this.getCompartmentContent(context)
				)
			];
		}

		return this.getCompartmentContent(context);
	}
};
