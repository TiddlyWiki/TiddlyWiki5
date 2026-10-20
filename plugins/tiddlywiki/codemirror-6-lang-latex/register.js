/*\
title: $:/plugins/tiddlywiki/codemirror-6-lang-latex/register.js
type: application/javascript
module-type: codemirror6-language

Register LaTeX language with CodeMirror 6 core.

Invoked on demand by language-registry.js rather than during boot. The grammar
itself is loaded later still: this registers a LanguageDescription carrying a
load() thunk, so the parser arrives only when a code block or an editor of this
language actually needs it.

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-latex";

exports.register = function() {
	var core;
	try {
		core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
	} catch (e) {
		return;
	}

	if(!core || !core.registerLanguage) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;

	/*
	Everything needing the grammar lives in ensure(), behind one memoised call.

	The grammar, and the CodeMirror runtime behind it, are the expensive part, and
	nothing needs them until this language is actually used. So the registration
	at the bottom hands CodeMirror a load() thunk rather than a built
	LanguageSupport, and anything this module publishes on core is reached through
	an accessor that triggers the same load.
	*/
	var _loading = false, _loaded = false;
	var _nested = Object.create(null), _desc = Object.create(null);

	// Within ensure(), `core` is this shim. registerLanguage has already happened
	// eagerly below, and so have the nested-completion entries, so both are
	// captured here instead of being repeated. Everything else falls through to
	// the real core, including property writes, which the accessors below catch.
	var _shim = Object.create(core);
	_shim.registerLanguage = function(desc) {
		if(desc && desc.name) { _desc[desc.name] = desc; }
	};
	_shim.registerNestedLanguageCompletion = function(cfg) {
		if(cfg && cfg.name) { _nested[cfg.name] = cfg; }
	};

	function ensure() {
		if(_loaded || _loading) {
			return;
		}
		_loading = true;
		try {
			var core = _shim;
			var langLatex = require("$:/plugins/tiddlywiki/codemirror-6-lang-latex/lang-latex.js");
			var LanguageSupport = core.language.LanguageSupport;
			var latexLanguage = langLatex.latexLanguage;
			var latexCompletionSource = langLatex.latexCompletionSource;

			// Use latexLanguage directly instead of latex() to avoid autocompletion({override:...})
			// which would override ALL completion sources in the editor.
			// Instead, we register completions via languageData which scopes them to LaTeX content only.
			var latexSupport;
			var actualLatexSource;
			if(LanguageSupport && latexLanguage) {
				var support = [];
				// Add LaTeX-specific completions via languageData (not override)
				// latexCompletionSource is a factory: latexCompletionSource(autoCloseTagsEnabled) => CompletionSource
				if(latexCompletionSource) {
					// Call the factory to get the actual completion source
					actualLatexSource = latexCompletionSource(false);
					support.push(latexLanguage.data.of({
						autocomplete: actualLatexSource
					}));
				}
				latexSupport = new LanguageSupport(latexLanguage, support);
			} else {
				// Fallback if latexLanguage isn't available
				latexSupport = langLatex.latex();
			}

			// Store completion source for use by other modules
			if(actualLatexSource) {
				core.latexCompletionSource = actualLatexSource;

				// Register for nested language completion in TiddlyWiki
				// Uses Language.isActiveAt() for detection
				core.registerNestedLanguageCompletion({
					name: "latex",
					language: latexLanguage,
					source: actualLatexSource
				});
			}

			core.registerLanguage(LanguageDescription.of({
				name: "LaTeX",
				alias: ["latex", "tex"],
				extensions: ["tex", "latex", "sty", "cls", "ltx"],
				support: latexSupport
			}));
		} catch (e) {
			// leaves this language unregistered rather than breaking the editor
		}
		_loaded = true;
		_loading = false;
	}

	// Registered now, resolved later: lang-tiddlywiki only wires up nested
	// completion at all when this list is non-empty as it builds its support.
	["latex"].forEach(function(nm) {
		core.registerNestedLanguageCompletion({
			name: nm,
			getLanguage: function() {
				ensure();
				return _nested[nm] ? _nested[nm].language : null;
			},
			source: function(context) {
				ensure();
				return _nested[nm] && _nested[nm].source ? _nested[nm].source(context) : null;
			}
		});
	});

	core.registerLanguage(LanguageDescription.of({
		name: "LaTeX",
		alias: ["latex", "tex"],
		extensions: ["tex", "latex", "sty", "cls", "ltx"],
		load: function() {
			ensure();
			return Promise.resolve(_desc["LaTeX"] ? _desc["LaTeX"].support : null);
		}
	}));
};
