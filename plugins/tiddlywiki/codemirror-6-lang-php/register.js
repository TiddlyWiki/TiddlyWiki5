/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-php/register.js
type: application/javascript
module-type: startup

Register PHP language with CodeMirror 6 core.

NAMING CONVENTION: The startup module name MUST follow the pattern "cm6-lang-*"
(e.g., "cm6-lang-php"). This allows the TiddlyWiki language module to
dynamically discover and depend on all language modules, ensuring they are
loaded before TiddlyWiki so nested code highlighting works in code blocks.

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-php";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

exports.startup = function() {
	var core, langPhp;
	try {
		core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
		langPhp = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-php/lang-php.js");
	} catch (e) {
		return;
	}

	if(!core || !core.registerLanguage || !langPhp) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;

	core.registerLanguage(LanguageDescription.of({
		name: "PHP",
		alias: ["php"],
		extensions: ["php", "phtml", "php3", "php4", "php5", "php7", "phps"],
		support: langPhp.php()
	}));
};
