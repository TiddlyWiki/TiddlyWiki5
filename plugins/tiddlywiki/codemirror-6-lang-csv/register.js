/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-csv/register.js
type: application/javascript
module-type: startup

Register CSV language with CodeMirror 6 core.

NAMING CONVENTION: The startup module name MUST follow the pattern "cm6-lang-*"
(e.g., "cm6-lang-csv"). This allows the TiddlyWiki language module to
dynamically discover and depend on all language modules, ensuring they are
loaded before TiddlyWiki so nested code highlighting works in code blocks.

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-csv";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

exports.startup = function() {
	var core, langCsv;
	try {
		core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
		langCsv = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-csv/lang-csv.js");
	} catch (e) {
		return;
	}

	if(!core || !core.registerLanguage || !langCsv) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;

	// Register CSV
	core.registerLanguage(LanguageDescription.of({
		name: "CSV",
		alias: ["csv"],
		extensions: ["csv", "tsv"],
		support: langCsv.csv()
	}));
};
