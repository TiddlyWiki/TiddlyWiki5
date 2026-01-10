/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/emoji-picker/emoji-picker.js
type: application/javascript
module-type: codemirror6-plugin

CodeMirror 6 Emoji Picker - provides :shortcode: autocomplete for emojis
Uses CM6 autocomplete system for proper popup display

\*/
"use strict";

// Only run in browser
if(!$tw.browser) return;

// ============================================================
// Configuration
// ============================================================

var PLUGIN_BASE = "$:/plugins/tiddlywiki/codemirror-6/plugins/emoji-picker";

var CONFIG = {
	categoryTiddlers: [
		PLUGIN_BASE + "/data/smileys-emotion",
		PLUGIN_BASE + "/data/people-body",
		PLUGIN_BASE + "/data/animals-nature",
		PLUGIN_BASE + "/data/food-drink",
		PLUGIN_BASE + "/data/travel-places",
		PLUGIN_BASE + "/data/activities",
		PLUGIN_BASE + "/data/objects",
		PLUGIN_BASE + "/data/symbols",
		PLUGIN_BASE + "/data/flags"
	],
	shortcodesTiddler: PLUGIN_BASE + "/shortcodes",
	minQueryLength: 2,
	maxResults: 50
};

// Skin tone labels
var SKIN_TONES = {
	1: "light",
	2: "medium-light",
	3: "medium",
	4: "medium-dark",
	5: "dark"
};

// ============================================================
// Emoji Data Management
// ============================================================

var EMOJI_DATA = null;
var SHORTCODES = null;
var SEARCH_INDEX = null;

/**
 * Load emoji data from category tiddlers
 */
function loadEmojiData() {
	if(EMOJI_DATA !== null) return EMOJI_DATA;

	try {
		EMOJI_DATA = [];

		CONFIG.categoryTiddlers.forEach(function(tiddlerTitle) {
			var json = $tw.wiki.getTiddlerText(tiddlerTitle);
			if(json) {
				try {
					var categoryEmojis = JSON.parse(json);
					if(Array.isArray(categoryEmojis)) {
						EMOJI_DATA = EMOJI_DATA.concat(categoryEmojis);
					}
				} catch (_parseError) {}
			}
		});


		// Load shortcodes
		var shortcodesJson = $tw.wiki.getTiddlerText(CONFIG.shortcodesTiddler);
		if(shortcodesJson) {
			SHORTCODES = JSON.parse(shortcodesJson);
		} else {
			SHORTCODES = {};
		}

		// Build search index
		buildSearchIndex();

	} catch (_e) {
		EMOJI_DATA = [];
		SHORTCODES = {};
	}

	return EMOJI_DATA;
}

/**
 * Build search index including skin variants
 */
function buildSearchIndex() {
	SEARCH_INDEX = [];

	EMOJI_DATA.forEach(function(emoji) {
		var shortcodes = SHORTCODES[emoji.hexcode] || [];
		var shortcodeArray = Array.isArray(shortcodes) ? shortcodes : [shortcodes];

		// Add base emoji
		SEARCH_INDEX.push({
			emoji: emoji.emoji,
			annotation: emoji.annotation || "",
			tags: emoji.tags || [],
			shortcodes: shortcodeArray,
			hexcode: emoji.hexcode
		});

		// Add skin tone variants
		if(emoji.skins) {
			emoji.skins.forEach(function(skin) {
				var toneLabel = Array.isArray(skin.tone) ?
					skin.tone.map(function(t) {
						return SKIN_TONES[t];
					}).join(", ") :
					SKIN_TONES[skin.tone];

				SEARCH_INDEX.push({
					emoji: skin.emoji,
					annotation: skin.annotation || (emoji.annotation + ": " + toneLabel + " skin tone"),
					tags: (emoji.tags || []).concat([toneLabel, "skin tone"]),
					shortcodes: shortcodeArray.map(function(sc) {
						return sc + "_tone" + (Array.isArray(skin.tone) ? skin.tone.join("_") : skin.tone);
					}),
					hexcode: skin.hexcode
				});
			});
		}
	});

}

/**
 * Search emojis by query
 */
function searchEmojis(query) {
	loadEmojiData();
	if(!SEARCH_INDEX || !query || query.length < CONFIG.minQueryLength) return [];

	var q = query.toLowerCase();
	var exactMatches = [];
	var prefixMatches = [];
	var containsMatches = [];
	var seen = {};

	SEARCH_INDEX.forEach(function(entry, idx) {
		if(seen[idx]) return;

		// Check shortcodes for exact match
		var hasExactShortcode = entry.shortcodes.some(function(sc) {
			return sc.toLowerCase() === q;
		});
		if(hasExactShortcode) {
			exactMatches.push(entry);
			seen[idx] = true;
			return;
		}

		// Check shortcodes for prefix match
		var hasPrefixShortcode = entry.shortcodes.some(function(sc) {
			return sc.toLowerCase().indexOf(q) === 0;
		});
		if(hasPrefixShortcode) {
			prefixMatches.push(entry);
			seen[idx] = true;
			return;
		}

		// Check tags for prefix match
		var hasPrefixTag = entry.tags.some(function(t) {
			return t.toLowerCase().indexOf(q) === 0;
		});
		if(hasPrefixTag) {
			prefixMatches.push(entry);
			seen[idx] = true;
			return;
		}

		// Check annotation for prefix match
		if(entry.annotation.toLowerCase().indexOf(q) === 0) {
			prefixMatches.push(entry);
			seen[idx] = true;
			return;
		}

		// Check shortcodes for contains match
		var hasContainsShortcode = entry.shortcodes.some(function(sc) {
			return sc.toLowerCase().indexOf(q) !== -1;
		});
		if(hasContainsShortcode) {
			containsMatches.push(entry);
			seen[idx] = true;
			return;
		}

		// Check tags for contains match
		var hasContainsTag = entry.tags.some(function(t) {
			return t.toLowerCase().indexOf(q) !== -1;
		});
		if(hasContainsTag) {
			containsMatches.push(entry);
			seen[idx] = true;
			return;
		}

		// Check annotation for contains match
		if(entry.annotation.toLowerCase().indexOf(q) !== -1) {
			containsMatches.push(entry);
			seen[idx] = true;
		}
	});

	return exactMatches.concat(prefixMatches).concat(containsMatches).slice(0, CONFIG.maxResults);
}

// ============================================================
// Completion Source
// ============================================================

// Cache syntaxTree function
var _syntaxTree = null;

/**
 * Check if position is inside a filter expression
 */
function isInsideFilter(context) {
	if(!_syntaxTree) return false;

	try {
		var tree = _syntaxTree(context.state);
		if(!tree) return false;

		var node = tree.resolveInner(context.pos, -1);
		while(node) {
			var name = node.type.name;
			// Check for filter-related nodes
			if(name === "FilterExpression" || name === "FilterOperator" ||
				name === "FilterRun" || name === "FilterStep" ||
				name === "FilterOperand" || name === "Filter" ||
				name === "TranscludedFilter" || name === "FilteredTransclusion") {
				return true;
			}
			node = node.parent;
		}
	} catch (_e) {
		// Ignore errors
	}
	return false;
}

/**
 * Emoji completion source for CM6 autocomplete
 */
function emojiCompletions(context) {
	// Don't trigger inside filter expressions (where : is used for suffixes like search:literal)
	if(isInsideFilter(context)) {
		return null;
	}

	// Look for :query pattern
	var match = context.matchBefore(/:[a-zA-Z0-9_+-]*$/);
	if(!match) return null;

	// Don't trigger after URL protocols (mailto:, tel:, http:, https:, ftp:, file:, data:, javascript:, geo:)
	var textBefore = context.state.sliceDoc(Math.max(0, match.from - 15), match.from);
	if(/(?:^|[\s\[({<])(?:mailto|tel|https?|ftp|file|data|javascript|geo)$/i.test(textBefore)) {
		return null;
	}

	// Extract query (without the colon)
	var query = match.text.slice(1);

	// Don't show completions for empty or too short queries
	if(query.length < CONFIG.minQueryLength) {
		return {
			from: match.from,
			options: [],
			filter: false
		};
	}

	var results = searchEmojis(query);
	if(results.length === 0) return null;

	var triggerLen = match.text.length;
	var options = results.map(function(entry) {
		var shortcode = entry.shortcodes[0] || entry.annotation.replace(/\s+/g, "_").toLowerCase();
		return {
			label: ":" + shortcode + ":",
			displayLabel: entry.emoji + " :" + shortcode + ":",
			detail: entry.annotation,
			type: "emoji",
			boost: 1,
			apply: function(view, completion, from, to) {
				var selections = view.state.selection.ranges;
				var mainIndex = view.state.selection.mainIndex;

				// Insert emoji at all cursor positions
				var changes = selections.map(function(range, idx) {
					if(idx === mainIndex) {
						return {
							from: from,
							to: to,
							insert: entry.emoji
						};
					} else {
						// Other cursors: replace the same trigger length
						return {
							from: range.from - triggerLen,
							to: range.from,
							insert: entry.emoji
						};
					}
				});
				view.dispatch({
					changes: changes
				});
			}
		};
	});

	return {
		from: match.from,
		options: options,
		filter: false // We do our own filtering
	};
}

// ============================================================
// Plugin Definition
// ============================================================

exports.plugin = {
	name: "emoji-picker",
	description: "Emoji picker with :shortcode: autocomplete",
	priority: 550,

	// Check if enabled in config
	condition: function(context) {
		var wiki = context.options && context.options.widget && context.options.widget.wiki;
		var enabled = wiki && wiki.getTiddlerText("$:/config/codemirror-6/emoji-picker/enabled", "yes");
		return enabled === "yes";
	},

	init: function(cm6Core) {
		this._core = cm6Core;
		// Get syntaxTree function for checking context
		if(cm6Core.language && cm6Core.language.syntaxTree) {
			_syntaxTree = cm6Core.language.syntaxTree;
		}
		// Preload emoji data
		setTimeout(function() {
			loadEmojiData();
		}, 100);
	},

	getExtensions: function(context) {
		var engine = context.engine;

		// Register completion source with the engine
		// Pass config tiddler for dynamic enable/disable
		if(engine && engine.registerCompletionSource) {
			engine.registerCompletionSource(
				emojiCompletions,
				10,
				"$:/config/codemirror-6/emoji-picker/enabled"
			);
		}

		return [];
	}
};
