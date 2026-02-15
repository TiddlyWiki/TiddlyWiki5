/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-json/plugin.js
type: application/javascript
module-type: codemirror6-plugin

JSON language support for CodeMirror 6

\*/
/*jslint node: true, browser: true */
"use strict";

// Dependency check - exit early if core editor plugin is not available
var langJson, hasConfiguredTag;
try {
	langJson = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-json/lang-json.js");
	hasConfiguredTag = require("$:/plugins/tiddlywiki/codemirror-6/utils.js").hasConfiguredTag;
} catch (e) {
	return;
}

if(!langJson || !hasConfiguredTag) return;

// Try to load lint library (may not be available if lint plugin not installed)
var lintLib = null;
try {
	lintLib = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lint/codemirror-lint.js");
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

	condition: function(context) {
		// If any tag override is active, only the winning plugin activates
		if(context.hasTagOverride) {
			return context.tagOverrideWinner === TAGS_CONFIG_TIDDLER;
		}
		// Normal mode: tag match or type match
		if(hasConfiguredTag(context, TAGS_CONFIG_TIDDLER)) return true;
		return JSON_TYPES.indexOf(context.tiddlerType) !== -1;
	},

	getCompartmentContent: function(_context) {
		// Language only - lint is in separate compartment
		return [langJson.json()];
	},

	getLintContent: function(context) {
		// Check if lint is enabled globally and for this tiddler
		var tiddlerTitle = context.tiddlerTitle;
		if(!isLintEnabled()) return [];
		if(tiddlerTitle && isLintDisabledForTiddler(tiddlerTitle)) return [];
		return buildLintExtensions();
	},

	getExtensions: function(context) {
		var compartments = context.engine._compartments;
		var extensions = [];

		// Language compartment
		if(compartments.jsonLanguage) {
			extensions.push(compartments.jsonLanguage.of(this.getCompartmentContent(context)));
		} else {
			extensions = extensions.concat(this.getCompartmentContent(context));
		}

		// Lint compartment (separate for toggle support)
		if(compartments.jsonLint) {
			extensions.push(compartments.jsonLint.of(this.getLintContent(context)));
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

		// Check if lint config changed
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
			var newContent = this.getLintContent(context);
			try {
				engine.view.dispatch({
					effects: compartment.reconfigure(newContent)
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

			// Toggle the per-tiddler state
			if(perTiddlerDisabled) {
				$tw.wiki.deleteTiddler(disableTiddler);
			} else {
				$tw.wiki.addTiddler({
					title: disableTiddler,
					text: "disabled"
				});
			}

			// Calculate new state after toggle
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
