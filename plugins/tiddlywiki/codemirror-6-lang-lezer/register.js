/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-lezer/register.js
type: application/javascript
module-type: startup

Register Lezer grammar language with CodeMirror 6 core.

NAMING CONVENTION: The startup module name MUST follow the pattern "cm6-lang-*"
(e.g., "cm6-lang-lezer"). This allows the TiddlyWiki language module to
dynamically discover and depend on all language modules, ensuring they are
loaded before TiddlyWiki so nested code highlighting works in code blocks.

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-lezer";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

exports.startup = function() {
	var core, langLezer;
	try {
		core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
		langLezer = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-lezer/lang-lezer.js");
	} catch (e) {
		return;
	}

	if(!core || !core.registerLanguage || !langLezer) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;

	core.registerLanguage(LanguageDescription.of({
		name: "Lezer",
		alias: ["lezer", "grammar"],
		extensions: ["grammar"],
		support: langLezer.lezer()
	}));
};
