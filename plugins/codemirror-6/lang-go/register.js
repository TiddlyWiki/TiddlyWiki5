/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-go/register.js
type: application/javascript
module-type: startup

Register Go language with CodeMirror 6 core.

NAMING CONVENTION: The startup module name MUST follow the pattern "cm6-lang-*"
(e.g., "cm6-lang-go"). This allows the TiddlyWiki language module to
dynamically discover and depend on all language modules, ensuring they are
loaded before TiddlyWiki so nested code highlighting works in code blocks.

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-go";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

exports.startup = function() {
	var core, langGo;
	try {
		core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
		langGo = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-go/lang-go.js");
	} catch (e) {
		return;
	}

	if(!core || !core.registerLanguage || !langGo) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;
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
};
