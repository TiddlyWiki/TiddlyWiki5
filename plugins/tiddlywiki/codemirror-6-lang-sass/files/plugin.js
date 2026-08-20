/*\
title: $:/plugins/tiddlywiki/codemirror-6-lang-sass/plugin.js
type: application/javascript
module-type: codemirror6-plugin

Sass/SCSS language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var hasConfiguredTag;
try {
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	return;
}

if(!hasConfiguredTag) return;

/*
The language grammar is required on first use, not at module load.

Every codemirror6-plugin module is executed when the language registry runs, so a
top-level require here pulled this grammar -- and the CodeMirror dependency graph
behind it -- into the boot path of any wiki with this plugin installed, whether or
not a file of this type was ever opened. require() is memoised by TiddlyWiki, so the
work still happens exactly once, on the first editor that needs it.
*/
var langSass;
function _langSass() {
	if(langSass === undefined) {
		try {
			langSass = require("$:/plugins/tiddlywiki/codemirror-6-lang-sass/lang-sass.js") || null;
		} catch (e) {
			langSass = null;
		}
	}
	return langSass;
}

// Content types that activate this plugin
var SASS_TYPES = [
	"text/x-sass",
	"text/x-scss"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-sass/tags";

function isSassType(type) {
	return SASS_TYPES.indexOf(type) !== -1;
}

exports.plugin = {
	name: "lang-sass",
	description: "Sass/SCSS syntax highlighting",
	priority: 50,

	/*
	Expose the real content types handled by this plugin.

	This lets the engine resolve a winning tag override to a real Sass/SCSS
	language mode.
	*/
	contentTypes: SASS_TYPES,
	types: SASS_TYPES,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;

		return {
			sassLanguage: new Compartment()
		};
	},

	getTagOverrideType: function(context) {
		if(context.tagOverrideWinner === TAGS_CONFIG_TIDDLER) {
			/*
			Default tag override to SCSS because it is usually the more common
			Sass syntax in code snippets.
			*/
			return "text/x-scss";
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
				isSassType(effectiveType);
		}

		/*
		Normal mode:
		- dropdown/session override
		- codemirror-type field
		- actual type field
		- configured Sass/SCSS language tag
		*/
		if(isSassType(effectiveType)) return true;
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;

		return false;
	},

	/*
	Runtime language switching uses this.

	This must return raw compartment content only.
	Do not return sassLanguage.of(...) from here.
	*/
	getCompartmentContent: function(context) {
		var effectiveType = context.effectiveType || context.tiddlerType || "";

		/*
		If your _langSass().sass() wrapper supports an option or separate mode
		for indented Sass vs SCSS, this is the place to branch on:

			text/x-sass
			text/x-scss

		For now we preserve your existing behavior and use _langSass().sass().
		*/
		if(effectiveType === "text/x-sass" && _langSass().sass) {
			return [
				_langSass().sass()
			];
		}

		return [
			_langSass().sass()
		];
	},

	/*
	Initial editor construction uses this.

	This may wrap the raw content in the plugin's compartment.
	*/
	getExtensions: function(context) {
		var compartments = context.engine._compartments;

		if(compartments.sassLanguage) {
			return [
				compartments.sassLanguage.of(
					this.getCompartmentContent(context)
				)
			];
		}

		return this.getCompartmentContent(context);
	}
};
