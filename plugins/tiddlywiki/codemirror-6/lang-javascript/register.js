/*\
title: $:/plugins/tiddlywiki/codemirror-6/lang-javascript/register.js
type: application/javascript
module-type: codemirror6-language

Register JavaScript/TypeScript/JSX/TSX languages with CodeMirror 6 core for nested code blocks.

Invoked on demand by language-registry.js rather than during boot. The grammar
itself is loaded later still: this registers a LanguageDescription carrying a
load() thunk, so the parser arrives only when a code block or an editor of this
language actually needs it.

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-javascript";

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
	["_jsLanguageRegistered", "javascriptCompletionSource", "javascriptCompletionSources", "javascriptSupport", "jsxSupport", "tsxSupport", "typescriptSupport"].forEach(function(prop) {
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
			var langJs = require("$:/plugins/tiddlywiki/codemirror-6/lang-javascript/lang-javascript.js");
			// Prevent duplicate registration if startup runs multiple times
			if(core._jsLanguageRegistered) {
				return;
			}
			core._jsLanguageRegistered = true;

			var LanguageSupport = core.language.LanguageSupport;

			// Get all language variants
			var javascriptLanguage = langJs.javascriptLanguage;
			var typescriptLanguage = langJs.typescriptLanguage;
			var jsxLanguage = langJs.jsxLanguage;
			var tsxLanguage = langJs.tsxLanguage;

			// Get snippets - use JavaScript snippets only (TypeScript snippets include TS-specific
			// completions like 'interface' that shouldn't appear in pure JavaScript)
			var snippets = langJs.snippets;

			// Get other exports
			var localCompletionSource = langJs.localCompletionSource;
			var scopeCompletionSource = langJs.scopeCompletionSource;
			var autoCloseTags = langJs.autoCloseTags;

			// Create a merged scope object with window globals and $tw for scope completion
			// This allows completing properties like "console.log", "$tw.wiki", etc.
			var mergedScope = {};
			if(typeof window !== "undefined") {
				Object.keys(window).forEach(function(key) {
					try {
						mergedScope[key] = window[key];
					} catch (e) {
						// Some properties may throw on access
					}
				});
			}
			if(typeof $tw !== "undefined") {
				mergedScope["$tw"] = $tw;
			}

			// Create scope completion source from the merged scope
			var scopeSource = scopeCompletionSource ? scopeCompletionSource(mergedScope) : null;

			// Node types where completions shouldn't appear
			var dontComplete = ["TemplateString", "String", "RegExp", "LineComment", "BlockComment", "VariableDefinition", "PropertyDefinition"];

			// Keywords (same for JS and TS)
			var keywords = "break case const continue default delete export extends false finally in instanceof let new return static super switch this throw true typeof var yield".split(" ").map(function(kw) {
				return {
					label: kw,
					type: "keyword"
				};
			});

			// Combine snippets (with apply functions for templates) and keywords
			var completions = snippets.concat(keywords);

			// Create completion source
			var snippetSource = core.autocomplete.ifNotIn(dontComplete, core.autocomplete.completeFromList(completions));

			// Combine snippets/keywords with local and scope completions
			var jsCompletionSource = function(context) {
				var allOptions = [];
				var from = context.pos;

				// Get snippet/keyword completions
				var snippetResult = snippetSource(context);
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

				// Get scope completions (window globals, $tw, and their properties)
				if(scopeSource) {
					var scopeResult = scopeSource(context);
					if(scopeResult && scopeResult.options && scopeResult.options.length > 0) {
						allOptions = allOptions.concat(scopeResult.options);
						if(scopeResult.from < from) {
							from = scopeResult.from;
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

			// Store completion source for use by plugin.js
			core.javascriptCompletionSource = jsCompletionSource;

			// Register for nested language completion in TiddlyWiki
			// Uses Language.isActiveAt() for detection
			core.registerNestedLanguageCompletion({
				name: "javascript",
				language: javascriptLanguage,
				source: jsCompletionSource
			});

			// Also register TypeScript (uses same completion source)
			core.registerNestedLanguageCompletion({
				name: "typescript",
				language: typescriptLanguage,
				source: jsCompletionSource
			});

			// Create LanguageSupport for each variant (without completions - they're added via the shared extension)
			var jsSupport = new LanguageSupport(javascriptLanguage);
			var tsSupport = new LanguageSupport(typescriptLanguage);
			var jsxSupport = new LanguageSupport(jsxLanguage, [autoCloseTags]);
			var tsxSupport = new LanguageSupport(tsxLanguage, [autoCloseTags]);

			// Store for use by other modules
			core.javascriptSupport = jsSupport;
			core.typescriptSupport = tsSupport;
			core.jsxSupport = jsxSupport;
			core.tsxSupport = tsxSupport;

			// Store sources for other modules that need them
			core.javascriptCompletionSources = {
				snippets: langJs.snippets,
				typescriptSnippets: langJs.typescriptSnippets,
				localCompletionSource: localCompletionSource,
				ifNotIn: core.autocomplete.ifNotIn,
				completeFromList: core.autocomplete.completeFromList
			};

			// Register all JS-family languages
			core.registerLanguage(LanguageDescription.of({
				name: "JavaScript",
				alias: ["js", "ecmascript", "node", "mjs", "cjs"],
				extensions: ["js", "mjs", "cjs"],
				support: jsSupport
			}));

			core.registerLanguage(LanguageDescription.of({
				name: "TypeScript",
				alias: ["ts", "typescript"],
				extensions: ["ts", "mts", "cts"],
				support: tsSupport
			}));

			core.registerLanguage(LanguageDescription.of({
				name: "JSX",
				alias: ["jsx"],
				extensions: ["jsx"],
				support: jsxSupport
			}));

			core.registerLanguage(LanguageDescription.of({
				name: "TSX",
				alias: ["tsx"],
				extensions: ["tsx"],
				support: tsxSupport
			}));
		} catch (e) {
			// leaves this language unregistered rather than breaking the editor
		}
		_loaded = true;
		_loading = false;
	}

	// Registered now, resolved later: lang-tiddlywiki only wires up nested
	// completion at all when this list is non-empty as it builds its support.
	["javascript", "typescript"].forEach(function(nm) {
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
		name: "JavaScript",
		alias: ["js", "ecmascript", "node", "mjs", "cjs"],
		extensions: ["js", "mjs", "cjs"],
		load: function() {
			ensure();
			return Promise.resolve(_desc["JavaScript"] ? _desc["JavaScript"].support : null);
		}
	}));
	core.registerLanguage(LanguageDescription.of({
		name: "TypeScript",
		alias: ["ts", "typescript"],
		extensions: ["ts", "mts", "cts"],
		load: function() {
			ensure();
			return Promise.resolve(_desc["TypeScript"] ? _desc["TypeScript"].support : null);
		}
	}));
	core.registerLanguage(LanguageDescription.of({
		name: "JSX",
		alias: ["jsx"],
		extensions: ["jsx"],
		load: function() {
			ensure();
			return Promise.resolve(_desc["JSX"] ? _desc["JSX"].support : null);
		}
	}));
	core.registerLanguage(LanguageDescription.of({
		name: "TSX",
		alias: ["tsx"],
		extensions: ["tsx"],
		load: function() {
			ensure();
			return Promise.resolve(_desc["TSX"] ? _desc["TSX"].support : null);
		}
	}));
};
