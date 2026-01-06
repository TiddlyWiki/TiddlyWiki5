/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-css/register.js
type: application/javascript
module-type: startup

Register CSS language with CodeMirror 6 core.

NAMING CONVENTION: The startup module name MUST follow the pattern "cm6-lang-*"
(e.g., "cm6-lang-css"). This allows the TiddlyWiki language module to
dynamically discover and depend on all language modules, ensuring they are
loaded before TiddlyWiki so nested code highlighting works in code blocks.

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "cm6-lang-css";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

exports.startup = function() {
	var core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
	var langCss = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-css/lang-css.js");

	if (!core || !core.registerLanguage || !langCss) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;

	// Register CSS
	core.registerLanguage(LanguageDescription.of({
		name: "CSS",
		alias: ["css"],
		extensions: ["css"],
		support: langCss.css()
	}));
};
