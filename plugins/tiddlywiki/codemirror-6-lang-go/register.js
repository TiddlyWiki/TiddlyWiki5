/*\
title: $:/plugins/tiddlywiki/codemirror-6-lang-go/register.js
type: application/javascript
module-type: codemirror6-language

Register Go language with CodeMirror 6 core.

Invoked on demand by language-registry.js rather than during boot. The grammar
itself is loaded later still: this registers a LanguageDescription carrying a
load() thunk, so the parser arrives only when a code block or an editor of this
language actually needs it.

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-go";

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

	// Published lazily: reading any of these is itself a request for the language.
	var _props = Object.create(null);
	["goCompletionExtension", "goCompletionSource", "goSupport"].forEach(function(prop) {
		Object.defineProperty(core, prop, {
			configurable: true,
			get: function() { ensure(); return _props[prop]; },
			set: function(value) { _props[prop] = value; }
		});
	});

	function ensure() {
		if(_loaded || _loading) {
			return;
		}
		_loading = true;
		try {
			var core = _shim;
			var langGo = require("$:/plugins/tiddlywiki/codemirror-6-lang-go/lang-go.js");
			var LanguageSupport = core.language.LanguageSupport;

			var goLanguage = langGo.goLanguage;
			var localCompletionSource = langGo.localCompletionSource;
			var snippets = langGo.snippets;

			// Create completion source combining snippets and local completions
			var snippetCompletion = core.autocomplete.completeFromList(snippets);
			var goCompletionSource = function(context) {
				var allOptions = [];
				var from = context.pos;

				// Get snippet completions (Go keywords and snippets)
				var snippetResult = snippetCompletion(context);
				if(snippetResult && snippetResult.options && snippetResult.options.length > 0) {
					allOptions = allOptions.concat(snippetResult.options);
					from = snippetResult.from;
				}

				// Get local completions (identifiers from the code)
				if(localCompletionSource) {
					var localResult = localCompletionSource(context);
					if(localResult && localResult.options && localResult.options.length > 0) {
						allOptions = allOptions.concat(localResult.options);
						if(localResult.from < from) {
							from = localResult.from;
						}
					}
				}

				if(allOptions.length > 0) {
					return {
						from: from,
						options: allOptions
					};
				}
				return null;
			};

			// Create completion extension
			var goCompletionExt = goLanguage.data.of({
				autocomplete: goCompletionSource
			});

			// Create LanguageSupport
			var goSupport = new LanguageSupport(goLanguage);

			// Store for use by other modules
			core.goSupport = goSupport;
			core.goCompletionExtension = goCompletionExt;
			core.goCompletionSource = goCompletionSource;

			// Register for nested language completion in TiddlyWiki
			// Uses Language.isActiveAt() for detection
			core.registerNestedLanguageCompletion({
				name: "go",
				language: goLanguage,
				source: goCompletionSource
			});

			core.registerLanguage(LanguageDescription.of({
				name: "Go",
				alias: ["go", "golang"],
				extensions: ["go"],
				support: goSupport
			}));
		} catch (e) {
			// leaves this language unregistered rather than breaking the editor
		}
		_loaded = true;
		_loading = false;
	}

	// Registered now, resolved later: lang-tiddlywiki only wires up nested
	// completion at all when this list is non-empty as it builds its support.
	["go"].forEach(function(nm) {
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
		name: "Go",
		alias: ["go", "golang"],
		extensions: ["go"],
		load: function() {
			ensure();
			return Promise.resolve(_desc["Go"] ? _desc["Go"].support : null);
		}
	}));
};
