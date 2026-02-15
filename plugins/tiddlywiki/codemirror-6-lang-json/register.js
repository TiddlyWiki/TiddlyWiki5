/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-json/register.js
type: application/javascript
module-type: startup

Register JSON language with CodeMirror 6 core.

NAMING CONVENTION: The startup module name MUST follow the pattern "cm6-lang-*"
(e.g., "cm6-lang-json"). This allows the TiddlyWiki language module to
dynamically discover and depend on all language modules, ensuring they are
loaded before TiddlyWiki so nested code highlighting works in code blocks.

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-json";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

exports.startup = function() {
	var core, langJson;
	try {
		core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
		langJson = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-json/lang-json.js");
	} catch (e) {
		return;
	}

	if(!core || !core.registerLanguage || !langJson) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;

	// Register JSON
	core.registerLanguage(LanguageDescription.of({
		name: "JSON",
		alias: ["json", "json5"],
		extensions: ["json", "map"],
		support: langJson.json()
	}));
};
