/*\
title: $:/plugins/tiddlywiki/codemirror-6-lang-java/register.js
type: application/javascript
module-type: codemirror6-language

Register Java language with CodeMirror 6 core.

Invoked on demand by language-registry.js rather than during boot. The grammar
itself is loaded later still: this registers a LanguageDescription carrying a
load() thunk, so the parser arrives only when a code block or an editor of this
language actually needs it.

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-java";

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
			var langJava = require("$:/plugins/tiddlywiki/codemirror-6-lang-java/lang-java.js");
			core.registerLanguage(LanguageDescription.of({
				name: "Java",
				alias: ["java"],
				extensions: ["java"],
				support: langJava.java()
			}));
		} catch (e) {
			// leaves this language unregistered rather than breaking the editor
		}
		_loaded = true;
		_loading = false;
	}

	core.registerLanguage(LanguageDescription.of({
		name: "Java",
		alias: ["java"],
		extensions: ["java"],
		load: function() {
			ensure();
			return Promise.resolve(_desc["Java"] ? _desc["Java"].support : null);
		}
	}));
};
