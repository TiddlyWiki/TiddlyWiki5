/*\
title: $:/plugins/tiddlywiki/codemirror-6-lang-sql/register.js
type: application/javascript
module-type: codemirror6-language

Register SQL language with CodeMirror 6 core.

Invoked on demand by language-registry.js rather than during boot. The grammar
itself is loaded later still: this registers a LanguageDescription carrying a
load() thunk, so the parser arrives only when a code block or an editor of this
language actually needs it.

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-sql";

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
	["sqlCompletionSource"].forEach(function(prop) {
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
			var langSql = require("$:/plugins/tiddlywiki/codemirror-6-lang-sql/lang-sql.js");
			var LanguageSupport = core.language.LanguageSupport;

			var keywordCompletionSource = langSql.keywordCompletionSource;
			var schemaCompletionSource = langSql.schemaCompletionSource;
			var StandardSQL = langSql.StandardSQL;

			// Create completion source combining keyword and schema completions
			var sqlCompletionSource = function(context) {
				var keywordResult = keywordCompletionSource(StandardSQL)(context);
				if(keywordResult) return keywordResult;
				return null;
			};

			// Store completion source for use by other modules
			core.sqlCompletionSource = sqlCompletionSource;

			// Register for nested language completion in TiddlyWiki
			// Uses Language.isActiveAt() for detection
			// StandardSQL.language is the Language object for SQL
			core.registerNestedLanguageCompletion({
				name: "sql",
				language: StandardSQL.language,
				source: sqlCompletionSource
			});

			// Register SQL (standard)
			core.registerLanguage(LanguageDescription.of({
				name: "SQL",
				alias: ["sql"],
				extensions: ["sql"],
				support: langSql.sql()
			}));

			// Register MySQL
			core.registerLanguage(LanguageDescription.of({
				name: "MySQL",
				alias: ["mysql"],
				extensions: [],
				support: langSql.sql({
					dialect: langSql.MySQL
				})
			}));

			// Register PostgreSQL
			core.registerLanguage(LanguageDescription.of({
				name: "PostgreSQL",
				alias: ["postgresql", "postgres", "pgsql"],
				extensions: [],
				support: langSql.sql({
					dialect: langSql.PostgreSQL
				})
			}));

			// Register SQLite
			core.registerLanguage(LanguageDescription.of({
				name: "SQLite",
				alias: ["sqlite"],
				extensions: [],
				support: langSql.sql({
					dialect: langSql.SQLite
				})
			}));
		} catch (e) {
			// leaves this language unregistered rather than breaking the editor
		}
		_loaded = true;
		_loading = false;
	}

	// Registered now, resolved later: lang-tiddlywiki only wires up nested
	// completion at all when this list is non-empty as it builds its support.
	["sql"].forEach(function(nm) {
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
		name: "SQL",
		alias: ["sql"],
		extensions: ["sql"],
		load: function() {
			ensure();
			return Promise.resolve(_desc["SQL"] ? _desc["SQL"].support : null);
		}
	}));
	core.registerLanguage(LanguageDescription.of({
		name: "MySQL",
		alias: ["mysql"],
		extensions: [],
		load: function() {
			ensure();
			return Promise.resolve(_desc["MySQL"] ? _desc["MySQL"].support : null);
		}
	}));
	core.registerLanguage(LanguageDescription.of({
		name: "PostgreSQL",
		alias: ["postgresql", "postgres", "pgsql"],
		extensions: [],
		load: function() {
			ensure();
			return Promise.resolve(_desc["PostgreSQL"] ? _desc["PostgreSQL"].support : null);
		}
	}));
	core.registerLanguage(LanguageDescription.of({
		name: "SQLite",
		alias: ["sqlite"],
		extensions: [],
		load: function() {
			ensure();
			return Promise.resolve(_desc["SQLite"] ? _desc["SQLite"].support : null);
		}
	}));
};
