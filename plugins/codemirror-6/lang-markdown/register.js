/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-markdown/register.js
type: application/javascript
module-type: startup

Register Markdown language with CodeMirror 6 core.

NAMING CONVENTION: The startup module name MUST follow the pattern "cm6-lang-*"
(e.g., "cm6-lang-markdown"). This allows the TiddlyWiki language module to
dynamically discover and depend on all language modules, ensuring they are
loaded before TiddlyWiki so nested code highlighting works in code blocks.

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-markdown";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

exports.startup = function() {
	var core, langMarkdown;
	try {
		core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
		langMarkdown = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-markdown/lang-markdown.js");
	} catch (e) {
		return;
	}

	if(!core || !core.registerLanguage || !langMarkdown) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;

	// Register Markdown
	core.registerLanguage(LanguageDescription.of({
		name: "Markdown",
		alias: ["markdown", "md"],
		extensions: ["md", "markdown", "mkd"],
		support: langMarkdown.markdown()
	}));
};
