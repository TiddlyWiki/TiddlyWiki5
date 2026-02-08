/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-latex/plugin.js
type: application/javascript
module-type: codemirror6-plugin

LaTeX language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langLatex, cmAutocomplete, hasConfiguredTag;
try {
	langLatex = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-latex/lang-latex.js");
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

function getLatexSupport(core) {
	if(_latexSupport) return _latexSupport;

	// Use latexLanguage directly (without latex() which includes autocompletion with override)
	// The override option in latex() replaces ALL completion sources, breaking other languages.
	// Instead, we register completions via languageData which scopes them to LaTeX content only.
	var LanguageSupport = core.language.LanguageSupport;
	var latexLanguage = langLatex.latexLanguage;
	var latexCompletionSource = langLatex.latexCompletionSource;
	var autocompletion = cmAutocomplete.autocompletion;

	if(LanguageSupport && latexLanguage) {
		// Create LanguageSupport with LaTeX completions scoped to LaTeX content
		var support = [];

		// Add LaTeX-specific completions via languageData (not override)
		// latexCompletionSource is a factory: latexCompletionSource(autoCloseTagsEnabled) => CompletionSource
		if(latexCompletionSource) {
			// Call the factory to get the actual completion source
			var actualSource = latexCompletionSource(false);
			support.push(latexLanguage.data.of({
				autocomplete: actualSource
			}));
		}

		// Add autocompletion extension - needed for pure LaTeX tiddlers where
		// TiddlyWiki plugin isn't active. For TiddlyWiki content, the TiddlyWiki
		// plugin provides autocompletion, but this plugin won't be active then.
		if(autocompletion) {
			support.push(autocompletion({
				activateOnTyping: true
			}));
		}

		_latexSupport = new LanguageSupport(latexLanguage, support);
	} else {
		// Fallback to full latex() if we can't create a custom version
		_latexSupport = langLatex.latex();
	}
	return _latexSupport;
}

exports.plugin = {
	name: "lang-latex",
	description: "LaTeX syntax highlighting",
	priority: 50,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			latexLanguage: new Compartment()
		};
	},

	condition: function(context) {
		// If any tag override is active, only the winning plugin activates
		if(context.hasTagOverride) {
			return context.tagOverrideWinner === TAGS_CONFIG_TIDDLER;
		}
		// Normal mode: tag match or type match
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;
		return LATEX_TYPES.indexOf(context.tiddlerType) !== -1;
	},

	getCompartmentContent: function(_context) {
		return [getLatexSupport(this._core)];
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		if(compartments.latexLanguage) {
			return [compartments.latexLanguage.of(this.getCompartmentContent(context))];
		}
		return this.getCompartmentContent(context);
	}
};
