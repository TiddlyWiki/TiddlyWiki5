/*\
title: $:/plugins/tiddlywiki/codemirror-6-lang-python/plugin.js
type: application/javascript
module-type: codemirror6-plugin

Python language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var core, hasConfiguredTag;
try {
	core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	return;
}

if(!core || !hasConfiguredTag) return;

/*
The language grammar is required on first use, not at module load.

Every codemirror6-plugin module is executed when the language registry runs, so a
top-level require here pulled this grammar -- and the CodeMirror dependency graph
behind it -- into the boot path of any wiki with this plugin installed, whether or
not a file of this type was ever opened. require() is memoised by TiddlyWiki, so the
work still happens exactly once, on the first editor that needs it.
*/
var langPython;
function _langPython() {
	if(langPython === undefined) {
		try {
			langPython = require("$:/plugins/tiddlywiki/codemirror-6-lang-python/lang-python.js") || null;
		} catch (e) {
			langPython = null;
		}
	}
	return langPython;
}

// Content types that activate this plugin
var PYTHON_TYPES = [
	"text/x-python",
	"application/x-python"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-python/tags";

function isPythonType(type) {
	return PYTHON_TYPES.indexOf(type) !== -1;
}

exports.plugin = {
	name: "lang-python",
	description: "Python syntax highlighting",
	priority: 50,

	/*
	Expose the real content types handled by this plugin.

	This lets the engine resolve a winning tag override to a real Python
	language mode.
	*/
	contentTypes: PYTHON_TYPES,
	types: PYTHON_TYPES,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;

		return {
			pythonLanguage: new Compartment()
		};
	},

	getTagOverrideType: function(context) {
		if(context.tagOverrideWinner === TAGS_CONFIG_TIDDLER) {
			return PYTHON_TYPES[0];
		}

		return null;
	},

	condition: function(context) {
		var effectiveType = context.effectiveType || context.tiddlerType || "";

		/*
		If a tag override is active, only the winning tag/plugin may activate.

		Do not use hasConfiguredTag() here. A tiddler may contain multiple
		configured language tags, but the engine has already selected the
		winner.
		*/
		if(context.hasTagOverride) {
			return context.tagOverrideWinner === TAGS_CONFIG_TIDDLER ||
				isPythonType(effectiveType);
		}

		/*
		Normal mode:
		- dropdown/session override
		- codemirror-type field
		- actual type field
		- configured Python language tag
		*/
		if(isPythonType(effectiveType)) return true;
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;

		return false;
	},

	/*
	Runtime language switching uses this.

	This must return raw compartment content only.
	Do not return pythonLanguage.of(...) from here.
	*/
	getCompartmentContent: function(_context) {
		var extensions = [
			_langPython().python()
		];

		// Add Python completions, registered by register.js at startup
		if(core.pythonCompletionExtension) {
			extensions.push(core.pythonCompletionExtension);
		}

		return extensions;
	},

	/*
	Initial editor construction uses this.

	This may wrap the raw content in the plugin's compartment.
	*/
	getExtensions: function(context) {
		var compartments = context.engine._compartments;

		if(compartments.pythonLanguage) {
			return [
				compartments.pythonLanguage.of(
					this.getCompartmentContent(context)
				)
			];
		}

		return this.getCompartmentContent(context);
	}
};
