/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-sass/register.js
type: application/javascript
module-type: startup

Register Sass/SCSS language with CodeMirror 6 core.

NAMING CONVENTION: The startup module name MUST follow the pattern "cm6-lang-*"
(e.g., "cm6-lang-sass"). This allows the TiddlyWiki language module to
dynamically discover and depend on all language modules, ensuring they are
loaded before TiddlyWiki so nested code highlighting works in code blocks.

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-sass";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

exports.startup = function() {
	var core, langSass;
	try {
		core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
		langSass = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-sass/lang-sass.js");
	} catch (e) {
		return;
	}

	if(!core || !core.registerLanguage || !langSass) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;

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
};
