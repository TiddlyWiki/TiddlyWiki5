/*\
title: $:/plugins/tiddlywiki/codemirror-6/utils.js
type: application/javascript
module-type: library

Shared utilities for CodeMirror 6 language plugins

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
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
