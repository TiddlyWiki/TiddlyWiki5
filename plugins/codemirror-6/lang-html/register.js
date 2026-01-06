/*\
title: $:/plugins/BurningTreeC/tiddlywiki-codemirror/plugins/lang-html/register.js
type: application/javascript
module-type: startup

Register HTML language with CodeMirror 6 core for code block highlighting.

NAMING CONVENTION: The startup module name MUST follow the pattern "cm6-lang-*"
(e.g., "cm6-lang-html"). This allows the TiddlyWiki language module to
dynamically discover and depend on all language modules, ensuring they are
loaded before TiddlyWiki so nested code highlighting works in code blocks.

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "cm6-lang-html";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

exports.startup = function() {
	var core = require("$:/plugins/BurningTreeC/tiddlywiki-codemirror/lib/core.js");
	var langHtml = require("$:/plugins/BurningTreeC/tiddlywiki-codemirror/lib/codemirror-lang-html.js");

	if (!core || !core.registerLanguage || !langHtml) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;

	// Register HTML
	core.registerLanguage(LanguageDescription.of({
		name: "HTML",
		alias: ["html", "htm", "xhtml"],
		extensions: ["html", "htm", "xhtml"],
		support: langHtml.html()
	}));
};
