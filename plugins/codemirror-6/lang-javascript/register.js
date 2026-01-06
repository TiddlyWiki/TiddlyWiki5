/*\
title: $:/plugins/BurningTreeC/tiddlywiki-codemirror/plugins/lang-javascript/register.js
type: application/javascript
module-type: startup

Register JavaScript language with CodeMirror 6 core.

NAMING CONVENTION: The startup module name MUST follow the pattern "cm6-lang-*"
(e.g., "cm6-lang-javascript"). This allows the TiddlyWiki language module to
dynamically discover and depend on all language modules, ensuring they are
loaded before TiddlyWiki so nested code highlighting works in code blocks.

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "cm6-lang-javascript";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

exports.startup = function() {
	var core = require("$:/plugins/BurningTreeC/tiddlywiki-codemirror/lib/core.js");
	var langJs = require("$:/plugins/BurningTreeC/tiddlywiki-codemirror/plugins/lang-javascript/lang-javascript.js");

	if (!core || !core.registerLanguage || !langJs) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;

	// Register JavaScript
	core.registerLanguage(LanguageDescription.of({
		name: "JavaScript",
		alias: ["js", "ecmascript", "node", "mjs", "cjs"],
		extensions: ["js", "mjs", "cjs"],
		support: langJs.javascript()
	}));

	// Register JSX
	core.registerLanguage(LanguageDescription.of({
		name: "JSX",
		alias: ["jsx"],
		extensions: ["jsx"],
		support: langJs.javascript({ jsx: true })
	}));

	// Register TypeScript
	core.registerLanguage(LanguageDescription.of({
		name: "TypeScript",
		alias: ["ts", "typescript"],
		extensions: ["ts", "mts", "cts"],
		support: langJs.javascript({ typescript: true })
	}));

	// Register TSX
	core.registerLanguage(LanguageDescription.of({
		name: "TSX",
		alias: ["tsx"],
		extensions: ["tsx"],
		support: langJs.javascript({ jsx: true, typescript: true })
	}));
};
