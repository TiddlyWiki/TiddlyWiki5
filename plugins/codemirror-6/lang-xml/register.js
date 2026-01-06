/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-xml/register.js
type: application/javascript
module-type: startup

Register XML language with CodeMirror 6 core.

NAMING CONVENTION: The startup module name MUST follow the pattern "cm6-lang-*"
(e.g., "cm6-lang-xml"). This allows the TiddlyWiki language module to
dynamically discover and depend on all language modules, ensuring they are
loaded before TiddlyWiki so nested code highlighting works in code blocks.

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "cm6-lang-xml";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

exports.startup = function() {
	var core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
	var langXml = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-xml/lang-xml.js");

	if (!core || !core.registerLanguage || !langXml) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;

	// Register XML
	core.registerLanguage(LanguageDescription.of({
		name: "XML",
		alias: ["xml"],
		extensions: ["xml", "xsl", "xsd", "svg"],
		support: langXml.xml()
	}));
};
