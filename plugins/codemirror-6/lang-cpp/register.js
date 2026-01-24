/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-cpp/register.js
type: application/javascript
module-type: startup

Register C/C++ language with CodeMirror 6 core.

NAMING CONVENTION: The startup module name MUST follow the pattern "cm6-lang-*"
(e.g., "cm6-lang-cpp"). This allows the TiddlyWiki language module to
dynamically discover and depend on all language modules, ensuring they are
loaded before TiddlyWiki so nested code highlighting works in code blocks.

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-cpp";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

exports.startup = function() {
	var core, langCpp;
	try {
		core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
		langCpp = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-cpp/lang-cpp.js");
	} catch (e) {
		return;
	}

	if(!core || !core.registerLanguage || !langCpp) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;

	// Register C
	core.registerLanguage(LanguageDescription.of({
		name: "C",
		alias: ["c"],
		extensions: ["c", "h"],
		support: langCpp.cpp()
	}));

	// Register C++
	core.registerLanguage(LanguageDescription.of({
		name: "C++",
		alias: ["cpp", "c++", "cxx"],
		extensions: ["cpp", "cc", "cxx", "hpp", "hh", "hxx", "h++"],
		support: langCpp.cpp()
	}));
};
