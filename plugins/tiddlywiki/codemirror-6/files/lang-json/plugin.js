/*\
title: $:/plugins/tiddlywiki/codemirror-6/lang-json/plugin.js
type: application/javascript
module-type: codemirror6-plugin

JSON language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langJson, hasConfiguredTag;
try {
	langJson = require("$:/plugins/tiddlywiki/codemirror-6/lang-json/lang-json.js");
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	return;
}

if(!langJson || !hasConfiguredTag) return;

// Try to load lint library (may not be available if lint plugin not installed)
var lintLib = null;
try {
	lintLib = require("$:/plugins/tiddlywiki/codemirror-6-lint/codemirror-lint.js");
} catch (_e) {
	// Lint library not available
}

// Content types that activate this plugin
var JSON_TYPES = [
	"application/json",
	"text/json"
];

var TAGS_CONFIG_TIDDLER = "$:/config/codemirror-6/lang-json/tags";
var LINT_ENABLED_CONFIG = "$:/config/codemirror-6/lint/enabled";

function isJsonType(type) {
	return JSON_TYPES.indexOf(type) !== -1;
}

/**
 * Check if linting is globally enabled
 */
function isLintEnabled() {
	if($tw && $tw.wiki) {
		var enabled = ($tw.wiki.getTiddlerText(LINT_ENABLED_CONFIG, "yes") || "").trim();
		return enabled === "yes";
	}
	return true;
}

/**
 * Check if linting is disabled for a specific tiddler
 */
function isLintDisabledForTiddler(tiddlerTitle) {
	if(!$tw || !$tw.wiki || !tiddlerTitle) return false;
	return $tw.wiki.tiddlerExists("$:/temp/codemirror-6/lint-disabled/" + tiddlerTitle);
}

/**
 * Build lint extensions for JSON
 */
function buildLintExtensions() {
	var extensions = [];

	if(lintLib && lintLib.linter && langJson.jsonParseLinter) {
		extensions.push(lintLib.linter(langJson.jsonParseLinter()));

		if(lintLib.lintGutter) {
			extensions.push(lintLib.lintGutter());
		}
	}

	return extensions;
}

exports.plugin = {
	name: "lang-json",
	description: "JSON syntax highlighting and linting",
	priority: 50,

	/*
	Expose the real content types handled by this plugin.

	This allows the engine to resolve a winning tag override to a real
	language mode instead of treating the tag as a side condition only.
	*/
	contentTypes: JSON_TYPES,
	types: JSON_TYPES,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;

		return {
			jsonLanguage: new Compartment(),
			jsonLint: new Compartment()
		};
	},

	getTagOverrideType: function(context) {
		if(context.tagOverrideWinner === TAGS_CONFIG_TIDDLER) {
			return JSON_TYPES[0];
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
				isJsonType(effectiveType);
		}

		/*
		Normal mode:
		- dropdown/session override
		- codemirror-type field
		- actual type field
		- configured JSON language tag
		*/
		if(isJsonType(effectiveType)) return true;
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;

		return false;
	},

	/*
	Runtime language switching uses this.

	This must return raw content for jsonLanguage only.
	Do not return jsonLanguage.of(...) from here.
	*/
	getCompartmentContent: function(_context) {
		return [
			langJson.json()
		];
	},

	/*
	Separate raw content for the lint compartment.
	*/
	getLintContent: function(context) {
		var tiddlerTitle = context.tiddlerTitle;

		if(!isLintEnabled()) return [];
		if(tiddlerTitle && isLintDisabledForTiddler(tiddlerTitle)) return [];

		return buildLintExtensions();
	},

	/*
	Initial editor construction uses this.

	This may wrap raw content in compartments.
	*/
	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		var extensions = [];

		if(compartments.jsonLanguage) {
			extensions.push(
				compartments.jsonLanguage.of(
					this.getCompartmentContent(context)
				)
			);
		} else {
			extensions = extensions.concat(this.getCompartmentContent(context));
		}

		if(compartments.jsonLint) {
			extensions.push(
				compartments.jsonLint.of(
					this.getLintContent(context)
				)
			);
		} else {
			extensions = extensions.concat(this.getLintContent(context));
		}

		return extensions;
	},

	/**
	 * Handle tiddler changes - reconfigure lint if settings changed
	 */
	onRefresh: function(widget, changedTiddlers) {
		if(!widget || !widget.engine || !widget.engine.view) return;

		var engine = widget.engine;
		var context = engine._pluginContext || {};
		var tiddlerTitle = context.tiddlerTitle;
		var compartment = engine._compartments && engine._compartments.jsonLint;

		if(!compartment) return;

		var lintConfigChanged = false;
		var perTiddlerDisableTiddler = tiddlerTitle ? "$:/temp/codemirror-6/lint-disabled/" + tiddlerTitle : null;

		for(var title in changedTiddlers) {
			if(title === LINT_ENABLED_CONFIG) {
				lintConfigChanged = true;
			} else if(perTiddlerDisableTiddler && title === perTiddlerDisableTiddler) {
				lintConfigChanged = true;
			}
		}

		if(lintConfigChanged) {
			try {
				engine.view.dispatch({
					effects: compartment.reconfigure(this.getLintContent(context))
				});
			} catch (_e) {}
		}
	},

	/**
	 * Message handlers
	 */
	onMessage: {
		/**
		 * Handle tm-cm6-toggle-lint message
		 */
		"tm-cm6-toggle-lint": function(widget, _event) {
			if(!widget || !widget.engine || !widget.engine.view) return;

			var engine = widget.engine;
			var context = engine._pluginContext || {};
			var tiddlerTitle = context.tiddlerTitle;
			var compartment = engine._compartments && engine._compartments.jsonLint;

			if(!compartment || !tiddlerTitle) return;

			var perTiddlerDisabled = isLintDisabledForTiddler(tiddlerTitle);
			var disableTiddler = "$:/temp/codemirror-6/lint-disabled/" + tiddlerTitle;

			if(perTiddlerDisabled) {
				$tw.wiki.deleteTiddler(disableTiddler);
			} else {
				$tw.wiki.addTiddler({
					title: disableTiddler,
					text: "disabled"
				});
			}

			var newPerTiddlerDisabled = !perTiddlerDisabled;
			var newEnabled = isLintEnabled() && !newPerTiddlerDisabled;
			var newContent = newEnabled ? buildLintExtensions() : [];

			try {
				engine.view.dispatch({
					effects: compartment.reconfigure(newContent)
				});
			} catch (_e) {}
		}
	}
};
