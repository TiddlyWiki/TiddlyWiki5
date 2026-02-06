/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-html/register.js
type: application/javascript
module-type: startup

Register HTML language with CodeMirror 6 core for nested code blocks.

NAMING CONVENTION: The startup module name MUST follow the pattern "cm6-lang-*"
(e.g., "cm6-lang-html"). This allows the TiddlyWiki language module to
dynamically discover and depend on all language modules, ensuring they are
loaded before TiddlyWiki so nested code highlighting works in code blocks.

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-html";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

exports.startup = function() {
	var core, langHtml;
	try {
		core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
		langHtml = require("$:/plugins/tiddlywiki/codemirror-6/lib/codemirror-lang-html.js");
	} catch (e) {
		return;
	}

	if(!core || !core.registerLanguage || !langHtml) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;
	var LanguageSupport = core.language.LanguageSupport;

	var htmlLanguage = langHtml.htmlLanguage;
	var htmlCompletionSource = langHtml.htmlCompletionSource;
	var autoCloseTags = langHtml.autoCloseTags;

	// Create completion extension for HTML
	var htmlCompletionExt = htmlLanguage.data.of({
		autocomplete: htmlCompletionSource
	});
	htmlCompletionExt._twExtId = "HTML-" + Date.now();

	// Create LanguageSupport with autoCloseTags but without completions
	var htmlSupport = new LanguageSupport(htmlLanguage, [autoCloseTags]);

	// Store for use by other modules
	core.htmlSupport = htmlSupport;
	core.htmlCompletionExtension = htmlCompletionExt;
	core.htmlCompletionSource = htmlCompletionSource;

	// Register for nested language completion in TiddlyWiki
	// Uses Language.isActiveAt() for detection
	core.registerNestedLanguageCompletion({
		name: "html",
		language: htmlLanguage,
		source: htmlCompletionSource
	});

	// Register HTML
	core.registerLanguage(LanguageDescription.of({
		name: "HTML",
		alias: ["html", "htm", "xhtml"],
		extensions: ["html", "htm", "xhtml"],
		support: htmlSupport
	}));
};
