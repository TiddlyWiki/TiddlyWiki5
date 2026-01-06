/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-python/register.js
type: application/javascript
module-type: startup

Register Python language with CodeMirror 6 core.

NAMING CONVENTION: The startup module name MUST follow the pattern "cm6-lang-*"
(e.g., "cm6-lang-python"). This allows the TiddlyWiki language module to
dynamically discover and depend on all language modules, ensuring they are
loaded before TiddlyWiki so nested code highlighting works in code blocks.

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "cm6-lang-python";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

exports.startup = function() {
	var core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
	var langPython = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-python/lang-python.js");

	if (!core || !core.registerLanguage || !langPython) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;

	// Register Python
	core.registerLanguage(LanguageDescription.of({
		name: "Python",
		alias: ["python", "py"],
		extensions: ["py", "pyw", "pyi"],
		support: langPython.python()
	}));
};
