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
			var tr = state.tr.delete(start, end);
			wrapIn(bqType)(tr.doc.resolve(start).node() ? state : state, function(wrapped) { tr = wrapped; });
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
	// *italic* (only single asterisk, not preceded by another *)
	if(marks.em) {
		rules.push(markInputRule(/(?<!\*)\*([^\*]+)\*$/, marks.em));
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

	return rules;
}

exports.getMarkdownInputRules = getMarkdownInputRules;
