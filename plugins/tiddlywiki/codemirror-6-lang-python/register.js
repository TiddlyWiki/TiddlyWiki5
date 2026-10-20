/*\
title: $:/plugins/tiddlywiki/codemirror-6-lang-python/register.js
type: application/javascript
module-type: codemirror6-language

Register Python language with CodeMirror 6 core for nested code blocks.

Invoked on demand by language-registry.js rather than during boot. The grammar
itself is loaded later still: this registers a LanguageDescription carrying a
load() thunk, so the parser arrives only when a code block or an editor of this
language actually needs it.

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-python";

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
	["pythonCompletionExtension", "pythonCompletionSource", "pythonSupport"].forEach(function(prop) {
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
			var langPython = require("$:/plugins/tiddlywiki/codemirror-6-lang-python/lang-python.js");
			var LanguageSupport = core.language.LanguageSupport;

			var pythonLanguage = langPython.pythonLanguage;
			var localCompletionSource = langPython.localCompletionSource;
			var globalCompletion = langPython.globalCompletion;

			// Get the full python() LanguageSupport which has completions properly configured
			var pythonFull = langPython.python();

			// Create completion source for Python
			// Combines local identifiers with global keywords/builtins
			var pythonCompletionSource = function(context) {
				var allOptions = [];
				var from = context.pos;

				// Get local completions (identifiers from the code)
				if(localCompletionSource) {
					var localResult = localCompletionSource(context);
					if(localResult && localResult.options && localResult.options.length > 0) {
						allOptions = allOptions.concat(localResult.options);
						from = localResult.from;
					}
				}

				// Get global completions (Python keywords and builtins)
				if(globalCompletion) {
					var globalResult = globalCompletion(context);
					if(globalResult && globalResult.options && globalResult.options.length > 0) {
						allOptions = allOptions.concat(globalResult.options);
						// Use the earlier 'from' position
						if(globalResult.from < from) {
							from = globalResult.from;
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

			var pythonCompletionExt = pythonLanguage.data.of({
				autocomplete: pythonCompletionSource
			});
			pythonCompletionExt._twExtId = "Python-" + Date.now();

			// Create LanguageSupport without completions (they're added separately)
			var pythonSupport = new LanguageSupport(pythonLanguage);

			// Store for use by other modules
			core.pythonSupport = pythonSupport;
			core.pythonCompletionExtension = pythonCompletionExt;
			core.pythonCompletionSource = pythonCompletionSource;

			// Register for nested language completion in TiddlyWiki
			// Uses Language.isActiveAt() for detection
			core.registerNestedLanguageCompletion({
				name: "python",
				language: pythonLanguage,
				source: pythonCompletionSource
			});

			// Register Python
			core.registerLanguage(LanguageDescription.of({
				name: "Python",
				alias: ["python", "py"],
				extensions: ["py", "pyw", "pyi"],
				support: pythonSupport
			}));
		} catch (e) {
			// leaves this language unregistered rather than breaking the editor
		}
		_loaded = true;
		_loading = false;
	}

	// Registered now, resolved later: lang-tiddlywiki only wires up nested
	// completion at all when this list is non-empty as it builds its support.
	["python"].forEach(function(nm) {
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
		name: "Python",
		alias: ["python", "py"],
		extensions: ["py", "pyw", "pyi"],
		load: function() {
			ensure();
			return Promise.resolve(_desc["Python"] ? _desc["Python"].support : null);
		}
	}));
};
