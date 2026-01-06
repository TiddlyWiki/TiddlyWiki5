/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lint.js
type: application/javascript
module-type: codemirror6-plugin

TiddlyWiki Lint Plugin - highlights potential issues in wikitext.

Checks for:
- Links to missing tiddlers
- Undefined macros/procedures/functions
- Unknown widgets
- Unclosed brackets and formatting
- Filter syntax issues
- Unclosed widgets and code blocks
- Pragma issues

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Load the bundled lint library
var lintLib = null;
try {
	lintLib = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lint/codemirror-lint.js");
} catch (e) {
	// Lint library not available
}

var _syntaxTree = null;
var _linter = lintLib ? lintLib.linter : null;
var _lintGutter = lintLib ? lintLib.lintGutter : null;
var _lintKeymap = lintLib ? lintLib.lintKeymap : null;
var _forceLinting = lintLib ? lintLib.forceLinting : null;
var _Compartment = null;

// ============================================================================
// Configuration
// ============================================================================

/**
 * Check if a specific lint rule is enabled
 * @param {string} ruleName - The rule name
 * @param {object} wiki - The wiki object (defaults to $tw.wiki)
 */
function isRuleEnabled(ruleName, wiki) {
	wiki = wiki || $tw.wiki;
	if(!wiki) return true;
	var config = (wiki.getTiddlerText("$:/config/codemirror-6/lint/" + ruleName, "yes") || "").trim();
	return config === "yes";
}

/**
 * Check if CamelCase wikilinks are enabled
 * @param {object} wiki - The wiki object (defaults to $tw.wiki)
 */
function isCamelCaseEnabled(wiki) {
	wiki = wiki || $tw.wiki;
	if(!wiki) return true;
	var config = wiki.getTiddlerText("$:/config/WikiParserRules/Inline/wikilink", "enable");
	return config !== "disable";
}

// ============================================================================
// Built-in Variables (never flagged as undefined)
// ============================================================================

var builtInVariables = new Set([
	"currentTiddler",
	"storyTiddler",
	"transclusion",
]);

// ============================================================================
// Tiddler Existence Checking
// ============================================================================

/**
 * Check if a tiddler exists (including shadows)
 * @param {string} title - The tiddler title
 * @param {object} wiki - The wiki object (defaults to $tw.wiki)
 */
function tiddlerExists(title, wiki) {
	wiki = wiki || $tw.wiki;
	if(!wiki) return true;
	return wiki.tiddlerExists(title) || wiki.isShadowTiddler(title);
}

// ============================================================================
// Macro/Procedure/Function Checking
// ============================================================================

var _knownDefinitions = null;
var _definitionsCacheTime = 0;
var CACHE_DURATION = 5000; // 5 seconds

/**
 * Get all known macro/procedure/function/widget definitions
 */
function getKnownDefinitions() {
	var now = Date.now();
	if(_knownDefinitions && (now - _definitionsCacheTime) < CACHE_DURATION) {
		// Only use cache if it has some widgets (meaning TW was initialized)
		if(_knownDefinitions.widgets.size > 0) {
			return _knownDefinitions;
		}
	}

	var definitions = {
		macros: new Set(),
		procedures: new Set(),
		functions: new Set(),
		widgets: new Set()
	};

	if(!$tw) return definitions;

	// Built-in JavaScript macros
	if($tw.macros) {
		Object.keys($tw.macros).forEach(function(name) {
			definitions.macros.add(name);
		});
	}

	// Core widgets from $tw.widgets
	if($tw.widgets) {
		Object.keys($tw.widgets).forEach(function(name) {
			// Widgets in $tw.widgets are stored without the $ prefix
			definitions.widgets.add("$" + name);
		});
	}

	// Also check widget modules using TiddlyWiki's module API
	if($tw.modules && $tw.modules.forEachModuleOfType) {
		$tw.modules.forEachModuleOfType("widget", function(title, moduleExports) {
			if(moduleExports) {
				Object.keys(moduleExports).forEach(function(exportName) {
					if(exportName && typeof exportName === "string") {
						// Widgets are exported without $ prefix, add it
						definitions.widgets.add("$" + exportName);
					}
				});
			}
		});
	}

	// Scan tiddlers for definitions
	if($tw.wiki) {
		var tiddlers = $tw.wiki.filterTiddlers("[all[tiddlers+shadows]has[text]]");
		tiddlers.forEach(function(title) {
			var tiddler = $tw.wiki.getTiddler(title);
			if(!tiddler) {
				// Try shadow
				if($tw.wiki.isShadowTiddler(title)) {
					var pluginTitle = $tw.wiki.getShadowSource(title);
					if(pluginTitle) {
						var pluginInfo = $tw.wiki.getPluginInfo(pluginTitle);
						if(pluginInfo && pluginInfo.tiddlers && pluginInfo.tiddlers[title]) {
							tiddler = new $tw.Tiddler(pluginInfo.tiddlers[title]);
						}
					}
				}
			}
			if(!tiddler || !tiddler.fields.text) return;

			var text = tiddler.fields.text;

			// Match \define
			var defineMatches = text.matchAll(/\\define\s+([^\s(]+)/g);
			for(var match of defineMatches) {
				definitions.macros.add(match[1]);
			}

			// Match \procedure
			var procMatches = text.matchAll(/\\procedure\s+([^\s(]+)/g);
			for(var match of procMatches) {
				definitions.procedures.add(match[1]);
			}

			// Match \function
			var funcMatches = text.matchAll(/\\function\s+([^\s(]+)/g);
			for(var match of funcMatches) {
				definitions.functions.add(match[1]);
			}

			// Match \widget
			var widgetMatches = text.matchAll(/\\widget\s+([^\s(]+)/g);
			for(var match of widgetMatches) {
				definitions.widgets.add(match[1]);
			}
		});
	}

	_knownDefinitions = definitions;
	_definitionsCacheTime = now;
	return definitions;
}

/**
 * Check if a macro/procedure/function is defined
 */
function isDefinitionKnown(name, type) {
	var defs = getKnownDefinitions();

	// Check all types since <<name>> can call any of them
	if(type === "macro" || type === "any") {
		if(defs.macros.has(name) || defs.procedures.has(name) || defs.functions.has(name)) {
			return true;
		}
	}

	if(type === "widget") {
		// Normalize widget name and check both with and without $ prefix
		var withDollar = name.startsWith("$") ? name : "$" + name;
		var withoutDollar = name.startsWith("$") ? name.substring(1) : name;
		return defs.widgets.has(name) || defs.widgets.has(withDollar) || defs.widgets.has(withoutDollar);
	}

	return false;
}

// ============================================================================
// Extract Local Definitions from Current Document
// ============================================================================

/**
 * Extract definitions from document text (simple version for quick lookups)
 */
function extractLocalDefinitions(text) {
	var definitions = {
		macros: new Set(),
		procedures: new Set(),
		functions: new Set(),
		widgets: new Set(),
		variables: new Set() // Variables defined with <$set>, <$let>, <$vars>
	};

	// Match \define (supports indented pragmas)
	var defineMatches = text.matchAll(/\\define\s+([^\s(]+)/g);
	for(var match of defineMatches) {
		definitions.macros.add(match[1].trim());
	}

	// Match \procedure (supports indented pragmas)
	var procMatches = text.matchAll(/\\procedure\s+([^\s(]+)/g);
	for(var match of procMatches) {
		definitions.procedures.add(match[1].trim());
	}

	// Match \function (supports indented pragmas)
	var funcMatches = text.matchAll(/\\function\s+([^\s(]+)/g);
	for(var match of funcMatches) {
		definitions.functions.add(match[1].trim());
	}

	// Match \widget (supports indented pragmas)
	var widgetMatches = text.matchAll(/\\widget\s+([^\s(]+)/g);
	for(var match of widgetMatches) {
		definitions.widgets.add(match[1].trim());
	}

	// Match <$set name="varName">, <$setvariable name="varName">, <$qualify name="varName"> - extract name attribute
	var setMatches = text.matchAll(/<\$(?:set|setvariable|qualify)\s+[^>]*name\s*=\s*["']([^"']+)["']/gi);
	for(var match of setMatches) {
		if(match[1]) definitions.variables.add(match[1]);
	}

	// Match <$let varName="value"> - all attributes are variables
	var letMatches = text.matchAll(/<\$let\s+([^>]+)>/gi);
	for(var match of letMatches) {
		var attrs = match[1];
		var attrMatches = attrs.matchAll(/([a-zA-Z_][\w-]*)\s*=/g);
		for(var attrMatch of attrMatches) {
			definitions.variables.add(attrMatch[1]);
		}
	}

	// Match <$vars varName="value"> - all attributes are variables
	var varsMatches = text.matchAll(/<\$vars\s+([^>]+)>/gi);
	for(var match of varsMatches) {
		var attrs = match[1];
		var attrMatches = attrs.matchAll(/([a-zA-Z_][\w-]*)\s*=/g);
		for(var attrMatch of attrMatches) {
			definitions.variables.add(attrMatch[1]);
		}
	}

	// Match <$list variable="item" counter="idx"> - extract variable and counter
	var listMatches = text.matchAll(/<\$list\s+[^>]*(?:variable|counter)\s*=\s*["']([^"']+)["']/gi);
	for(var match of listMatches) {
		if(match[1]) definitions.variables.add(match[1]);
	}

	// Match <$range variable="i"> - extract variable attribute
	var rangeMatches = text.matchAll(/<\$range\s+[^>]*variable\s*=\s*["']([^"']+)["']/gi);
	for(var match of rangeMatches) {
		if(match[1]) definitions.variables.add(match[1]);
	}

	// Match <$wikify name="html"> - extract name attribute
	var wikifyMatches = text.matchAll(/<\$wikify\s+[^>]*name\s*=\s*["']([^"']+)["']/gi);
	for(var match of wikifyMatches) {
		if(match[1]) definitions.variables.add(match[1]);
	}

	// Match <$parameters> which defines parameter variables
	var paramWidgetMatches = text.matchAll(/<\$parameters\s+([^>\/]+)/gi);
	for(var match of paramWidgetMatches) {
		var attrs = match[1];
		var attrMatches = attrs.matchAll(/([a-zA-Z_][\w-]*)\s*=/g);
		for(var attrMatch of attrMatches) {
			definitions.variables.add(attrMatch[1]);
		}
	}

	// Match \parameters(param1:"default" param2) pragma - extracts parameter names
	var paramsPragmaMatches = text.matchAll(/\\parameters\s*\(([^)]*)\)/g);
	for(var match of paramsPragmaMatches) {
		var paramsStr = match[1];
		// Parameters can be: name, name:"default", name:<<macro>>
		var paramMatches = paramsStr.matchAll(/([a-zA-Z][a-zA-Z0-9_-]*)/g);
		for(var paramMatch of paramMatches) {
			definitions.variables.add(paramMatch[1]);
		}
	}

	// Extract parameter names from procedure/function/macro definitions
	// \procedure name(param1, param2:"default")
	var defWithParamsMatches = text.matchAll(/\\(?:define|procedure|function|widget)\s+[^\s(]+\s*\(([^)]*)\)/g);
	for(var match of defWithParamsMatches) {
		var paramsStr = match[1];
		if(paramsStr) {
			// Parameters are comma or space separated, may have defaults
			var paramMatches = paramsStr.matchAll(/([a-zA-Z][a-zA-Z0-9_-]*)/g);
			for(var paramMatch of paramMatches) {
				definitions.variables.add(paramMatch[1]);
			}
		}
	}

	return definitions;
}

/**
 * Extract definitions with position information for advanced checks
 */
function extractLocalDefinitionsWithPositions(text) {
	var definitions = [];

	// Match \define, \procedure, \function, \widget with positions
	var pragmaRe = /\\(define|procedure|function|widget)\s+([^\s(]+)(\([^)]*\))?/g;
	var match;
	while((match = pragmaRe.exec(text)) !== null) {
		var type = match[1];
		var name = match[2];
		var nameStart = match.index + match[0].indexOf(name);
		definitions.push({
			type: type,
			name: name,
			from: match.index,
			to: match.index + match[0].length,
			nameFrom: nameStart,
			nameTo: nameStart + name.length
		});
	}

	return definitions;
}

/**
 * Find all usages of macros/procedures/functions in text
 */
function findDefinitionUsages(text) {
	var usages = new Set();

	// Macro calls <<name ...>>
	var macroCallRe = /<<\s*([^\s>]+)/g;
	var match;
	while((match = macroCallRe.exec(text)) !== null) {
		usages.add(match[1]);
	}

	// Transclusion macro calls {{...||template}}
	var transclusionRe = /\{\{[^|{}]*\|\|([^}]+)\}\}/g;
	while((match = transclusionRe.exec(text)) !== null) {
		usages.add(match[1]);
	}

	// Function calls in filters [function[name]]
	var filterFuncRe = /\[function\[([^\]]+)\]/g;
	while((match = filterFuncRe.exec(text)) !== null) {
		usages.add(match[1]);
	}

	// Variable references in filters <name>
	var filterVarRe = /<([a-zA-Z][a-zA-Z0-9_-]*)>/g;
	while((match = filterVarRe.exec(text)) !== null) {
		usages.add(match[1]);
	}

	return usages;
}

/**
 * Find duplicate definitions (same name defined multiple times)
 */
function findDuplicateDefinitions(definitions) {
	var issues = [];
	var seen = {};

	definitions.forEach(function(def) {
		var key = def.name;
		if(seen[key]) {
			issues.push({
				from: def.nameFrom,
				to: def.nameTo,
				message: "Duplicate definition: '" + def.name + "' is already defined as \\" + seen[key].type + " on line " + seen[key].line,
				name: def.name,
				firstDef: seen[key]
			});
		} else {
			seen[key] = def;
		}
	});

	return issues;
}

/**
 * Find unused local definitions
 */
function findUnusedDefinitions(definitions, usages) {
	var issues = [];

	definitions.forEach(function(def) {
		if(!usages.has(def.name)) {
			issues.push({
				from: def.nameFrom,
				to: def.nameTo,
				message: "Unused " + def.type + ": '" + def.name + "' is defined but never used in this tiddler",
				name: def.name,
				type: def.type,
				defFrom: def.from,
				defTo: def.to
			});
		}
	});

	return issues;
}

// ============================================================================
// Known Filter Operators
// ============================================================================

var _knownFilterOperators = null;

/**
 * Get known filter operators from TiddlyWiki
 */
function getKnownFilterOperators() {
	if(_knownFilterOperators) return _knownFilterOperators;

	var operators = new Set();

	if($tw && $tw.wiki && $tw.wiki.filterOperators) {
		Object.keys($tw.wiki.filterOperators).forEach(function(name) {
			operators.add(name);
		});
	}

	// Also add common operators as fallback
	var commonOps = [
		"title", "field", "has", "tag", "tags", "tagging",
		"is", "all", "filter", "subfilter", "function",
		"each", "eachday", "sort", "sortcs", "nsort", "reverse",
		"first", "last", "nth", "rest", "butfirst", "butlast",
		"count", "sum", "average", "min", "max", "minall", "maxall",
		"limit", "skip", "range", "list", "listed",
		"links", "backlinks", "transcludes",
		"search", "regexp", "prefix", "suffix", "contains", "match",
		"get", "getindex", "getvariable", "lookup", "index", "indexes",
		"add", "subtract", "multiply", "divide", "remainder", "negate", "abs", "ceil", "floor", "round",
		"addprefix", "addsuffix", "removeprefix", "removesuffix",
		"split", "join", "splitregexp", "trim", "lowercase", "uppercase", "titlecase", "sentencecase",
		"length", "charcode", "fromcharcode", "encodeuri", "decodeuri", "encodeuricomponent", "decodeuricomponent",
		"stringify", "jsonstringify", "jsonparse", "jsonget", "jsontype", "jsonindexes", "jsonextract",
		"format", "substitute",
		"else", "then", "compare", "log",
		"enlist", "enlist-input",
		"shadow", "shadowsource", "moduletypes", "modules", "plugintiddlers",
		"commands", "variables", "widgetclass"
	];
	commonOps.forEach(function(op) {
		operators.add(op);
	});

	_knownFilterOperators = operators;
	return operators;
}

// ============================================================================
// Known Tags
// ============================================================================

var _knownTags = null;
var _tagsCacheTime = 0;
var TAG_CACHE_DURATION = 5000; // 5 seconds

/**
 * Get known tags from TiddlyWiki using [all[tiddlers+shadows]is[tag]] filter
 */
function getKnownTags() {
	var now = Date.now();
	if(_knownTags && (now - _tagsCacheTime) < TAG_CACHE_DURATION) {
		return _knownTags;
	}

	var tags = new Set();

	if($tw && $tw.wiki) {
		try {
			var tagList = $tw.wiki.filterTiddlers("[all[tiddlers+shadows]is[tag]]");
			if(tagList && Array.isArray(tagList)) {
				tagList.forEach(function(tag) {
					tags.add(tag);
				});
			}
		} catch (e) {
			// Ignore errors
		}
	}

	_knownTags = tags;
	_tagsCacheTime = now;
	return tags;
}

/**
 * Check if a tag exists
 */
function tagExists(tagName) {
	if(!$tw || !$tw.wiki) return true; // Assume exists if we can't check
	var knownTags = getKnownTags();
	return knownTags.has(tagName);
}

/**
 * Find invalid tag references in filter expressions
 * Looks for tag[...] and tagging[...] operators with non-existent tags
 */
function findInvalidTagReferences(tree, state) {
	var issues = [];

	tree.iterate({
		enter: function(node) {
			// Look for FilterOperator nodes
			if(node.type.name === "FilterOperator") {
				var text = state.doc.sliceString(node.from, node.to);

				// Match tag[...] or tagging[...] patterns
				// Handles: tag[TagName], !tag[TagName], tag:suffix[TagName]
				var tagMatch = text.match(/^(!?)tag(?::[^\[]*)?(\[[^\]]+\])/);
				var taggingMatch = text.match(/^(!?)tagging(?::[^\[]*)?(\[[^\]]+\])/);

				var match = tagMatch || taggingMatch;
				if(match) {
					var operatorName = tagMatch ? "tag" : "tagging";
					var bracketPart = match[2]; // e.g., [TagName]
					var tagName = bracketPart.slice(1, -1); // Remove [ and ]

					// Skip if empty, variable reference, or text reference
					if(!tagName || tagName.startsWith("<") || tagName.startsWith("{")) {
						return;
					}

					// Check if tag exists
					if(!tagExists(tagName)) {
						// Calculate position of the tag name within the operator
						var bracketStart = text.indexOf("[");
						var tagFrom = node.from + bracketStart + 1;
						var tagTo = tagFrom + tagName.length;

						issues.push({
							from: tagFrom,
							to: tagTo,
							tagName: tagName,
							operatorName: operatorName
						});
					}
				}
			}
		}
	});

	return issues;
}

// ============================================================================
// Bracket Matching Helpers
// ============================================================================

/**
 * Check for unmatched brackets in text
 * Returns array of {pos, char, type} for unmatched brackets
 */
function findUnmatchedBrackets(text, openSeq, closeSeq, startPos) {
	var unmatched = [];
	var stack = [];
	var i = 0;
	var openLen = openSeq.length;
	var closeLen = closeSeq.length;

	while(i < text.length) {
		if(text.substring(i, i + openLen) === openSeq) {
			stack.push({
				pos: startPos + i,
				char: openSeq
			});
			i += openLen;
		} else if(text.substring(i, i + closeLen) === closeSeq) {
			if(stack.length > 0) {
				stack.pop();
			} else {
				unmatched.push({
					pos: startPos + i,
					char: closeSeq,
					type: "unexpected"
				});
			}
			i += closeLen;
		} else {
			i++;
		}
	}

	// Remaining in stack are unclosed
	stack.forEach(function(item) {
		unmatched.push({
			pos: item.pos,
			char: item.char,
			type: "unclosed"
		});
	});

	return unmatched;
}

/**
 * Check filter expression for balanced brackets
 */
function checkFilterBrackets(text, startPos) {
	var issues = [];
	var squareStack = [];
	var curlyStack = [];
	var angleStack = [];
	var i = 0;

	while(i < text.length) {
		var char = text[i];
		var nextChar = text[i + 1] || "";

		// Skip quoted strings
		if(char === '"') {
			i++;
			while(i < text.length && text[i] !== '"') {
				if(text[i] === '\\') i++;
				i++;
			}
			i++;
			continue;
		}
		if(char === "'") {
			i++;
			while(i < text.length && text[i] !== "'") {
				if(text[i] === '\\') i++;
				i++;
			}
			i++;
			continue;
		}

		// Check brackets
		if(char === '[') {
			squareStack.push(startPos + i);
		} else if(char === ']') {
			if(squareStack.length > 0) {
				squareStack.pop();
			} else {
				issues.push({
					pos: startPos + i,
					message: "Unexpected ']' in filter"
				});
			}
		} else if(char === '{') {
			curlyStack.push(startPos + i);
		} else if(char === '}') {
			if(curlyStack.length > 0) {
				curlyStack.pop();
			} else {
				issues.push({
					pos: startPos + i,
					message: "Unexpected '}' in filter"
				});
			}
		} else if(char === '<' && nextChar !== '%' && nextChar !== '!' && nextChar !== '/') {
			// < for variables, but not <% or <!-- or </
			angleStack.push(startPos + i);
		} else if(char === '>' && text[i - 1] !== '%' && text[i - 1] !== '-') {
			// > closing variable, but not %> or ->
			if(angleStack.length > 0) {
				angleStack.pop();
			}
			// Don't report unmatched > as it could be comparison operator
		}

		i++;
	}

	// Report unclosed brackets
	squareStack.forEach(function(pos) {
		issues.push({
			pos: pos,
			message: "Unclosed '[' in filter"
		});
	});
	curlyStack.forEach(function(pos) {
		issues.push({
			pos: pos,
			message: "Unclosed '{' in filter text reference"
		});
	});
	angleStack.forEach(function(pos) {
		issues.push({
			pos: pos,
			message: "Unclosed '<' in filter variable"
		});
	});

	return issues;
}

// ============================================================================
// Widget Matching
// ============================================================================

/**
 * Find the best insertion position for a closing tag
 * Priority: 1) next empty line, 2) before next tag, 3) container limit, 4) document end
 */
function findBestInsertPosition(state, afterPos, containerLimit, allTagPositions) {
	var docLength = state.doc.length;
	var limit = typeof containerLimit === "number" ? containerLimit : docLength;

	// 1. Look for next empty line after the opening tag
	var lineAfter = state.doc.lineAt(afterPos);
	for(var lineNum = lineAfter.number + 1; lineNum <= state.doc.lines; lineNum++) {
		var line = state.doc.line(lineNum);
		if(line.from >= limit) break;
		if(line.text.trim() === "") {
			// Found empty line - insert at start of this line
			return {
				pos: line.from,
				type: "emptyLine"
			};
		}
	}

	// 2. Look for next tag after the opening tag but before limit
	var nextTagPos = null;
	for(var i = 0; i < allTagPositions.length; i++) {
		var tagPos = allTagPositions[i];
		if(tagPos > afterPos && tagPos < limit) {
			if(nextTagPos === null || tagPos < nextTagPos) {
				nextTagPos = tagPos;
			}
		}
	}
	if(nextTagPos !== null) {
		return {
			pos: nextTagPos,
			type: "beforeTag"
		};
	}

	// 3. Use container limit if available
	if(typeof containerLimit === "number" && containerLimit < docLength) {
		return {
			pos: containerLimit,
			type: "containerEnd"
		};
	}

	// 4. Fall back to document end
	return {
		pos: docLength,
		type: "docEnd"
	};
}

/**
 * Find unclosed widgets and HTML tags in the syntax tree
 */
function findUnclosedWidgets(tree, state) {
	var issues = [];
	var widgetStack = [];
	var htmlStack = [];
	var orphanClosingTags = []; // Track closing tags without matching opening tags
	var containerStack = []; // Track containing structures (pragmas, widgets, conditionals)
	var allTagPositions = []; // Collect all tag start positions for insertion logic

	tree.iterate({
		enter: function(node) {
			var nodeType = node.type.name;

			// Collect tag positions for insertion logic
			if(nodeType === "Widget" || nodeType === "InlineWidget" ||
				nodeType === "WidgetEnd" || nodeType === "HTMLBlock" || nodeType === "HTMLTag") {
				allTagPositions.push(node.from);
			}

			// Track containing structures
			if(nodeType === "MacroDefinition" || nodeType === "ProcedureDefinition" ||
				nodeType === "FunctionDefinition" || nodeType === "WidgetDefinition" ||
				nodeType === "Widget" || nodeType === "InlineWidget" ||
				nodeType === "HTMLBlock" || nodeType === "HTMLTag" ||
				nodeType === "ConditionalBlock") {
				// For pragma definitions, find where to insert (before PragmaEnd)
				var insertBefore = node.to;
				if(nodeType.endsWith("Definition")) {
					// Look for PragmaEnd child
					var cursor = node.node.cursor();
					if(cursor.firstChild()) {
						do {
							if(cursor.name === "PragmaEnd") {
								insertBefore = cursor.from;
								break;
							}
						} while(cursor.nextSibling());
					}
				} else if(nodeType === "ConditionalBlock") {
					// Look for the closing <%endif%>
					var text = state.doc.sliceString(node.from, node.to);
					var endifMatch = text.match(/<%\s*endif\s*%>/);
					if(endifMatch) {
						insertBefore = node.from + endifMatch.index;
					}
				}
				containerStack.push({
					type: nodeType,
					from: node.from,
					to: node.to,
					insertBefore: insertBefore
				});
			}

			// Opening HTML tag (non-self-closing)
			if(nodeType === "HTMLBlock" || nodeType === "HTMLTag") {
				var tagText = state.doc.sliceString(node.from, node.to);
				// Check if it's a closing tag or self-closing
				if(!tagText.startsWith("</") && !/>\/\s*$/.test(tagText) && !/\/>\s*$/.test(tagText)) {
					// Extract tag name
					var tagMatch = tagText.match(/^<([a-zA-Z][a-zA-Z0-9]*)/);
					if(tagMatch) {
						var tagName = tagMatch[1].toLowerCase();
						// Skip void elements that don't need closing
						var voidElements = ["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"];
						if(voidElements.indexOf(tagName) === -1) {
							// Check if the tag contains its own closing tag
							// This happens when the parser successfully matched opening and closing tags
							var closePattern = new RegExp("</" + tagName + ">\\s*$", "i");
							if(closePattern.test(tagText)) {
								// Self-contained tag with matching closing tag - skip
								return;
							}
							// Find containing structure for limit
							var containerLimit = null;
							var containerType = null;
							for(var c = containerStack.length - 1; c >= 0; c--) {
								if(containerStack[c].from !== node.from) {
									containerLimit = containerStack[c].insertBefore;
									containerType = containerStack[c].type;
									break;
								}
							}
							htmlStack.push({
								name: tagName,
								from: node.from,
								to: node.to,
								closed: false,
								containerLimit: containerLimit,
								containerType: containerType
							});
						}
					}
				}
			}

			// Closing HTML tag
			if((nodeType === "HTMLBlock" || nodeType === "HTMLTag")) {
				var tagText = state.doc.sliceString(node.from, node.to);
				var closeMatch = tagText.match(/^<\/([a-zA-Z][a-zA-Z0-9]*)>/);
				if(closeMatch) {
					var closeName = closeMatch[1].toLowerCase();
					var foundMatch = false;
					for(var i = htmlStack.length - 1; i >= 0; i--) {
						if(htmlStack[i].name === closeName && !htmlStack[i].closed) {
							htmlStack[i].closed = true;
							foundMatch = true;
							break;
						}
					}
					// Track orphan closing tag (no matching opening tag)
					if(!foundMatch) {
						orphanClosingTags.push({
							name: closeName,
							from: node.from,
							to: node.to,
							isHTML: true
						});
					}
				}
			}

			// Opening widget tag
			if(nodeType === "Widget" || nodeType === "InlineWidget") {
				// Find the widget name
				var nameNode = null;
				var cursor = node.node.cursor();
				if(cursor.firstChild()) {
					do {
						if(cursor.name === "WidgetName") {
							nameNode = cursor.node;
							break;
						}
					} while(cursor.nextSibling());
				}

				if(nameNode) {
					var widgetName = state.doc.sliceString(nameNode.from, nameNode.to);
					// Check if it's self-closing
					var tagText = state.doc.sliceString(node.from, node.to);
					var isSelfClosing = /\/>\s*$/.test(tagText);

					if(!isSelfClosing) {
						// Find the containing structure (skip self - look at parent)
						var containerLimit = null;
						var containerType = null;
						for(var c = containerStack.length - 2; c >= 0; c--) {
							containerLimit = containerStack[c].insertBefore;
							containerType = containerStack[c].type;
							break;
						}

						widgetStack.push({
							name: widgetName,
							from: node.from,
							to: node.to,
							closed: false,
							containerLimit: containerLimit,
							containerType: containerType
						});
					}
				}
			}

			// Closing widget tag
			if(nodeType === "WidgetEnd") {
				var closeText = state.doc.sliceString(node.from, node.to);
				var closeMatch = closeText.match(/<\/(\$[\w\-\.]+)>/);
				if(closeMatch) {
					var closeName = closeMatch[1];
					var foundMatch = false;
					// Find matching open tag (search from end)
					for(var i = widgetStack.length - 1; i >= 0; i--) {
						if(widgetStack[i].name === closeName && !widgetStack[i].closed) {
							widgetStack[i].closed = true;
							foundMatch = true;
							break;
						}
					}
					// Track orphan closing tag (no matching opening widget)
					if(!foundMatch) {
						orphanClosingTags.push({
							name: closeName,
							from: node.from,
							to: node.to,
							isWidget: true
						});
					}
				}
			}
		},
		leave: function(node) {
			var nodeType = node.type.name;
			// Pop from container stack when leaving
			if(nodeType === "MacroDefinition" || nodeType === "ProcedureDefinition" ||
				nodeType === "FunctionDefinition" || nodeType === "WidgetDefinition" ||
				nodeType === "Widget" || nodeType === "InlineWidget" ||
				nodeType === "HTMLBlock" || nodeType === "HTMLTag" ||
				nodeType === "ConditionalBlock") {
				containerStack.pop();
			}
		}
	});

	// Report unclosed widgets with smart insertion positions
	widgetStack.forEach(function(widget) {
		if(!widget.closed) {
			var insertInfo = findBestInsertPosition(state, widget.to, widget.containerLimit, allTagPositions);
			issues.push({
				from: widget.from,
				to: widget.to,
				message: "Unclosed widget: " + widget.name,
				name: widget.name,
				insertAt: insertInfo.pos,
				insertType: insertInfo.type,
				containerType: widget.containerType,
				isWidget: true
			});
		}
	});

	// Report unclosed HTML tags with smart insertion positions
	htmlStack.forEach(function(tag) {
		if(!tag.closed) {
			var insertInfo = findBestInsertPosition(state, tag.to, tag.containerLimit, allTagPositions);
			issues.push({
				from: tag.from,
				to: tag.to,
				message: "Unclosed HTML tag: <" + tag.name + ">",
				name: tag.name,
				insertAt: insertInfo.pos,
				insertType: insertInfo.type,
				containerType: tag.containerType,
				isHTML: true
			});
		}
	});

	// Report orphan closing tags (closing tags without matching opening tags)
	orphanClosingTags.forEach(function(tag) {
		if(tag.isWidget) {
			issues.push({
				from: tag.from,
				to: tag.to,
				message: "Unexpected closing tag: </" + tag.name + "> has no matching opening tag",
				name: tag.name,
				isOrphanClose: true,
				isWidget: true
			});
		} else if(tag.isHTML) {
			issues.push({
				from: tag.from,
				to: tag.to,
				message: "Unexpected closing tag: </" + tag.name + "> has no matching opening tag",
				name: tag.name,
				isOrphanClose: true,
				isHTML: true
			});
		}
	});

	return issues;
}

// ============================================================================
// Pragma Matching
// ============================================================================

/**
 * Find unclosed pragma definitions and ambiguous \end statements
 *
 * Single-line pragmas like `\define foo() content` don't need \end
 * Multi-line pragmas (where content is on following lines) need \end
 * Warns when \end without a name is used with multiple open pragmas (ambiguous)
 */
function findUnclosedPragmas(text, startPos) {
	var issues = [];
	var pragmaStack = [];
	var lines = text.split("\n");
	var pos = startPos;

	for(var i = 0; i < lines.length; i++) {
		var line = lines[i];
		var trimmed = line.trim();

		// Match opening pragmas: \define, \procedure, \function, \widget
		// Pattern: \keyword name(params) [optional inline content]
		var openMatch = trimmed.match(/^\\(define|procedure|function|widget)\s+([^\s(]+)(\([^)]*\))?(.*)$/);
		if(openMatch) {
			var pragmaType = openMatch[1];
			var pragmaName = openMatch[2];
			var params = openMatch[3] || "";
			var afterParams = openMatch[4] || "";

			// Single-line definition: has non-whitespace content after the params on the same line
			// Example: \define foo() some content here
			// Multi-line definition: nothing after params, or only whitespace
			// Example: \define foo()
			//          content here
			//          \end
			var isSingleLine = afterParams.trim().length > 0;

			if(!isSingleLine) {
				// Multi-line pragma needs \end
				pragmaStack.push({
					type: pragmaType,
					name: pragmaName,
					pos: pos,
					lineEnd: pos + line.length
				});
			}
			// Single-line pragmas don't need \end, so we don't push them to the stack
		}

		// Match closing pragmas
		var closeMatch = trimmed.match(/^\\end\s*(\S*)/);
		if(closeMatch) {
			var endName = closeMatch[1];
			var endPos = pos + line.indexOf("\\end");
			var endLength = closeMatch[0].length;

			if(!endName && pragmaStack.length > 0) {
				// Bare \end - suggest using named form for clarity
				var suggestedName = pragmaStack[pragmaStack.length - 1].name;
				if(pragmaStack.length > 1) {
					// Ambiguous: multiple pragmas open
					var openNames = pragmaStack.map(function(p) {
						return p.name;
					}).join(", ");
					issues.push({
						from: endPos,
						to: endPos + endLength,
						message: "Ambiguous \\end: multiple pragmas open (" + openNames + "). Use \\end " + suggestedName + " to be explicit.",
						suggestedName: suggestedName
					});
				} else {
					// Single pragma open - hint to use named form
					issues.push({
						from: endPos,
						to: endPos + endLength,
						message: "Bare \\end closes " + suggestedName + ". Consider using \\end " + suggestedName + " for clarity.",
						suggestedName: suggestedName,
						isHint: true
					});
				}
			}

			if(pragmaStack.length > 0) {
				// Find matching pragma
				var foundIndex = -1;
				for(var j = pragmaStack.length - 1; j >= 0; j--) {
					if(!endName || pragmaStack[j].name === endName) {
						foundIndex = j;
						break;
					}
				}

				if(foundIndex >= 0) {
					// Check for any nested pragmas that weren't closed before this \end
					// These are pragmas at indices > foundIndex (opened after the one we're closing)
					for(var k = pragmaStack.length - 1; k > foundIndex; k--) {
						var unclosed = pragmaStack[k];
						issues.push({
							from: unclosed.pos,
							to: unclosed.lineEnd,
							message: "Unclosed \\" + unclosed.type + ": " + unclosed.name + " (not closed before \\end " + (endName || pragmaStack[foundIndex].name) + ")",
							pragmaName: unclosed.name,
							pragmaType: unclosed.type,
							insertEndAt: endPos // Insert \end before the parent's \end
						});
					}
					// Remove the matched pragma and all nested ones
					pragmaStack.splice(foundIndex);
				} else if(endName) {
					// Named \end but no matching pragma found
					issues.push({
						from: endPos,
						to: endPos + endLength,
						message: "Unmatched \\end " + endName + ": no open pragma with this name"
					});
				}
			} else {
				// Stack is empty - this \end has nothing to close
				issues.push({
					from: endPos,
					to: endPos + endLength,
					message: "Unexpected \\end" + (endName ? " " + endName : "") + ": no open pragma to close"
				});
			}
		}

		pos += line.length + 1; // +1 for newline
	}

	// Report unclosed pragmas
	pragmaStack.forEach(function(pragma) {
		issues.push({
			from: pragma.pos,
			to: pragma.lineEnd,
			message: "Unclosed \\" + pragma.type + ": " + pragma.name + " (missing \\end)",
			pragmaName: pragma.name,
			pragmaType: pragma.type
		});
	});

	return issues;
}

/**
 * Find pragmas that appear after regular content (invalid position)
 *
 * Pragmas (\define, \procedure, \function, \widget, \import, \rules, \whitespace, \parameters)
 * must appear at the top of their scope before any regular content.
 * This applies both at document level AND within pragma bodies.
 *
 * Example of invalid:
 *   \define outer()
 *   \procedure inner()
 *   some text
 *   \procedure invalid() <- This is invalid because "some text" came first
 *   \end
 *   \end
 */
function findMisplacedPragmas(text, startPos) {
	var issues = [];
	var lines = text.split("\n");
	var pos = startPos;

	// Stack tracks: { type, name, foundContent, bodyStartPos }
	// foundContent tracks whether content has appeared at THIS nesting level
	// bodyStartPos is where the pragma's body starts (for quick-fix insertion)
	var pragmaStack = [];
	var foundContentAtRoot = false; // Track content at document root level

	// Pragma patterns
	var pragmaOpenRe = /^\\(define|procedure|function|widget)\s+([^\s(]+)/;
	var pragmaSimpleRe = /^\\(import|rules|whitespace|parameters)\b/;
	var pragmaCloseRe = /^\\end\b/;

	for(var i = 0; i < lines.length; i++) {
		var line = lines[i];
		var trimmed = line.trim();

		// Skip blank lines
		if(trimmed === "") {
			pos += line.length + 1;
			continue;
		}

		// Check for pragma close
		if(pragmaCloseRe.test(trimmed)) {
			if(pragmaStack.length > 0) {
				pragmaStack.pop();
			}
			pos += line.length + 1;
			continue;
		}

		// Check for pragma open (multi-line ones)
		var pragmaOpenMatch = trimmed.match(pragmaOpenRe);
		if(pragmaOpenMatch) {
			var pragmaType = pragmaOpenMatch[1];
			var pragmaName = pragmaOpenMatch[2];

			// Check if it's single-line (has content after params)
			var afterMatch = trimmed.match(/^\\(?:define|procedure|function|widget)\s+[^\s(]+(\([^)]*\))?(.*)$/);
			var isSingleLine = afterMatch && afterMatch[2] && afterMatch[2].trim().length > 0;

			// Check if content has appeared at current scope
			var contentAppearedAtScope = pragmaStack.length > 0 ?
				pragmaStack[pragmaStack.length - 1].foundContent :
				foundContentAtRoot;

			if(contentAppearedAtScope) {
				// This pragma appears after content - invalid
				var containingPragma = pragmaStack.length > 0 ? pragmaStack[pragmaStack.length - 1] : null;
				var scopeDesc = containingPragma ?
					"within \\" + containingPragma.type + " " + containingPragma.name :
					"in the tiddler";
				issues.push({
					from: pos,
					to: pos + line.length,
					message: "Pragma \\" + pragmaType + " must appear before any content " + scopeDesc,
					containingPragma: containingPragma
				});
			}

			if(!isSingleLine) {
				// Body starts after this line (pos + line.length + 1 for the newline)
				var bodyStart = pos + line.length + 1;
				pragmaStack.push({
					type: pragmaType,
					name: pragmaName,
					foundContent: false, // New scope, no content yet
					bodyStartPos: bodyStart
				});
			}
			pos += line.length + 1;
			continue;
		}

		// Check for simple pragmas (single-line only)
		var pragmaSimpleMatch = trimmed.match(pragmaSimpleRe);
		if(pragmaSimpleMatch) {
			var contentAppearedAtScope = pragmaStack.length > 0 ?
				pragmaStack[pragmaStack.length - 1].foundContent :
				foundContentAtRoot;

			if(contentAppearedAtScope) {
				var containingPragma = pragmaStack.length > 0 ? pragmaStack[pragmaStack.length - 1] : null;
				var scopeDesc = containingPragma ?
					"within \\" + containingPragma.type + " " + containingPragma.name :
					"in the tiddler";
				issues.push({
					from: pos,
					to: pos + line.length,
					message: "Pragma \\" + pragmaSimpleMatch[1] + " must appear before any content " + scopeDesc,
					containingPragma: containingPragma
				});
			}
			pos += line.length + 1;
			continue;
		}

		// Line continuation (lone backslash)
		if(trimmed === "\\") {
			pos += line.length + 1;
			continue;
		}

		// This is regular content - mark that we've found content at current scope
		// (unless it's another backslash-something that we don't recognize)
		if(!trimmed.startsWith("\\")) {
			if(pragmaStack.length > 0) {
				pragmaStack[pragmaStack.length - 1].foundContent = true;
			} else {
				foundContentAtRoot = true;
			}
		}

		pos += line.length + 1;
	}

	return issues;
}

// ============================================================================
// Conditional Block Matching
// ============================================================================

/**
 * Find unclosed conditional blocks with smart insertion positions
 */
function findUnclosedConditionals(tree, state) {
	var issues = [];
	var docLength = state.doc.length;

	tree.iterate({
		enter: function(node) {
			var nodeType = node.type.name;

			// Check ConditionalBlock nodes for missing <%endif%>
			if(nodeType === "ConditionalBlock") {
				var text = state.doc.sliceString(node.from, node.to);

				// Check if block has <%if but no <%endif
				var hasIf = /<%\s*if\b/.test(text);
				var hasEndif = /<%\s*endif\s*%>/.test(text);

				if(hasIf && !hasEndif) {
					// Find the <%if position for the error marker
					var ifMatch = text.match(/<%\s*if\b[^%]*%>/);
					var ifFrom = node.from;
					var ifTo = node.from + (ifMatch ? ifMatch[0].length : 10);

					// Find best insertion position
					var insertInfo = findBestInsertPosition(state, ifTo, docLength, []);

					issues.push({
						from: ifFrom,
						to: ifTo,
						message: "Unclosed <%if (missing <%endif%>)",
						insertAt: insertInfo.pos,
						insertType: insertInfo.type
					});
				}
			}

			// Also check for inline Conditional nodes (<%if%> on single line without block structure)
			if(nodeType === "Conditional") {
				var text = state.doc.sliceString(node.from, node.to);

				// Only flag <%if that aren't inside a ConditionalBlock
				if(/<%\s*if\b/.test(text)) {
					// Check if parent is ConditionalBlock
					var parent = node.node.parent;
					var inBlock = false;
					while(parent) {
						if(parent.name === "ConditionalBlock") {
							inBlock = true;
							break;
						}
						parent = parent.parent;
					}

					if(!inBlock) {
						var insertInfo = findBestInsertPosition(state, node.to, docLength, []);
						issues.push({
							from: node.from,
							to: node.to,
							message: "Unclosed <%if (missing <%endif%>)",
							insertAt: insertInfo.pos,
							insertType: insertInfo.type
						});
					}
				}

				// Check for standalone <%endif without <%if
				if(/<%\s*endif\s*%>/.test(text)) {
					var parent = node.node.parent;
					var inBlock = false;
					while(parent) {
						if(parent.name === "ConditionalBlock") {
							inBlock = true;
							break;
						}
						parent = parent.parent;
					}

					if(!inBlock) {
						issues.push({
							from: node.from,
							to: node.to,
							message: "Unexpected <%endif%> without matching <%if"
						});
					}
				}
			}
		}
	});

	return issues;
}

// ============================================================================
// Code Block Matching
// ============================================================================

/**
 * Find unclosed code blocks with smart insertion positions
 */
function findUnclosedCodeBlocks(state) {
	var issues = [];
	var stack = [];
	var text = state.doc.toString();
	var lines = text.split("\n");
	var pos = 0;

	for(var i = 0; i < lines.length; i++) {
		var line = lines[i];
		var trimmed = line.trim();

		// Check for ``` at start of line
		if(trimmed.startsWith("```")) {
			if(stack.length > 0 && trimmed === "```") {
				// Closing
				stack.pop();
			} else if(trimmed.startsWith("```")) {
				// Opening (possibly with language)
				stack.push({
					pos: pos + line.indexOf("```"),
					lineNum: i,
					lineEnd: pos + line.length
				});
			}
		}

		// Check for $$$ typed blocks
		if(trimmed.startsWith("$$$")) {
			if(stack.length > 0 && stack[stack.length - 1].type === "$$$" && trimmed === "$$$") {
				stack.pop();
			} else if(trimmed.startsWith("$$$")) {
				stack.push({
					pos: pos + line.indexOf("$$$"),
					lineNum: i,
					lineEnd: pos + line.length,
					type: "$$$"
				});
			}
		}

		pos += line.length + 1;
	}

	// Report unclosed code blocks with smart insertion positions
	stack.forEach(function(item) {
		var marker = item.type || "```";

		// Find best insertion position: next empty line, or end of document
		var insertPos = state.doc.length;
		var insertType = "docEnd";

		// Look for next empty line after the opening marker
		var lineAfter = state.doc.lineAt(item.lineEnd);
		for(var lineNum = lineAfter.number + 1; lineNum <= state.doc.lines; lineNum++) {
			var line = state.doc.line(lineNum);
			if(line.text.trim() === "") {
				insertPos = line.from;
				insertType = "emptyLine";
				break;
			}
		}

		issues.push({
			from: item.pos,
			to: item.pos + 3,
			message: "Unclosed code block (missing closing " + marker + ")",
			marker: marker,
			insertAt: insertPos,
			insertType: insertType
		});
	});

	return issues;
}

// ============================================================================
// Empty Filter Operator Check
// ============================================================================

/**
 * Find empty filter operators like []
 */
function findEmptyFilterOperators(tree, state) {
	var issues = [];

	tree.iterate({
		enter: function(node) {
			if(node.type.name === "FilterOperator") {
				var text = state.doc.sliceString(node.from, node.to);
				// Check for empty operator []
				if(/^\[\s*\]$/.test(text)) {
					issues.push({
						from: node.from,
						to: node.to,
						message: "Empty filter operator []"
					});
				}
			}
		}
	});

	return issues;
}

// ============================================================================
// Main Linting Logic
// ============================================================================

/**
 * Create linter function
 */
function createTiddlyWikiLinter(view) {
	if(!_syntaxTree) return [];

	var diagnostics = [];
	var state = view.state;
	var tree = _syntaxTree(state);
	var docText = state.doc.toString();

	// Get local definitions
	var localDefs = extractLocalDefinitions(docText);

	// ========================================
	// Syntax Tree Based Checks
	// ========================================

	tree.iterate({
		enter: function(node) {
			var nodeType = node.type.name;
			var from = node.from;
			var to = node.to;
			var text = state.doc.sliceString(from, to);

			// Check WikiLinks for missing tiddlers
			if(nodeType === "LinkTarget" && isRuleEnabled("missingLinks")) {
				if(!tiddlerExists(text)) {
					diagnostics.push({
						from: from,
						to: to,
						severity: "warning",
						message: "Link to missing tiddler: " + text,
						source: "tiddlywiki"
					});
				}
			}

			// Check CamelCase links
			if(nodeType === "CamelCaseLink" && isRuleEnabled("missingLinks")) {
				if(isCamelCaseEnabled() && !tiddlerExists(text)) {
					diagnostics.push({
						from: from,
						to: to,
						severity: "warning",
						message: "CamelCase link to missing tiddler: " + text,
						source: "tiddlywiki"
					});
				}
			}

			// Check transclusion targets
			if(nodeType === "TransclusionTarget" && isRuleEnabled("missingLinks")) {
				var tiddlerName = text;
				var sepIdx = text.indexOf("!!");
				if(sepIdx === -1) sepIdx = text.indexOf("##");
				if(sepIdx > 0) {
					tiddlerName = text.substring(0, sepIdx);
				}
				if(tiddlerName && !tiddlerExists(tiddlerName)) {
					diagnostics.push({
						from: from,
						to: to,
						severity: "warning",
						message: "Transclusion of missing tiddler: " + tiddlerName,
						source: "tiddlywiki"
					});
				}
			}

			// Check macro calls
			if(nodeType === "MacroName" && isRuleEnabled("undefinedMacros")) {
				var macroName = text.trim();
				if(!isDefinitionKnown(macroName, "any") &&
					!localDefs.macros.has(macroName) &&
					!localDefs.procedures.has(macroName) &&
					!localDefs.functions.has(macroName) &&
					!localDefs.variables.has(macroName) &&
					!builtInVariables.has(macroName)) {
					diagnostics.push({
						from: from,
						to: to,
						severity: "info",
						message: "Possibly undefined variable / macro / procedure / function: " + macroName,
						source: "tiddlywiki"
					});
				}
			}

			// Check widget names
			if(nodeType === "WidgetName" && isRuleEnabled("unknownWidgets")) {
				var widgetName = text;
				// Normalize to check both with and without $ prefix
				var widgetWithDollar = widgetName.startsWith("$") ? widgetName : "$" + widgetName;
				var widgetWithoutDollar = widgetName.startsWith("$") ? widgetName.substring(1) : widgetName;

				// Check global definitions (already handles normalization)
				var isKnown = isDefinitionKnown(widgetName, "widget");

				// Check local definitions (might be stored with or without $)
				var isLocallyDefined = localDefs.widgets.has(widgetName) ||
					localDefs.widgets.has(widgetWithDollar) ||
					localDefs.widgets.has(widgetWithoutDollar);

				if(!isKnown && !isLocallyDefined) {
					diagnostics.push({
						from: from,
						to: to,
						severity: "info",
						message: "Unknown widget: " + text,
						source: "tiddlywiki"
					});
				}
			}

			// Check filter expressions for bracket issues
			if(nodeType === "FilterExpression" && isRuleEnabled("filterSyntax")) {
				var filterIssues = checkFilterBrackets(text, from);
				filterIssues.forEach(function(issue) {
					diagnostics.push({
						from: issue.pos,
						to: issue.pos + 1,
						severity: "error",
						message: issue.message,
						source: "tiddlywiki"
					});
				});
			}
		}
	});

	// ========================================
	// Empty Filter Operators (with quick-fix)
	// ========================================

	if(isRuleEnabled("filterSyntax")) {
		var emptyOps = findEmptyFilterOperators(tree, state);
		emptyOps.forEach(function(issue) {
			diagnostics.push({
				from: issue.from,
				to: issue.to,
				severity: "warning",
				message: issue.message,
				source: "tiddlywiki",
				actions: [{
					name: "Remove empty operator",
					apply: function(view, from, to) {
						view.dispatch({
							changes: {
								from: from,
								to: to,
								insert: ""
							}
						});
					}
				}]
			});
		});
	}

	// ========================================
	// Unclosed Widgets (with quick-fix)
	// ========================================

	if(isRuleEnabled("unclosedWidgets")) {
		var widgetIssues = findUnclosedWidgets(tree, state);
		widgetIssues.forEach(function(issue) {
			var tagName = issue.name || "";
			var isHTML = issue.isHTML;
			var closeTag = isHTML ? "</" + tagName + ">" : "</" + tagName + ">";
			var insertAt = issue.insertAt;
			var insertType = issue.insertType;

			// Create actions with captured values
			var actions = [];

			// Handle orphan closing tags (extra closing tags without matching opening)
			if(issue.isOrphanClose) {
				actions.push({
					name: "Remove closing tag",
					apply: function(view, from, to) {
						// Remove the closing tag and any trailing whitespace/newline
						var afterTo = to;
						var docLength = view.state.doc.length;
						// Check if there's a newline after the tag
						if(afterTo < docLength) {
							var nextChar = view.state.doc.sliceString(afterTo, afterTo + 1);
							if(nextChar === "\n") {
								afterTo++;
							}
						}
						view.dispatch({
							changes: {
								from: from,
								to: afterTo,
								insert: ""
							}
						});
					}
				});

				diagnostics.push({
					from: issue.from,
					to: issue.to,
					severity: "error",
					message: issue.message,
					source: "tiddlywiki",
					actions: actions
				});
				return; // Skip the normal unclosed tag handling
			}

			if(tagName) {
				(function(name, tag, pos, type, html) {
					// Describe where it will be inserted based on insertType
					var actionName = "Add " + tag;
					if(type === "emptyLine") {
						actionName = "Add " + tag + " (at empty line)";
					} else if(type === "beforeTag") {
						actionName = "Add " + tag + " (before next tag)";
					} else if(type === "containerEnd") {
						actionName = "Add " + tag + " (before container end)";
					}
					// "docEnd" just uses the default "Add <tag>"

					actions.push({
						name: actionName,
						apply: function(view, from, to) {
							view.dispatch({
								changes: {
									from: pos,
									to: pos,
									insert: tag + "\n"
								}
							});
						}
					});

					// Only add "Make self-closing" for widgets, not HTML tags
					if(!html) {
						actions.push({
							name: "Make self-closing",
							apply: function(view, from, to) {
								// Find the > and replace with />
								var text = view.state.doc.sliceString(from, to);
								var closePos = text.lastIndexOf(">");
								if(closePos !== -1) {
									var insertPos = from + closePos;
									view.dispatch({
										changes: {
											from: insertPos,
											to: insertPos,
											insert: "/"
										}
									});
								}
							}
						});
					}
				})(tagName, closeTag, insertAt, insertType, isHTML);
			}

			diagnostics.push({
				from: issue.from,
				to: issue.to,
				severity: "warning",
				message: issue.message,
				source: "tiddlywiki",
				actions: actions
			});
		});
	}

	// ========================================
	// Unclosed Pragmas (with quick-fix)
	// ========================================

	if(isRuleEnabled("unclosedPragmas")) {
		var pragmaIssues = findUnclosedPragmas(docText, 0);
		pragmaIssues.forEach(function(issue) {
			var isAmbiguous = issue.message.startsWith("Ambiguous");
			var isBareEndHint = issue.message.startsWith("Bare \\end");
			var pragmaName = issue.pragmaName || "";
			var insertAt = issue.insertEndAt; // Position to insert \end (before parent's \end)

			var actions = [];
			if((isAmbiguous || isBareEndHint) && issue.suggestedName) {
				// Quick-fix: add the name to the bare \end
				(function(name) {
					actions.push({
						name: "Use \\end " + name,
						apply: function(view, from, to) {
							view.dispatch({
								changes: {
									from: to,
									to: to,
									insert: " " + name
								}
							});
						}
					});
				})(issue.suggestedName);
			}

			if(!isAmbiguous && !isBareEndHint && pragmaName) {
				// Use IIFE to capture insertAt value
				(function(targetPos, name) {
					if(typeof targetPos === "number") {
						// Insert before parent's \end
						actions.push({
							name: "Add \\end " + name + " (before parent)",
							apply: function(view, from, to) {
								view.dispatch({
									changes: {
										from: targetPos,
										to: targetPos,
										insert: "\\end " + name + "\n"
									}
								});
							}
						});
					} else {
						// No specific position - insert at document end
						actions.push({
							name: "Add \\end " + name,
							apply: function(view, from, to) {
								var docLength = view.state.doc.length;
								view.dispatch({
									changes: {
										from: docLength,
										to: docLength,
										insert: "\n\\end " + name + "\n"
									}
								});
							}
						});
					}
					actions.push({
						name: "Add \\end",
						apply: function(view, from, to) {
							var pos = typeof targetPos === "number" ? targetPos : view.state.doc.length;
							var prefix = typeof targetPos === "number" ? "" : "\n";
							view.dispatch({
								changes: {
									from: pos,
									to: pos,
									insert: prefix + "\\end\n"
								}
							});
						}
					});
				})(insertAt, pragmaName);
			}

			// Determine severity: hint for "Bare \end" suggestions, warning for others
			var severity = issue.isHint ? "hint" : "warning";
			// Unexpected/unmatched \end is an error
			if(issue.message.startsWith("Unexpected") || issue.message.startsWith("Unmatched")) {
				severity = "error";
			}

			diagnostics.push({
				from: issue.from,
				to: issue.to,
				severity: severity,
				message: issue.message,
				source: "tiddlywiki",
				actions: actions
			});
		});
	}

	// ========================================
	// Misplaced Pragmas (after content)
	// ========================================

	if(isRuleEnabled("misplacedPragmas")) {
		var misplacedIssues = findMisplacedPragmas(docText, 0);
		misplacedIssues.forEach(function(issue) {
			var actionName = issue.containingPragma ?
				"Move to top of \\" + issue.containingPragma.type + " " + issue.containingPragma.name :
				"Move to top of tiddler";
			// Capture the insertion position (body start of containing pragma, or 0 for document root)
			var insertPos = issue.containingPragma ? issue.containingPragma.bodyStartPos : 0;
			diagnostics.push({
				from: issue.from,
				to: issue.to,
				severity: "error",
				message: issue.message,
				source: "tiddlywiki",
				actions: [{
					name: actionName,
					apply: (function(targetPos) {
						return function(view, from, to) {
							var docLength = view.state.doc.length;
							var startLine = view.state.doc.lineAt(from);
							var pragmaStart = startLine.from;
							var pragmaEnd = startLine.to;

							// Check if this is a multi-line pragma that needs \end
							var firstLineText = view.state.doc.sliceString(startLine.from, startLine.to);
							var multiLineMatch = firstLineText.match(/^\\(define|procedure|function|widget)\s+[^\s(]+(\([^)]*\))?\s*$/);

							if(multiLineMatch) {
								// Multi-line pragma - find the matching \end
								var searchStart = startLine.to + 1;
								var depth = 1;
								var pos = searchStart;

								// Search for matching \end, handling nested pragmas
								while(pos < docLength && depth > 0) {
									var line = view.state.doc.lineAt(pos);
									var lineText = view.state.doc.sliceString(line.from, line.to).trim();

									// Check for nested pragma open
									if(/^\\(define|procedure|function|widget)\s+\S+/.test(lineText) &&
										!/^\\(define|procedure|function|widget)\s+[^\s(]+(\([^)]*\))?\s+\S/.test(lineText)) {
										depth++;
									}
									// Check for \end
									else if(/^\\end\b/.test(lineText)) {
										depth--;
										if(depth === 0) {
											pragmaEnd = line.to;
										}
									}

									pos = line.to + 1;
									if(pos > docLength) break;
								}
							}

							// Get the full pragma text
							var pragmaText = view.state.doc.sliceString(pragmaStart, pragmaEnd);

							// Check if this is at the end of document (no trailing newline)
							var deleteEnd = Math.min(pragmaEnd + 1, docLength);
							var hasTrailingNewline = pragmaEnd + 1 <= docLength;

							// Calculate adjusted insert position if removal happens before it
							var adjustedInsertPos = targetPos;
							var deleteStart = pragmaStart;

							// If removing from end without trailing newline, remove preceding newline
							if(!hasTrailingNewline && deleteStart > 0) {
								deleteStart = deleteStart - 1;
							}

							if(deleteStart < targetPos) {
								// Removal is before insert point, adjust for removed length
								adjustedInsertPos = targetPos - (deleteEnd - deleteStart);
							}

							// Remove from current position and insert at target position
							view.dispatch({
								changes: [{
										from: deleteStart,
										to: deleteEnd,
										insert: ""
									},
									{
										from: adjustedInsertPos,
										to: adjustedInsertPos,
										insert: pragmaText + "\n"
									}
								]
							});
						};
					})(insertPos)
				}]
			});
		});
	}

	// ========================================
	// Unclosed Conditionals (with quick-fix)
	// ========================================

	if(isRuleEnabled("unclosedConditionals")) {
		var condIssues = findUnclosedConditionals(tree, state);
		condIssues.forEach(function(issue) {
			var insertAt = issue.insertAt;
			var insertType = issue.insertType;

			var actions = [];
			// Only add quick-fix for unclosed <%if, not for unexpected <%endif
			if(typeof insertAt === "number") {
				// Use IIFE to capture values
				(function(pos, type) {
					// Describe where it will be inserted based on insertType
					var actionName = "Add <%endif%>";
					if(type === "emptyLine") {
						actionName = "Add <%endif%> (at empty line)";
					} else if(type === "beforeTag") {
						actionName = "Add <%endif%> (before next tag)";
					} else if(type === "containerEnd") {
						actionName = "Add <%endif%> (before container end)";
					}

					actions.push({
						name: actionName,
						apply: function(view, from, to) {
							view.dispatch({
								changes: {
									from: pos,
									to: pos,
									insert: "<%endif%>\n"
								}
							});
						}
					});
				})(insertAt, insertType);
			}

			diagnostics.push({
				from: issue.from,
				to: issue.to,
				severity: "error",
				message: issue.message,
				source: "tiddlywiki",
				actions: actions
			});
		});
	}

	// ========================================
	// Unclosed Code Blocks (with quick-fix)
	// ========================================

	if(isRuleEnabled("unclosedCodeBlocks")) {
		var codeIssues = findUnclosedCodeBlocks(state);
		codeIssues.forEach(function(issue) {
			var marker = issue.marker || "```";
			var insertAt = issue.insertAt;
			var insertType = issue.insertType;

			var actions = [];
			// Use IIFE to capture values
			(function(m, pos, type) {
				var actionName = "Add closing " + m;
				if(type === "emptyLine") {
					actionName = "Add " + m + " (at empty line)";
				}

				actions.push({
					name: actionName,
					apply: function(view, from, to) {
						view.dispatch({
							changes: {
								from: pos,
								to: pos,
								insert: m + "\n"
							}
						});
					}
				});
			})(marker, insertAt, insertType);

			diagnostics.push({
				from: issue.from,
				to: issue.to,
				severity: "error",
				message: issue.message,
				source: "tiddlywiki",
				actions: actions
			});
		});
	}

	// ========================================
	// Duplicate Definitions
	// ========================================

	if(isRuleEnabled("duplicateDefinitions")) {
		var defsWithPos = extractLocalDefinitionsWithPositions(docText);
		var duplicateIssues = findDuplicateDefinitions(defsWithPos);
		duplicateIssues.forEach(function(issue) {
			diagnostics.push({
				from: issue.from,
				to: issue.to,
				severity: "warning",
				message: issue.message,
				source: "tiddlywiki"
			});
		});
	}

	// ========================================
	// Unused Definitions
	// ========================================

	if(isRuleEnabled("unusedDefinitions")) {
		var defsWithPos = extractLocalDefinitionsWithPositions(docText);
		var usages = findDefinitionUsages(docText);
		var unusedIssues = findUnusedDefinitions(defsWithPos, usages);
		unusedIssues.forEach(function(issue) {
			diagnostics.push({
				from: issue.from,
				to: issue.to,
				severity: "hint",
				message: issue.message,
				source: "tiddlywiki",
				actions: [{
					name: "Remove definition",
					apply: function(view, from, to) {
						// Find the full pragma block and remove it
						// This is a simplified version - may need enhancement for multi-line
						var line = view.state.doc.lineAt(issue.defFrom);
						var endLine = line;
						// Try to find \end
						var text = view.state.doc.toString();
						var endMatch = text.slice(issue.defFrom).match(/\\end\s*\S*/);
						if(endMatch) {
							var endPos = issue.defFrom + endMatch.index + endMatch[0].length;
							endLine = view.state.doc.lineAt(endPos);
						}
						// Don't exceed document length
						var deleteEnd = Math.min(endLine.to + 1, view.state.doc.length);
						view.dispatch({
							changes: {
								from: line.from,
								to: deleteEnd,
								insert: ""
							}
						});
					}
				}]
			});
		});
	}

	// ========================================
	// Invalid Tag References
	// ========================================

	if(isRuleEnabled("invalidTags")) {
		var tagIssues = findInvalidTagReferences(tree, state);
		tagIssues.forEach(function(issue) {
			diagnostics.push({
				from: issue.from,
				to: issue.to,
				severity: "warning",
				message: "Unknown tag in " + issue.operatorName + "[]: " + issue.tagName,
				source: "tiddlywiki"
			});
		});
	}

	return diagnostics;
}

// ============================================================================
// Plugin Definition
// ============================================================================

/**
 * Check if linting is globally enabled
 * @param {object} wiki - The wiki object (defaults to $tw.wiki)
 */
function isLintEnabled(wiki) {
	wiki = wiki || $tw.wiki;
	if(wiki) {
		var enabled = (wiki.getTiddlerText("$:/config/codemirror-6/lint", "yes") || "").trim();
		return enabled === "yes";
	}
	return true;
}

/**
 * Check if linting is disabled for a specific tiddler
 * @param {string} tiddlerTitle - The tiddler title
 * @param {object} wiki - The wiki object (defaults to $tw.wiki)
 */
function isLintDisabledForTiddler(tiddlerTitle, wiki) {
	wiki = wiki || $tw.wiki;
	if(!wiki || !tiddlerTitle) return false;
	// Check for per-tiddler disable via temp tiddler
	return wiki.tiddlerExists("$:/temp/codemirror-6/lint-disabled/" + tiddlerTitle);
}

/**
 * Build lint extensions array
 */
function buildLintExtensions(core, context) {
	var extensions = [];

	// Add linter
	extensions.push(_linter(createTiddlyWikiLinter, {
		delay: 750 // Debounce linting by 750ms
	}));

	// Add gutter with lint markers
	if(_lintGutter && context.options.lintGutter !== false) {
		extensions.push(_lintGutter());
	}

	// Add keyboard shortcuts for navigating lint issues
	if(_lintKeymap && core.view && core.view.keymap) {
		extensions.push(core.view.keymap.of(_lintKeymap));
	}

	return extensions;
}

exports.plugin = {
	name: "lint",
	description: "Highlight potential issues in TiddlyWiki content",
	priority: 300,

	// Only check content type - config-based toggling is handled via compartment
	condition: function(context) {
		var type = context.tiddlerType;
		if(context.options.lint === false) return false;
		return !type || type === "" || type === "text/vnd.tiddlywiki" || type === "text/x-tiddlywiki";
	},

	// Register compartment for dynamic enable/disable
	registerCompartments: function() {
		if(!_Compartment) return {};
		return {
			lint: new _Compartment()
		};
	},

	init: function(cm6Core) {
		this._core = cm6Core;
		// Store Compartment constructor
		if(cm6Core.state && cm6Core.state.Compartment) {
			_Compartment = cm6Core.state.Compartment;
		}
		// Store syntaxTree function
		if(cm6Core.language && cm6Core.language.syntaxTree) {
			_syntaxTree = cm6Core.language.syntaxTree;
		}
	},

	getExtensions: function(context) {
		if(!_linter || !_syntaxTree) return [];

		// Get compartment from engine (not module-level variable)
		var compartment = context.engine && context.engine._compartments && context.engine._compartments.lint;
		if(!compartment) return [];

		var core = this._core;

		// If globally disabled, return empty compartment
		if(!isLintEnabled()) {
			return [compartment.of([])];
		}

		// If disabled for this specific tiddler, return empty compartment
		var tiddlerTitle = context.tiddlerTitle;
		if(tiddlerTitle && isLintDisabledForTiddler(tiddlerTitle)) {
			return [compartment.of([])];
		}

		// Build and wrap extensions in compartment
		var extensions = buildLintExtensions(core, context);
		return [compartment.of(extensions)];
	},

	// Return raw content for compartment reconfiguration
	getCompartmentContent: function(context) {
		if(!_linter || !_syntaxTree) return [];
		if(!isLintEnabled()) return [];
		// Check per-tiddler disable
		var tiddlerTitle = context.tiddlerTitle;
		if(tiddlerTitle && isLintDisabledForTiddler(tiddlerTitle)) return [];
		return buildLintExtensions(this._core, context);
	},

	destroy: function(engine) {
		// Clear cache on destroy
		_knownDefinitions = null;
	},

	/**
	 * Called when tiddlers change - re-lint or reconfigure if lint config changed
	 */
	onRefresh: function(widget, changedTiddlers) {
		if(!widget || !widget.engine || !widget.engine.view) {
			return;
		}

		var engine = widget.engine;
		var context = engine._pluginContext || {};
		var tiddlerTitle = context.tiddlerTitle;

		// Check if any lint config tiddlers changed
		var lintConfigChanged = false;
		var globalConfigChanged = false;
		var perTiddlerChanged = false;
		var perTiddlerDisableTiddler = tiddlerTitle ? "$:/temp/codemirror-6/lint-disabled/" + tiddlerTitle : null;

		for(var title in changedTiddlers) {
			if(title === "$:/config/codemirror-6/lint") {
				globalConfigChanged = true;
				lintConfigChanged = true;
			} else if(title.indexOf("$:/config/codemirror-6/lint/") === 0) {
				lintConfigChanged = true;
			} else if(perTiddlerDisableTiddler && title === perTiddlerDisableTiddler) {
				perTiddlerChanged = true;
			}
		}

		if(globalConfigChanged || perTiddlerChanged) {
			// Global lint toggle or per-tiddler toggle changed - reconfigure compartment
			var compartment = engine._compartments && engine._compartments.lint;

			if(compartment) {
				var globalEnabled = isLintEnabled();
				var perTiddlerDisabled = tiddlerTitle && isLintDisabledForTiddler(tiddlerTitle);
				var enabled = globalEnabled && !perTiddlerDisabled;
				var newContent = enabled ? buildLintExtensions(this._core, context) : [];

				try {
					engine.view.dispatch({
						effects: compartment.reconfigure(newContent)
					});
				} catch (e) {}

				// Clear cache
				_knownDefinitions = null;

				// If enabling, trigger linting after a short delay to let extensions initialize
				if(enabled && _forceLinting) {
					setTimeout(function() {
						_forceLinting(engine.view);
					}, 50);
				}
			}
		} else if(lintConfigChanged) {
			// Individual rule changed - reconfigure to force fresh linter
			var compartment = engine._compartments && engine._compartments.lint;

			if(compartment) {
				// Check if lint is actually enabled for this tiddler
				var globalEnabled = isLintEnabled();
				var perTiddlerDisabled = tiddlerTitle && isLintDisabledForTiddler(tiddlerTitle);
				if(!globalEnabled || perTiddlerDisabled) return;

				var newContent = buildLintExtensions(this._core, context);
				_knownDefinitions = null;

				try {
					engine.view.dispatch({
						effects: compartment.reconfigure(newContent)
					});
				} catch (e) {}

				// Trigger linting after reconfigure
				if(_forceLinting) {
					setTimeout(function() {
						_forceLinting(engine.view);
					}, 50);
				}
			}
		}
	},

	/**
	 * Message handlers for toolbar button interactions
	 */
	onMessage: {
		/**
		 * Handle tm-cm6-toggle-lint message from toolbar button
		 * Toggles the per-tiddler lint setting and reconfigures the compartment
		 */
		"tm-cm6-toggle-lint": function(widget, event) {
			if(!widget || !widget.engine || !widget.engine.view) {
				return;
			}

			var engine = widget.engine;
			var context = engine._pluginContext || {};
			var tiddlerTitle = context.tiddlerTitle;
			var compartment = engine._compartments && engine._compartments.lint;

			if(!compartment || !tiddlerTitle) {
				return;
			}

			var globalEnabled = isLintEnabled();
			var perTiddlerDisabled = isLintDisabledForTiddler(tiddlerTitle);
			var currentlyEnabled = globalEnabled && !perTiddlerDisabled;

			// Toggle the per-tiddler state by creating/deleting the temp tiddler
			var disableTiddler = "$:/temp/codemirror-6/lint-disabled/" + tiddlerTitle;
			if(perTiddlerDisabled) {
				// Currently disabled for this tiddler - delete the temp tiddler to enable
				$tw.wiki.deleteTiddler(disableTiddler);
			} else {
				// Currently enabled - create the temp tiddler to disable
				$tw.wiki.addTiddler({
					title: disableTiddler,
					text: "disabled"
				});
			}

			// Calculate the NEW state after toggle
			var newPerTiddlerDisabled = !perTiddlerDisabled;
			var newEnabled = globalEnabled && !newPerTiddlerDisabled;

			// Get the plugin instance to access _core
			var lintPlugin = null;
			if($tw && $tw.modules) {
				var plugins = $tw.modules.types["codemirror6-plugin"];
				for(var moduleName in plugins) {
					var mod = plugins[moduleName];
					if(mod && mod.plugin && mod.plugin.name === "lint") {
						lintPlugin = mod.plugin;
						break;
					}
				}
			}

			if(!lintPlugin || !lintPlugin._core) {
				return;
			}

			var newContent = newEnabled ? buildLintExtensions(lintPlugin._core, context) : [];

			try {
				engine.view.dispatch({
					effects: compartment.reconfigure(newContent)
				});
			} catch (e) {}

			// Clear cache
			_knownDefinitions = null;

			// If enabling, trigger linting after a short delay
			if(newEnabled && _forceLinting) {
				setTimeout(function() {
					_forceLinting(engine.view);
				}, 50);
			}
		}
	}
};
