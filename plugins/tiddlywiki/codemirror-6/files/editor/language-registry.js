/*\
title: $:/plugins/tiddlywiki/codemirror-6/language-registry.js
type: application/javascript
module-type: library

Discovers all codemirror6-plugin modules and calls their registerLanguage()
method to register languages for nested code blocks.

This used to be a startup module, which made it run during every wiki's boot.
That was expensive and, for most wikis, wasted: requiring lib/core.js pulls in
the whole CodeMirror runtime (state, view, commands, language, autocomplete,
lezer), and enumerating the codemirror6-plugin modules executes every language
plugin. On a 7.5 MB wiki that measured ~290ms of script evaluation before first
paint -- paid by every reader, whether or not an editor was ever opened.

The registered languages have exactly two consumers, and both only exist once an
editor does: the engine (which copies them into options.codeLanguages) and
lang-tiddlywiki's own language support. So registration is done on demand
instead, from the engine constructor. Nothing else observes it, and require()
is memoised, so the work still happens exactly once per session.

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var PLUGIN_MODULE_TYPE = "codemirror6-plugin";
var LANGUAGE_MODULE_TYPE = "codemirror6-language";

var registered = false;

/*
Register every language plugin with the CodeMirror core, once.

Safe to call as often as you like; only the first call does any work. Returns
true when the languages are registered (now or previously), false when the core
library is unavailable and there is nothing to register with.
*/
exports.ensure = function() {
	if(registered) {
		return true;
	}

	var core;
	try {
		core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
	} catch (e) {
		return false;
	}

	if(!core || !core.registerLanguage) {
		return false;
	}

	// Set before doing the work, not after: registerLanguage() implementations may
	// reach back into the engine, and a re-entrant call must not start a second pass.
	registered = true;

	if($tw && $tw.modules && typeof $tw.modules.forEachModuleOfType === "function") {
		// Every lang-*/register.js. These used to be startup modules; they are enumerated
		// here instead so that requiring a grammar (and the CodeMirror runtime behind it)
		// happens on the first editor rather than during every wiki's boot.
		$tw.modules.forEachModuleOfType(LANGUAGE_MODULE_TYPE, function(title, languageModule) {
			try {
				if(languageModule && typeof languageModule.register === "function") {
					languageModule.register();
				}
			} catch (e) {
				// Silent fail for individual languages
			}
		});

		// Discover all codemirror6-plugin modules and call registerLanguage if present
		// IMPORTANT: lang-tiddlywiki must be called LAST because it needs all other
		// languages to be registered first (for nested code block highlighting)
		var tiddlywikiPlugin = null;

		// First pass: register all non-tiddlywiki languages
		$tw.modules.forEachModuleOfType(PLUGIN_MODULE_TYPE, function(title, pluginModule) {
			try {
				var pluginDef = pluginModule.default || pluginModule.plugin || pluginModule;

				if(pluginDef && typeof pluginDef.registerLanguage === "function") {
					// Defer lang-tiddlywiki to run last
					if(pluginDef.name === "lang-tiddlywiki") {
						tiddlywikiPlugin = pluginDef;
					} else {
						pluginDef.registerLanguage(core);
					}
				}
			} catch (e) {
				// Silent fail for individual plugins
			}
		});

		// Second pass: register lang-tiddlywiki last
		if(tiddlywikiPlugin) {
			try {
				tiddlywikiPlugin.registerLanguage(core);
			} catch (e) {
				// Silent fail
			}
		}
	}

	return true;
};
