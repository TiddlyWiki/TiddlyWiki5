/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-javascript/register.js
type: application/javascript
module-type: startup

Register JavaScript/TypeScript/JSX/TSX languages with CodeMirror 6 core for nested code blocks.

NAMING CONVENTION: The startup module name MUST follow the pattern "cm6-lang-*"
(e.g., "cm6-lang-javascript"). This allows the TiddlyWiki language module to
dynamically discover and depend on all language modules, ensuring they are
loaded before TiddlyWiki so nested code highlighting works in code blocks.

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-javascript";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

exports.startup = function() {
	var core, langJs;
	try {
		core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
		langJs = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-javascript/lang-javascript.js");
	} catch (e) {
		return;
	}

	if(!core || !core.registerLanguage || !langJs) {
		return;
	}

	// Prevent duplicate registration if startup runs multiple times
	if(core._jsLanguageRegistered) {
		return;
	}
	core._jsLanguageRegistered = true;

	var LanguageDescription = core.language.LanguageDescription;
	var LanguageSupport = core.language.LanguageSupport;

	// Get all language variants
	var javascriptLanguage = langJs.javascriptLanguage;
	var typescriptLanguage = langJs.typescriptLanguage;
	var jsxLanguage = langJs.jsxLanguage;
	var tsxLanguage = langJs.tsxLanguage;

	// Get snippets - use JavaScript snippets only (TypeScript snippets include TS-specific
	// completions like 'interface' that shouldn't appear in pure JavaScript)
	var snippets = langJs.snippets;

	// Get other exports
	var localCompletionSource = langJs.localCompletionSource;
	var scopeCompletionSource = langJs.scopeCompletionSource;
	var autoCloseTags = langJs.autoCloseTags;

	// Create a merged scope object with window globals and $tw for scope completion
	// This allows completing properties like "console.log", "$tw.wiki", etc.
	var mergedScope = {};
	if(typeof window !== "undefined") {
		Object.keys(window).forEach(function(key) {
			try {
				mergedScope[key] = window[key];
			} catch (e) {
				// Some properties may throw on access
			}
		});
	}
	if(typeof $tw !== "undefined") {
		mergedScope["$tw"] = $tw;
	}

	// Create scope completion source from the merged scope
	var scopeSource = scopeCompletionSource ? scopeCompletionSource(mergedScope) : null;

	// Node types where completions shouldn't appear
	var dontComplete = ["TemplateString", "String", "RegExp", "LineComment", "BlockComment", "VariableDefinition", "PropertyDefinition"];

	// Keywords (same for JS and TS)
	var keywords = "break case const continue default delete export extends false finally in instanceof let new return static super switch this throw true typeof var yield".split(" ").map(function(kw) {
		return {
			label: kw,
			type: "keyword"
		};
	});

	// Combine snippets (with apply functions for templates) and keywords
	var completions = snippets.concat(keywords);

	// Create completion source
	var snippetSource = core.autocomplete.ifNotIn(dontComplete, core.autocomplete.completeFromList(completions));

	// Combine snippets/keywords with local and scope completions
	var jsCompletionSource = function(context) {
		var allOptions = [];
		var from = context.pos;

		// Get snippet/keyword completions
		var snippetResult = snippetSource(context);
		if(snippetResult && snippetResult.options && snippetResult.options.length > 0) {
			allOptions = allOptions.concat(snippetResult.options);
			from = snippetResult.from;
		}

		// Get local completions (identifiers from the code)
		if(localCompletionSource) {
			var localResult = localCompletionSource(context);
			if(localResult && localResult.options && localResult.options.length > 0) {
				allOptions = allOptions.concat(localResult.options);
				if(localResult.from < from) {
					from = localResult.from;
				}
			}
		}

		// Get scope completions (window globals, $tw, and their properties)
		if(scopeSource) {
			var scopeResult = scopeSource(context);
			if(scopeResult && scopeResult.options && scopeResult.options.length > 0) {
				allOptions = allOptions.concat(scopeResult.options);
				if(scopeResult.from < from) {
					from = scopeResult.from;
				}
			}
		}

		if(allOptions.length > 0) {
			return {
				from: from,
				options: allOptions
			};
		}
		return null;
	};

	// Store completion source for use by plugin.js
	core.javascriptCompletionSource = jsCompletionSource;

	// Register for nested language completion in TiddlyWiki
	// Uses Language.isActiveAt() for detection
	core.registerNestedLanguageCompletion({
		name: "javascript",
		language: javascriptLanguage,
		source: jsCompletionSource
	});

	// Also register TypeScript (uses same completion source)
	core.registerNestedLanguageCompletion({
		name: "typescript",
		language: typescriptLanguage,
		source: jsCompletionSource
	});

	// Create LanguageSupport for each variant (without completions - they're added via the shared extension)
	var jsSupport = new LanguageSupport(javascriptLanguage);
	var tsSupport = new LanguageSupport(typescriptLanguage);
	var jsxSupport = new LanguageSupport(jsxLanguage, [autoCloseTags]);
	var tsxSupport = new LanguageSupport(tsxLanguage, [autoCloseTags]);

	// Store for use by other modules
	core.javascriptSupport = jsSupport;
	core.typescriptSupport = tsSupport;
	core.jsxSupport = jsxSupport;
	core.tsxSupport = tsxSupport;

	// Store sources for other modules that need them
	core.javascriptCompletionSources = {
		snippets: langJs.snippets,
		typescriptSnippets: langJs.typescriptSnippets,
		localCompletionSource: localCompletionSource,
		ifNotIn: core.autocomplete.ifNotIn,
		completeFromList: core.autocomplete.completeFromList
	};

	// Register all JS-family languages
	core.registerLanguage(LanguageDescription.of({
		name: "JavaScript",
		alias: ["js", "ecmascript", "node", "mjs", "cjs"],
		extensions: ["js", "mjs", "cjs"],
		support: jsSupport
	}));

	core.registerLanguage(LanguageDescription.of({
		name: "TypeScript",
		alias: ["ts", "typescript"],
		extensions: ["ts", "mts", "cts"],
		support: tsSupport
	}));

	core.registerLanguage(LanguageDescription.of({
		name: "JSX",
		alias: ["jsx"],
		extensions: ["jsx"],
		support: jsxSupport
	}));

	core.registerLanguage(LanguageDescription.of({
		name: "TSX",
		alias: ["tsx"],
		extensions: ["tsx"],
		support: tsxSupport
	}));
};
