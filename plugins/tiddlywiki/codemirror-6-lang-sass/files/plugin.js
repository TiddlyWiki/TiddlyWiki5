/*\
title: $:/plugins/tiddlywiki/codemirror-6-lang-sass/plugin.js
type: application/javascript
module-type: codemirror6-plugin

Sass/SCSS language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langSass, hasConfiguredTag;
try {
	langSass = require("$:/plugins/tiddlywiki/codemirror-6-lang-sass/lang-sass.js");
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	return;
}

if(!langSass || !hasConfiguredTag) return;

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
		If your langSass.sass() wrapper supports an option or separate mode
		for indented Sass vs SCSS, this is the place to branch on:

			text/x-sass
			text/x-scss

		For now we preserve your existing behavior and use langSass.sass().
		*/
		if(effectiveType === "text/x-sass" && langSass.sass) {
			return [
				langSass.sass()
			];
		}

		return [
			langSass.sass()
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
