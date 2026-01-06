/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-tiddlywiki/register.js
type: application/javascript
module-type: startup

Register TiddlyWiki language with CodeMirror 6 core for code block highlighting.
Provides TiddlyWiki-specific completion callbacks for tiddlers, macros, widgets, etc.

NAMING CONVENTION: All language startup modules MUST use names matching "cm6-lang-*"
(e.g., "cm6-lang-javascript", "cm6-lang-css"). This module dynamically discovers
all cm6-lang-* modules and adds them as dependencies, ensuring they load first.
This is required so code.getLanguages() returns all available languages for
nested code highlighting in fenced code blocks (```css, ```javascript, etc.).

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-tiddlywiki";

// Run after other language modules so core.getLanguages() includes them (e.g., CSS for <style> tags)
// Dynamically discover which language modules exist
(function() {
	var baseDeps = ["startup"];

	if($tw && $tw.modules && $tw.modules.forEachModuleOfType) {
		$tw.modules.forEachModuleOfType("startup", function(title, mod) {
			if(mod.name &&
				mod.name.indexOf("cm6-lang-") === 0 &&
				mod.name !== "cm6-lang-tiddlywiki") {
				baseDeps.push(mod.name);
			}
		});
	}

	exports.after = baseDeps;
})();

exports.before = ["render"];
exports.synchronous = true;

// ============================================================================
// Completion Data Cache
// ============================================================================

var _cache = {
	tiddlers: null,
	tiddlersTime: 0,
	imageTiddlers: null,
	imageTiddlersTime: 0,
	macros: null,
	macroParams: null,
	widgets: null,
	operators: null,
	fields: null,
	fieldsTime: 0,
	tags: null,
	tagsTime: 0,
	functions: null,
	functionsTime: 0,
	variables: null,
	variablesTime: 0,
	storyViews: null,
	deserializers: null,
	selfClosingWidgets: null,
	selfClosingWidgetsTime: 0
};

var CACHE_TTL = 5000; // 5 seconds

/**
 * Clear the completion cache (exported for external use)
 */
function clearCache() {
	_cache.tiddlers = null;
	_cache.tiddlersTime = 0;
	_cache.imageTiddlers = null;
	_cache.imageTiddlersTime = 0;
	_cache.macros = null;
	_cache.macroParams = null;
	_cache.widgets = null;
	_cache.operators = null;
	_cache.fields = null;
	_cache.fieldsTime = 0;
	_cache.tags = null;
	_cache.tagsTime = 0;
	_cache.functions = null;
	_cache.functionsTime = 0;
	_cache.variables = null;
	_cache.variablesTime = 0;
	_cache.storyViews = null;
	_cache.deserializers = null;
	_cache.selfClosingWidgets = null;
	_cache.selfClosingWidgetsTime = 0;
}

// ============================================================================
// TiddlyWiki Data Callbacks
// ============================================================================

/**
 * Get image tiddler titles for [img[ autocompletion (cached)
 * Returns tiddlers with type starting with "image/"
 */
function getImageTiddlerTitles() {
	var now = Date.now();
	if(_cache.imageTiddlers && (now - _cache.imageTiddlersTime) < CACHE_TTL) {
		return _cache.imageTiddlers;
	}

	var titles = [];
	if($tw && $tw.wiki) {
		titles = $tw.wiki.filterTiddlers("[all[tiddlers+shadows]is[image]]");
	}

	_cache.imageTiddlers = titles || [];
	_cache.imageTiddlersTime = now;
	return _cache.imageTiddlers;
}

/**
 * Get all tiddler titles including shadow tiddlers (cached)
 * Returns simple string array for use with language-support.ts
 * Sorted with non-system tiddlers first, then system tiddlers
 * @param {object} wiki - The wiki object (defaults to $tw.wiki)
 */
function getTiddlerTitles(wiki) {
	var now = Date.now();
	if(_cache.tiddlers && (now - _cache.tiddlersTime) < CACHE_TTL) {
		return _cache.tiddlers;
	}

	wiki = wiki || $tw.wiki;
	var titles = [];
	if(wiki) {
		// Get all tiddlers and shadow tiddlers, non-system first then system
		titles = wiki.filterTiddlers("[all[tiddlers+shadows]!is[system]sort[title]] [all[tiddlers+shadows]is[system]sort[title]]");
	}

	_cache.tiddlers = titles;
	_cache.tiddlersTime = now;
	return titles;
}

/**
 * Get macro/procedure/function names for << >> and $variable= completions
 * Returns simple string array
 */
function getMacroNames() {
	if(_cache.macros) return _cache.macros;

	var macros = [];
	var seen = {};

	// Also build parameter map for getMacroParams
	_cache.macroParams = {};

	if($tw && $tw.wiki) {
		// Get tiddlers tagged with $:/tags/Macro or $:/tags/Global
		var defTiddlers = $tw.wiki.filterTiddlers(
			"[all[tiddlers+shadows]tag[$:/tags/Macro]] [all[tiddlers+shadows]tag[$:/tags/Global]]"
		);

		defTiddlers.forEach(function(title) {
			var tiddler = $tw.wiki.getTiddler(title);
			if(tiddler) {
				var text = tiddler.fields.text || "";

				// Match \define name(params), \procedure name(params), \function name(params), \widget name(params)
				var regex = /\\(define|procedure|function|widget)\s+([^\s(]+)\s*\(([^)]*)\)/g;
				var match;
				while((match = regex.exec(text)) !== null) {
					var name = match[2];
					var paramsStr = match[3];

					if(!seen[name]) {
						seen[name] = true;
						macros.push(name);

						// Parse parameters
						var params = [];
						if(paramsStr.trim()) {
							params = paramsStr.split(",").map(function(p) {
								var paramMatch = p.trim().match(/^([^\s:]+)(?::(.*))?$/);
								return paramMatch ? paramMatch[1] : p.trim();
							});
						}
						_cache.macroParams[name] = params;
					}
				}

				// Also match definitions without parentheses (no params)
				var noParamsRegex = /\\(define|procedure|function|widget)\s+([^\s(]+)\s*$/gm;
				while((match = noParamsRegex.exec(text)) !== null) {
					var name = match[2];
					if(!seen[name]) {
						seen[name] = true;
						macros.push(name);
						_cache.macroParams[name] = [];
					}
				}
			}
		});

		// Also add global macros from $tw.macros
		if($tw.macros) {
			Object.keys($tw.macros).forEach(function(name) {
				if(!seen[name]) {
					seen[name] = true;
					macros.push(name);
					var macro = $tw.macros[name];
					var params = [];
					if(macro.params) {
						params = macro.params.map(function(p) {
							return p.name;
						});
					}
					_cache.macroParams[name] = params;
				}
			});
		}
	}

	_cache.macros = macros;
	return macros;
}

/**
 * Get parameters for a specific macro/procedure/function
 * Returns array of parameter names or null if not found
 */
function getMacroParams(macroName) {
	// Ensure cache is populated
	if(!_cache.macros) {
		getMacroNames();
	}
	var params = _cache.macroParams ? _cache.macroParams[macroName] : null;
	return params && params.length > 0 ? params : null;
}

/**
 * Get widget names (with $ prefix)
 * Returns simple string array
 */
function getWidgetNames() {
	if(_cache.widgets) return _cache.widgets;

	var widgets = [];
	var seen = {};

	// Discover all widgets from JavaScript modules using TiddlyWiki's API
	$tw.modules.forEachModuleOfType("widget", function(title, mod) {
		for(var exportName in mod) {
			if(mod.hasOwnProperty(exportName) && typeof mod[exportName] === "function") {
				var name = "$" + exportName;
				if(!seen[name]) {
					seen[name] = true;
					widgets.push(name);
				}
			}
		}
	});

	// Add custom widgets defined via \widget pragma in wiki
	if($tw && $tw.wiki) {
		var customWidgets = $tw.wiki.filterTiddlers(
			"[all[tiddlers+shadows]tag[$:/tags/Global]] [all[tiddlers+shadows]tag[$:/tags/Macro]]"
		);
		customWidgets.forEach(function(title) {
			var tiddler = $tw.wiki.getTiddler(title);
			if(tiddler) {
				var text = tiddler.fields.text || "";
				var regex = /\\widget\s+\$?([^\s(]+)/g;
				var match;
				while((match = regex.exec(text)) !== null) {
					var name = "$" + match[1].replace(/^\$/, "");
					if(!seen[name]) {
						seen[name] = true;
						widgets.push(name);
					}
				}
			}
		});
	}

	// Sort alphabetically
	widgets.sort();

	_cache.widgets = widgets;
	return widgets;
}

/**
 * Get filter operator names
 * Returns simple string array
 */
function getFilterOperators() {
	if(_cache.operators) return _cache.operators;

	var operators = [
		// Core operators from TiddlyWiki
		"title", "field", "fields", "has", "!has", "tag", "tags", "tagging",
		"links", "backlinks", "all", "is", "!is", "prefix", "suffix",
		"contains", "regexp", "search", "filter", "subfilter",
		"sort", "sortcs", "nsort", "nsortcs", "reverse", "first", "last",
		"butfirst", "butlast", "rest", "nth", "range", "limit", "count",
		"each", "eachday", "unique", "duplicates", "split", "join", "trim",
		"get", "getindex", "indexes", "getvariable", "lookup", "match", "!match",
		"addprefix", "addsuffix", "removeprefix", "removesuffix",
		"uppercase", "lowercase", "titlecase", "sentencecase", "capitalize",
		"pad", "format", "stringify", "jsonstringify",
		"length", "splitregexp", "substitute", "escapecss", "escapehtml",
		"encodehtml", "decodehtml", "encodeuri", "decodeuri", "encodeuricomponent",
		"list", "listed", "next", "previous", "before", "after", "append", "prepend",
		"move", "putafter", "putbefore", "putfirst", "putlast", "remove", "replace",
		"toggle", "compare", "enlist", "shadow", "!shadow",
		"days", "minutes", "weeks", "months", "years", "hours", "seconds",
		"sameday", "then", "else", "editions", "plugintiddlers", "commands", "modules",
		"moduletypes", "variables", "function", "getvar", "charcode", "jsonextract",
		"jsonget", "jsonindexes", "jsontype", "log", "reduce", "average",
		"max", "maxall", "median", "min", "minall", "negate", "product", "sum",
		"abs", "acos", "asin", "atan", "ceil", "cos", "exp", "floor", "pow",
		"random", "round", "sign", "sin", "sqrt", "tan", "trunc", "fixed", "precision"
	];

	// Add custom operators from $tw.wiki.filterOperators
	if($tw && $tw.wiki && $tw.wiki.filterOperators) {
		Object.keys($tw.wiki.filterOperators).forEach(function(op) {
			if(operators.indexOf(op) === -1) {
				operators.push(op);
			}
		});
	}

	_cache.operators = operators;
	return operators;
}

/**
 * Get all field names from all tiddlers (cached)
 * Returns simple string array
 */
function getFieldNames() {
	var now = Date.now();
	if(_cache.fields && (now - _cache.fieldsTime) < CACHE_TTL) {
		return _cache.fields;
	}

	var fields = {};
	// Start with common core fields
	var coreFields = [
		"title", "text", "tags", "modified", "created", "creator", "modifier",
		"type", "caption", "description", "list", "list-before", "list-after",
		"draft.of", "draft.title", "plugin-type", "plugin-priority", "color",
		"icon", "library", "source", "code-body", "throttle.refresh"
	];
	coreFields.forEach(function(f) {
		fields[f] = true;
	});

	if($tw && $tw.wiki) {
		// Collect all unique field names from all tiddlers
		$tw.wiki.each(function(tiddler, _title) {
			if(tiddler && tiddler.fields) {
				Object.keys(tiddler.fields).forEach(function(field) {
					fields[field] = true;
				});
			}
		});
	}

	_cache.fields = Object.keys(fields).sort();
	_cache.fieldsTime = now;
	return _cache.fields;
}

/**
 * Get field names for a specific tiddler
 * Used for {{tiddler!!field}} completion
 * @param {string} tiddlerTitle - The title of the tiddler to get fields from
 * @returns {string[]} Array of field names that exist on this tiddler
 */
function getTiddlerFields(tiddlerTitle) {
	if(!$tw || !$tw.wiki || !tiddlerTitle) {
		return [];
	}

	var tiddler = $tw.wiki.getTiddler(tiddlerTitle);
	if(!tiddler || !tiddler.fields) {
		return [];
	}

	return Object.keys(tiddler.fields).sort();
}

/**
 * Get index/property names for a specific data tiddler
 * Used for {{tiddler##index}} completion
 * Supports application/json, application/x-tiddler-dictionary, and other data formats
 * @param {string} tiddlerTitle - The title of the tiddler to get indexes from
 * @returns {string[]} Array of index names (keys from the tiddler's data)
 */
function getTiddlerIndexes(tiddlerTitle) {
	if(!$tw || !$tw.wiki || !tiddlerTitle) {
		return [];
	}

	// Use TiddlyWiki's built-in function to get data from the tiddler
	// This handles application/json, application/x-tiddler-dictionary, etc.
	var data = $tw.wiki.getTiddlerDataCached(tiddlerTitle, undefined);

	if(!data) {
		return [];
	}

	// Return keys for objects, numeric indexes for arrays
	if(Array.isArray(data)) {
		return data.map(function(_, i) {
			return String(i);
		});
	}

	if(typeof data === "object") {
		return Object.keys(data).sort();
	}

	return [];
}

/**
 * Get all tag names (cached)
 * Returns simple string array
 */
function getTagNames() {
	var now = Date.now();
	if(_cache.tags && (now - _cache.tagsTime) < CACHE_TTL) {
		return _cache.tags;
	}

	var tags = [];
	if($tw && $tw.wiki) {
		// Use TiddlyWiki's built-in method to get all tags
		var tagMap = $tw.wiki.getTagMap();
		tags = Object.keys(tagMap).sort();
	}

	_cache.tags = tags;
	_cache.tagsTime = now;
	return tags;
}

/**
 * Get function names (tiddlers with \function pragma)
 * Returns simple string array
 */
function getFunctionNames() {
	var now = Date.now();
	if(_cache.functions && (now - _cache.functionsTime) < CACHE_TTL) {
		return _cache.functions;
	}

	var functions = [];
	var seen = {};

	if($tw && $tw.wiki) {
		// Get tiddlers that might contain function definitions
		var defTiddlers = $tw.wiki.filterTiddlers(
			"[all[tiddlers+shadows]tag[$:/tags/Macro]] [all[tiddlers+shadows]tag[$:/tags/Global]]"
		);

		defTiddlers.forEach(function(title) {
			var tiddler = $tw.wiki.getTiddler(title);
			if(tiddler) {
				var text = tiddler.fields.text || "";

				// Match \function name or \function name(params)
				var regex = /\\function\s+([^\s(]+)/g;
				var match;
				while((match = regex.exec(text)) !== null) {
					var name = match[1];
					if(!seen[name]) {
						seen[name] = true;
						functions.push(name);
					}
				}
			}
		});

		// Also check $tw.wiki.getTiddlerText for function definitions in shadow tiddlers
		if($tw.wiki.shadowTiddlers) {
			Object.keys($tw.wiki.shadowTiddlers).forEach(function(title) {
				var shadowInfo = $tw.wiki.shadowTiddlers[title];
				if(shadowInfo && shadowInfo.tiddler && shadowInfo.tiddler.fields) {
					var text = shadowInfo.tiddler.fields.text || "";
					var regex = /\\function\s+([^\s(]+)/g;
					var match;
					while((match = regex.exec(text)) !== null) {
						var name = match[1];
						if(!seen[name]) {
							seen[name] = true;
							functions.push(name);
						}
					}
				}
			});
		}
	}

	_cache.functions = functions.sort();
	_cache.functionsTime = now;
	return _cache.functions;
}

/**
 * Get storyview names for $list widget storyview attribute completion (cached)
 * Returns simple string array
 */
function getStoryViews() {
	if(_cache.storyViews) return _cache.storyViews;

	var storyviews = [];
	var seen = {};

	$tw.modules.forEachModuleOfType("storyview", function(title, _mod) {
		// The storyview name is typically derived from the module title
		// e.g., "$:/core/modules/storyviews/classic.js" -> "classic"
		var match = /\/([^\/]+)\.js$/.exec(title);
		if(match) {
			var name = match[1];
			if(!seen[name]) {
				seen[name] = true;
				storyviews.push(name);
			}
		}
	});

	_cache.storyViews = storyviews.sort();
	return _cache.storyViews;
}

/**
 * Get deserializer names for deserializer attribute completion (cached)
 * Returns simple string array of MIME types
 */
function getDeserializers() {
	if(_cache.deserializers) return _cache.deserializers;

	var deserializers = [];
	var seen = {};

	$tw.modules.forEachModuleOfType("tiddlerdeserializer", function(title, mod) {
		// Each deserializer module exports functions keyed by MIME type
		for(var mimeType in mod) {
			if(mod.hasOwnProperty(mimeType) && typeof mod[mimeType] === "function") {
				if(!seen[mimeType]) {
					seen[mimeType] = true;
					deserializers.push(mimeType);
				}
			}
		}
	});

	_cache.deserializers = deserializers.sort();
	return _cache.deserializers;
}

/**
 * Get variable names (from \define, \procedure, \widget, \function)
 * Returns simple string array
 */
function getVariableNames() {
	var now = Date.now();
	if(_cache.variables && (now - _cache.variablesTime) < CACHE_TTL) {
		return _cache.variables;
	}

	var variables = [];
	var seen = {};

	if($tw && $tw.wiki) {
		// Get tiddlers that might contain variable definitions
		var defTiddlers = $tw.wiki.filterTiddlers(
			"[all[tiddlers+shadows]tag[$:/tags/Macro]] [all[tiddlers+shadows]tag[$:/tags/Global]]"
		);

		defTiddlers.forEach(function(title) {
			var tiddler = $tw.wiki.getTiddler(title);
			if(tiddler) {
				var text = tiddler.fields.text || "";

				// Match \define, \procedure, \function, \widget
				var regex = /\\(define|procedure|function|widget)\s+([^\s(]+)/g;
				var match;
				while((match = regex.exec(text)) !== null) {
					var name = match[2];
					if(!seen[name]) {
						seen[name] = true;
						variables.push(name);
					}
				}
			}
		});

		// Add global variables from $tw.macros
		if($tw.macros) {
			Object.keys($tw.macros).forEach(function(name) {
				if(!seen[name]) {
					seen[name] = true;
					variables.push(name);
				}
			});
		}

		// Add global procedures from wiki
		if($tw.wiki.globalProcedures) {
			Object.keys($tw.wiki.globalProcedures).forEach(function(name) {
				if(!seen[name]) {
					seen[name] = true;
					variables.push(name);
				}
			});
		}
	}

	_cache.variables = variables.sort();
	_cache.variablesTime = now;
	return _cache.variables;
}

// ============================================================================
// Startup
// ============================================================================

exports.startup = function() {
	var core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
	var langTw = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-tiddlywiki/lang-tiddlywiki.js");

	if(!core || !core.registerLanguage || !langTw || !langTw.tiddlywiki) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;

	// Callback to get self-closing widgets config (cached with TTL for live updates)
	function getSelfClosingWidgets() {
		var now = Date.now();
		if(_cache.selfClosingWidgets && (now - _cache.selfClosingWidgetsTime) < CACHE_TTL) {
			return _cache.selfClosingWidgets;
		}

		var text = $tw.wiki.getTiddlerText("$:/config/codemirror-6/selfClosingWidgets", "");
		var widgets = text
			.split(/[\s,]+/)
			.map(function(w) {
				return w.trim();
			})
			.filter(function(w) {
				return w.length > 0;
			});

		_cache.selfClosingWidgets = widgets;
		_cache.selfClosingWidgetsTime = now;
		return _cache.selfClosingWidgets;
	}

	// Cache for widget attributes (parsed from widget source code)
	var widgetAttributesCache = {};

	/**
	 * Parse getAttribute calls from widget source code
	 */
	function parseAttributesFromSource(source) {
		var attrRegex = /this\.getAttribute\s*\(\s*["']([^"']+)["']/g;
		var attrs = [];
		var seen = {};
		var match;

		while((match = attrRegex.exec(source)) !== null) {
			var attrName = match[1];
			if(!seen[attrName]) {
				seen[attrName] = true;
				attrs.push(attrName);
			}
		}
		return attrs;
	}

	/**
	 * Callback to get widget attributes by introspecting widget modules
	 * Parses the widget source code to find getAttribute() calls
	 * Returns null if introspection fails (to trigger fallback in lang-tiddlywiki)
	 */
	function getWidgetAttributes(widgetName) {
		// Check cache first
		if(widgetAttributesCache.hasOwnProperty(widgetName)) {
			return widgetAttributesCache[widgetName];
		}

		// Get the widget module name (remove $ prefix for module lookup)
		var moduleName = widgetName.slice(1); // e.g., "$button" -> "button"

		// Try to find and parse widget source code
		var allAttrs = [];
		var seenAttrs = {};

		$tw.modules.forEachModuleOfType("widget", function(title, mod) {
			if(mod && mod[moduleName]) {
				var source = $tw.wiki.getTiddlerText(title, "");
				if(source) {
					var attrs = parseAttributesFromSource(source);
					for(var i = 0; i < attrs.length; i++) {
						if(!seenAttrs[attrs[i]]) {
							seenAttrs[attrs[i]] = true;
							allAttrs.push(attrs[i]);
						}
					}
				}
			}
		});

		// Return null if no attributes found (triggers fallback in lang-tiddlywiki)
		var result = allAttrs.length > 0 ? allAttrs : null;
		widgetAttributesCache[widgetName] = result;
		return result;
	}

	// Get available code languages (includes CSS, JS, etc. if their plugins are loaded)
	var codeLanguages = core.getLanguages ? core.getLanguages() : [];

	// Register TiddlyWiki wikitext with completion callbacks
	core.registerLanguage(LanguageDescription.of({
		name: "TiddlyWiki",
		alias: ["tiddlywiki", "wikitext", "tw", "tw5"],
		extensions: ["tid"],
		support: langTw.tiddlywiki({
			// Code languages for nested parsing (CSS in <style> tags, etc.)
			codeLanguages: codeLanguages,

			// Completion callbacks - provide TiddlyWiki data to the parser
			getTiddlerTitles: getTiddlerTitles,
			getImageTiddlerTitles: getImageTiddlerTitles,
			getMacroNames: getMacroNames,
			getMacroParams: getMacroParams,
			getWidgetNames: getWidgetNames,
			getWidgetAttributes: getWidgetAttributes,
			getFilterOperators: getFilterOperators,
			getFieldNames: getFieldNames,
			getTagNames: getTagNames,
			getFunctionNames: getFunctionNames,
			getVariableNames: getVariableNames,
			getTiddlerIndexes: getTiddlerIndexes,
			getTiddlerFields: getTiddlerFields,
			getStoryViews: getStoryViews,
			getDeserializers: getDeserializers,

			// Enable all completions
			completeTiddlers: true,
			completeMacros: true,
			completeWidgets: true,
			completeFilterOperators: true,
			completeFilterRunPrefixes: true,
			completeHTMLTags: true,

			// Self-closing widgets callback (called dynamically for live config updates)
			getSelfClosingWidgets: getSelfClosingWidgets
		})
	}));

	// Export cache clear function for external use
	if(!$tw.CodeMirror) {
		$tw.CodeMirror = {};
	}
	$tw.CodeMirror.clearAutocompleteCache = clearCache;
};
