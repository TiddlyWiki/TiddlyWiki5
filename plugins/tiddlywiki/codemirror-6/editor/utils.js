/*\
title: $:/plugins/tiddlywiki/codemirror-6/utils.js
type: application/javascript
module-type: library

Shared utilities for CodeMirror 6 language plugins

\*/
/*jslint node: true, browser: true */

"use strict";

/**
 * Check if a tiddler has any tag from a configured list
 * @param {Object} context - The plugin context
 * @param {string} configTiddler - The tiddler containing the list of tags (TiddlyWiki list format)
 * @returns {boolean} True if the tiddler has any of the configured tags
 */
exports.hasConfiguredTag = function(context, configTiddler) {
	var wiki = context.options && context.options.widget && context.options.widget.wiki;
	if(!wiki) return false;

	var tagsText = wiki.getTiddlerText(configTiddler, "");
	if(!tagsText.trim()) return false;

	// Use filterTiddlers to resolve the tiddler list
	var configuredTags = wiki.filterTiddlers(tagsText);
	if(!configuredTags || configuredTags.length === 0) return false;

	var tiddlerTags = context.tiddlerFields && context.tiddlerFields.tags;
	if(!tiddlerTags || !Array.isArray(tiddlerTags)) return false;

	for(var i = 0; i < configuredTags.length; i++) {
		if(tiddlerTags.indexOf(configuredTags[i]) !== -1) {
			return true;
		}
	}
	return false;
};

/**
 * Get the winning tag override plugin for this tiddler.
 * When multiple tags could activate different languages, the FIRST tag
 * on the tiddler that matches any language config wins.
 *
 * @param {Object} context - The plugin context
 * @returns {string|null} The config tiddler path of the winning plugin, or null if no tag override
 */
exports.getTagOverrideWinner = function(context) {
	var wiki = context.options && context.options.widget && context.options.widget.wiki;
	if(!wiki) return null;

	var tiddlerTags = context.tiddlerFields && context.tiddlerFields.tags;
	if(!tiddlerTags || !Array.isArray(tiddlerTags) || tiddlerTags.length === 0) return null;

	// Find all tag config tiddlers using a filter
	var tagConfigTiddlers = wiki.filterTiddlers("[prefix[$:/config/codemirror-6/lang-]suffix[/tags]]");
	if(!tagConfigTiddlers || tagConfigTiddlers.length === 0) return null;

	// Build a map of tag -> config tiddler for quick lookup
	var tagToConfig = {};
	for(var i = 0; i < tagConfigTiddlers.length; i++) {
		var configTiddler = tagConfigTiddlers[i];
		var tagsText = wiki.getTiddlerText(configTiddler, "");
		if(!tagsText.trim()) continue;

		var configuredTags = wiki.filterTiddlers(tagsText);
		if(!configuredTags || configuredTags.length === 0) continue;

		for(var j = 0; j < configuredTags.length; j++) {
			// First config to claim a tag wins (in case same tag in multiple configs)
			if(!tagToConfig[configuredTags[j]]) {
				tagToConfig[configuredTags[j]] = configTiddler;
			}
		}
	}

	// Check tiddler's tags in order - first match wins
	for(var k = 0; k < tiddlerTags.length; k++) {
		var tag = tiddlerTags[k];
		if(tagToConfig[tag]) {
			return tagToConfig[tag];
		}
	}

	return null;
};

/**
 * Check if any language plugin has a tag override for this tiddler.
 * This is used to determine if type-based language detection should be skipped.
 * @param {Object} context - The plugin context
 * @returns {boolean} True if any tag override is active
 */
exports.hasAnyTagOverride = function(context) {
	return exports.getTagOverrideWinner(context) !== null;
};
