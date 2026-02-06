/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-wast/register.js
type: application/javascript
module-type: startup

Register WebAssembly Text language with CodeMirror 6 core.

NAMING CONVENTION: The startup module name MUST follow the pattern "cm6-lang-*"
(e.g., "cm6-lang-wast"). This allows the TiddlyWiki language module to
dynamically discover and depend on all language modules, ensuring they are
loaded before TiddlyWiki so nested code highlighting works in code blocks.

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-wast";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

exports.startup = function() {
	var core, langWast;
	try {
		core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
		langWast = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-wast/lang-wast.js");
	} catch (e) {
		return;
	}

	if(!core || !core.registerLanguage || !langWast) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;

	core.registerLanguage(LanguageDescription.of({
		name: "WebAssembly",
		alias: ["wast", "wat", "webassembly"],
		extensions: ["wat", "wast"],
		support: langWast.wast()
	}));
};
