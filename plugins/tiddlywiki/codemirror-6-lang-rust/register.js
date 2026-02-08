/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-rust/register.js
type: application/javascript
module-type: startup

Register Rust language with CodeMirror 6 core.

NAMING CONVENTION: The startup module name MUST follow the pattern "cm6-lang-*"
(e.g., "cm6-lang-rust"). This allows the TiddlyWiki language module to
dynamically discover and depend on all language modules, ensuring they are
loaded before TiddlyWiki so nested code highlighting works in code blocks.

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-rust";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

exports.startup = function() {
	var core, langRust;
	try {
		core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
		langRust = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-rust/lang-rust.js");
	} catch (e) {
		return;
	}

	if(!core || !core.registerLanguage || !langRust) {
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
