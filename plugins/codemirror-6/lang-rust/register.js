/*\
title: $:/plugins/BurningTreeC/tiddlywiki-codemirror/plugins/lang-rust/register.js
type: application/javascript
module-type: startup

Register Rust language with CodeMirror 6 core.

NAMING CONVENTION: The startup module name MUST follow the pattern "cm6-lang-*"
(e.g., "cm6-lang-rust"). This allows the TiddlyWiki language module to
dynamically discover and depend on all language modules, ensuring they are
loaded before TiddlyWiki so nested code highlighting works in code blocks.

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "cm6-lang-rust";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

exports.startup = function() {
	var core = require("$:/plugins/BurningTreeC/tiddlywiki-codemirror/lib/core.js");
	var langRust = require("$:/plugins/BurningTreeC/tiddlywiki-codemirror/plugins/lang-rust/lang-rust.js");

	if (!core || !core.registerLanguage || !langRust) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;

	core.registerLanguage(LanguageDescription.of({
		name: "Rust",
		alias: ["rust", "rs"],
		extensions: ["rs"],
		support: langRust.rust()
	}));
};
