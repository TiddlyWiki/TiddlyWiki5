/*\
title: $:/plugins/tiddlywiki/codemirror-6-lang-sass/register.js
type: application/javascript
module-type: codemirror6-language

Register Sass/SCSS language with CodeMirror 6 core.

Invoked on demand by language-registry.js rather than during boot. The grammar
itself is loaded later still: this registers a LanguageDescription carrying a
load() thunk, so the parser arrives only when a code block or an editor of this
language actually needs it.

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-sass";

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
			var langSass = require("$:/plugins/tiddlywiki/codemirror-6-lang-sass/lang-sass.js");
			// Get the language objects from LanguageSupport
			var scssSupport = langSass.sass();
			var sassSupport = langSass.sass({
				indented: true
			});
			var scssLanguage = scssSupport.language;
			var sassLanguageObj = sassSupport.language;

			// Store completion source for use by other modules
			var sassCompletionSource = langSass.sassCompletionSource;
			if(sassCompletionSource) {
				core.sassCompletionSource = sassCompletionSource;

				// Register for nested language completion in TiddlyWiki
				// Uses Language.isActiveAt() for detection
				core.registerNestedLanguageCompletion({
					name: "sass",
					language: sassLanguageObj,
					source: sassCompletionSource
				});
				// Also register as scss
				core.registerNestedLanguageCompletion({
					name: "scss",
					language: scssLanguage,
					source: sassCompletionSource
				});
			}

			// Register SCSS
			core.registerLanguage(LanguageDescription.of({
				name: "SCSS",
				alias: ["scss"],
				extensions: ["scss"],
				support: scssSupport
			}));

			// Register Sass (indented syntax)
			core.registerLanguage(LanguageDescription.of({
				name: "Sass",
				alias: ["sass"],
				extensions: ["sass"],
				support: sassSupport
			}));
		} catch (e) {
			// leaves this language unregistered rather than breaking the editor
		}
		_loaded = true;
		_loading = false;
	}

	// Registered now, resolved later: lang-tiddlywiki only wires up nested
	// completion at all when this list is non-empty as it builds its support.
	["sass", "scss"].forEach(function(nm) {
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
		name: "SCSS",
		alias: ["scss"],
		extensions: ["scss"],
		load: function() {
			ensure();
			return Promise.resolve(_desc["SCSS"] ? _desc["SCSS"].support : null);
		}
	}));
	core.registerLanguage(LanguageDescription.of({
		name: "Sass",
		alias: ["sass"],
		extensions: ["sass"],
		load: function() {
			ensure();
			return Promise.resolve(_desc["Sass"] ? _desc["Sass"].support : null);
		}
	}));
};
