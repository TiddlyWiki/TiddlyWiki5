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
"use strict";

exports.name = "cm6-lang-xml";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

var SVG_COMPLETIONS_CONFIG = "$:/config/codemirror-6/lang-xml/svg-completions";

function isSvgCompletionsEnabled() {
	var value = $tw.wiki.getTiddlerText(SVG_COMPLETIONS_CONFIG, "yes").trim().toLowerCase();
	return value === "yes" || value === "true";
}

exports.startup = function() {
	var core, langXml, svgSchema;
	try {
		core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
		langXml = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-xml/lang-xml.js");
		svgSchema = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-xml/svg-schema.js");
	} catch (e) {
		return;
	}

	if(!core || !core.registerLanguage || !langXml) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;

	// Register generic XML (without SVG in extensions - SVG gets its own registration)
	core.registerLanguage(LanguageDescription.of({
		name: "XML",
		alias: ["xml"],
		extensions: ["xml", "xsl", "xsd"],
		support: langXml.xml()
	}));

	// Register SVG with schema-based completions if enabled
	var svgSupport;
	if(isSvgCompletionsEnabled()) {
		svgSupport = langXml.xml({
			elements: svgSchema.svgElements,
			attributes: svgSchema.svgAttributes
		});
	} else {
		svgSupport = langXml.xml();
	}

	core.registerLanguage(LanguageDescription.of({
		name: "SVG",
		alias: ["svg", "image/svg+xml"],
		extensions: ["svg"],
		support: svgSupport
	}));
};
