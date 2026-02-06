/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-yaml/register.js
type: application/javascript
module-type: startup

Register YAML language with CodeMirror 6 core.

NAMING CONVENTION: The startup module name MUST follow the pattern "cm6-lang-*"
(e.g., "cm6-lang-yaml"). This allows the TiddlyWiki language module to
dynamically discover and depend on all language modules, ensuring they are
loaded before TiddlyWiki so nested code highlighting works in code blocks.

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-yaml";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

exports.startup = function() {
	var core, langYaml;
	try {
		core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
		langYaml = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-yaml/lang-yaml.js");
	} catch (e) {
		return;
	}

	if(!core || !core.registerLanguage || !langYaml) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;

	// Register YAML
	core.registerLanguage(LanguageDescription.of({
		name: "YAML",
		alias: ["yaml", "yml"],
		extensions: ["yaml", "yml"],
		support: langYaml.yaml()
	}));
};
