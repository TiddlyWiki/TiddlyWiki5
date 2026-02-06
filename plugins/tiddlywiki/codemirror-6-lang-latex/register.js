/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-latex/register.js
type: application/javascript
module-type: startup

Register LaTeX language with CodeMirror 6 core.

NAMING CONVENTION: The startup module name MUST follow the pattern "cm6-lang-*"
(e.g., "cm6-lang-latex"). This allows the TiddlyWiki language module to
dynamically discover and depend on all language modules, ensuring they are
loaded before TiddlyWiki so nested code highlighting works in code blocks.

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-latex";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

exports.startup = function() {
	var core, langLatex;
	try {
		core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
		langLatex = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-latex/lang-latex.js");
	} catch (e) {
		return;
	}

	if(!core || !core.registerLanguage || !langLatex) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;
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
};
