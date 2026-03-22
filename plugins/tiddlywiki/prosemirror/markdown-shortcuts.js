/*\
title: $:/plugins/tiddlywiki/prosemirror/markdown-shortcuts.js
type: application/javascript
module-type: library

Markdown-style input rules for ProseMirror.
Converts **bold**, *italic*, ~~strike~~, `code` etc. into PM marks.
These produce wikitext-native marks (not Markdown) so the output is always wikitext.
Enabled/disabled via $:/config/prosemirror/markdown-shortcuts.

\*/

"use strict";

var InputRule = require("prosemirror-inputrules").InputRule;
var TextSelection = require("prosemirror-state").TextSelection;

/**
 * Create an input rule that wraps the matched text in a mark.
 * @param {RegExp} regexp - Must have a capture group for the text between delimiters
 * @param {MarkType} markType - The PM mark type to apply
 * @param {number} [groupIndex=1] - The capture group index for the inner text
 */
function markInputRule(regexp, markType, groupIndex) {
	groupIndex = groupIndex || 1;
	return new InputRule(regexp, function(state, match, start, end) {
		var innerText = match[groupIndex];
		if(!innerText) return null;
		var tr = state.tr;
		// Replace the full matched text with just the inner text + mark
		tr.delete(start, end);
		tr.insertText(innerText, start);
		var markFrom = start;
		var markTo = start + innerText.length;
		tr.addMark(markFrom, markTo, markType.create());
		// Move cursor after the marked text
		tr.setSelection(TextSelection.create(tr.doc, markTo));
		// Remove stored marks so next typing is unmarked
		tr.removeStoredMark(markType);
		return tr;
	});
}

/**
 * Create an input rule for heading shorthand: # text at start of line.
 * Only match at the very start of a textblock.
 */
function headingInputRule(schema) {
	var headingType = schema.nodes.heading;
	if(!headingType) return [];
	return [
		// # Heading 1 (must be at start of textblock; triggered by Space)
		new InputRule(/^#\s$/, function(state, match, start, end) {
			return state.tr.delete(start, end).setBlockType(start, start, headingType, { level: 1 });
		}),
		new InputRule(/^##\s$/, function(state, match, start, end) {
			return state.tr.delete(start, end).setBlockType(start, start, headingType, { level: 2 });
		}),
		new InputRule(/^###\s$/, function(state, match, start, end) {
			return state.tr.delete(start, end).setBlockType(start, start, headingType, { level: 3 });
		}),
		new InputRule(/^####\s$/, function(state, match, start, end) {
			return state.tr.delete(start, end).setBlockType(start, start, headingType, { level: 4 });
		}),
		new InputRule(/^#####\s$/, function(state, match, start, end) {
			return state.tr.delete(start, end).setBlockType(start, start, headingType, { level: 5 });
		}),
		new InputRule(/^######\s$/, function(state, match, start, end) {
			return state.tr.delete(start, end).setBlockType(start, start, headingType, { level: 6 });
		})
	];
}

/**
 * Create an input rule for blockquote: > at start of line.
 */
function blockquoteInputRule(schema) {
	var bqType = schema.nodes.blockquote;
	if(!bqType) return [];
	var wrapIn = require("prosemirror-commands").wrapIn;
	return [
		new InputRule(/^>\s$/, function(state, match, start, end) {
			// Delete the "> " trigger text first
			var tr = state.tr.delete(start, end);
			// Apply wrapIn on the resulting state after deletion
			var newState = state.apply(tr);
			var wrapTr = null;
			wrapIn(bqType)(newState, function(t) { wrapTr = t; });
			if(wrapTr) {
				// Combine: first delete, then wrap. Rebuild from scratch using
				// the steps from both transactions.
				var combined = state.tr.delete(start, end);
				for(var si = 0; si < wrapTr.steps.length; si++) {
					combined.step(wrapTr.steps[si]);
				}
				return combined;
			}
			return tr;
		})
	];
}

/**
 * Create an input rule for horizontal rule: --- at start of line.
 */
function hrInputRule(schema) {
	var hrType = schema.nodes.horizontal_rule;
	if(!hrType) return [];
	return [
		new InputRule(/^---$/, function(state, match, start, end) {
			return state.tr.replaceWith(start - 1, end, [
				hrType.create(),
				schema.nodes.paragraph.createAndFill()
			]);
		})
	];
}

/**
 * Create an input rule for code blocks: ``` at start of line.
 */
function codeBlockInputRule(schema) {
	var cbType = schema.nodes.code_block;
	if(!cbType) return [];
	return [
		new InputRule(/^```$/, function(state, match, start, end) {
			return state.tr.delete(start - 1, end).setBlockType(start - 1, start - 1, cbType);
		})
	];
}

/**
 * Get all markdown-style input rules for the given schema.
 * Only returns rules if the setting is enabled.
 */
function getMarkdownInputRules(wiki, schema) {
	var enabled = wiki.getTiddlerText("$:/config/prosemirror/markdown-shortcuts", "no");
	if(enabled !== "yes") return [];

	var rules = [];
	var marks = schema.marks;

	// **bold** 
	if(marks.strong) {
		rules.push(markInputRule(/\*\*([^\*]+)\*\*$/, marks.strong));
	}
	// *italic* (only single asterisk — match when preceded by whitespace or start of line)
	if(marks.em) {
		rules.push(markInputRule(/(?:^|[\s\u00A0])\*([^\*]+)\*$/, marks.em));
	}
	// ~~strikethrough~~
	if(marks.strike) {
		rules.push(markInputRule(/~~([^~]+)~~$/, marks.strike));
	}
	// `code`
	if(marks.code) {
		rules.push(markInputRule(/`([^`]+)`$/, marks.code));
	}

	// Heading shortcuts: # ## ### etc.
	rules = rules.concat(headingInputRule(schema));

	// Horizontal rule: ---
	rules = rules.concat(hrInputRule(schema));

	// Code block: ```
	rules = rules.concat(codeBlockInputRule(schema));

	// Definition list shortcuts: ; and ：for term, : and ： for description
	rules = rules.concat(definitionListInputRules(schema, wiki));

	return rules;
}

/**
 * Input rules for definition list (;/: wikitext syntax).
 * Supports alias triggers configured in $:/config/prosemirror/autocomplete/def-term-triggers
 * and $:/config/prosemirror/autocomplete/def-desc-triggers.
 */
function definitionListInputRules(schema, wiki) {
	var rules = [];
	var dtType = schema.nodes.definition_term;
	var ddType = schema.nodes.definition_description;
	var dlType = schema.nodes.definition_list;
	if(!dtType || !ddType || !dlType) return rules;

	// Default triggers: ; and ；for <dt>, : and ：for <dd>
	var termTriggers = parseTriggerList(wiki, "$:/config/prosemirror/def-term-triggers", [";", "；"]);
	var descTriggers = parseTriggerList(wiki, "$:/config/prosemirror/def-desc-triggers", [":", "："]);

	termTriggers.forEach(function(trig) {
		var escaped = trig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		var pattern = new RegExp("^" + escaped + "\\s$");
		rules.push(new InputRule(pattern, function(state, match, start, end) {
			return createDefListItem(state, start, end, dlType, dtType);
		}));
	});

	descTriggers.forEach(function(trig) {
		var escaped = trig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		var pattern = new RegExp("^" + escaped + "\\s$");
		rules.push(new InputRule(pattern, function(state, match, start, end) {
			return createDefListItem(state, start, end, dlType, ddType);
		}));
	});

	return rules;
}

function parseTriggerList(wiki, title, defaults) {
	var text = wiki.getTiddlerText(title, "");
	if(!text.trim()) return defaults;
	return text.split("\n").map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });
}

function createDefListItem(state, start, end, dlType, itemType) {
	var $pos = state.doc.resolve(start);
	// Only convert if we're in a paragraph that's a direct child of doc or a definition_list
	if(!$pos.parent.isTextblock) return null;
	var tr = state.tr.delete(start, end);
	// Replace the paragraph with a definition_list containing the item
	var blockStart = $pos.before($pos.depth);
	var blockEnd = $pos.after($pos.depth);
	var dl = dlType.create(null, [itemType.create()]);
	tr = tr.replaceWith(blockStart, blockEnd, dl);
	// Place cursor inside the new item
	return tr.setSelection(TextSelection.create(tr.doc, blockStart + 2));
}

exports.getMarkdownInputRules = getMarkdownInputRules;
