/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-python/register.js
type: application/javascript
module-type: startup

Register Python language with CodeMirror 6 core for nested code blocks.

NAMING CONVENTION: The startup module name MUST follow the pattern "cm6-lang-*"
(e.g., "cm6-lang-python"). This allows the TiddlyWiki language module to
dynamically discover and depend on all language modules, ensuring they are
loaded before TiddlyWiki so nested code highlighting works in code blocks.

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-python";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

exports.startup = function() {
	var core, langPython;
	try {
		core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
		langPython = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-python/lang-python.js");
	} catch (e) {
		return;
	}

	if(!core || !core.registerLanguage || !langPython) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;
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
};
