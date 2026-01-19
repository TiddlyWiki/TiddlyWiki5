/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-java/register.js
type: application/javascript
module-type: startup

Register Java language with CodeMirror 6 core.

NAMING CONVENTION: The startup module name MUST follow the pattern "cm6-lang-*"
(e.g., "cm6-lang-java"). This allows the TiddlyWiki language module to
dynamically discover and depend on all language modules, ensuring they are
loaded before TiddlyWiki so nested code highlighting works in code blocks.

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-java";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

exports.startup = function() {
	var core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
	var langJava = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-java/lang-java.js");

	if(!core || !core.registerLanguage || !langJava) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;

	core.registerLanguage(LanguageDescription.of({
		name: "Java",
		alias: ["java"],
		extensions: ["java"],
		support: langJava.java()
	}));
};
