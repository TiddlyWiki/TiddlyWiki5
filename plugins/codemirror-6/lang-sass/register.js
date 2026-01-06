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
	var core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
	var langSass = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-sass/lang-sass.js");

	if(!core || !core.registerLanguage || !langSass) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;

	// Register SCSS
	core.registerLanguage(LanguageDescription.of({
		name: "SCSS",
		alias: ["scss"],
		extensions: ["scss"],
		support: langSass.sass()
	}));

	// Register Sass (indented syntax)
	core.registerLanguage(LanguageDescription.of({
		name: "Sass",
		alias: ["sass"],
		extensions: ["sass"],
		support: langSass.sass({
			indented: true
		})
	}));
};
