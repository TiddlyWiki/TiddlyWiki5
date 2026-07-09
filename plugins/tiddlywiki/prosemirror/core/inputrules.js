/*\
title: $:/plugins/tiddlywiki/prosemirror/core/inputrules.js
type: application/javascript
module-type: library

Build the ProseMirror input rules for the editor.
Supports configurable wikitext inline mark rules (bold, italic, etc.)
and wikilink auto-conversion.

\*/

"use strict";

const InputRule = require("prosemirror-inputrules").InputRule;
const inputRules = require("prosemirror-inputrules").inputRules;
const wrappingInputRule = require("prosemirror-inputrules").wrappingInputRule;
const textblockTypeInputRule = require("prosemirror-inputrules").textblockTypeInputRule;
const emDash = require("prosemirror-inputrules").emDash;
const ellipsis = require("prosemirror-inputrules").ellipsis;
const wrappingListInputRule = require("prosemirror-flat-list").wrappingListInputRule;
const TextSelection = require("prosemirror-state").TextSelection;

// ─────────────────────────────────────────────────────────────────────────────
// Configuration tiddler paths
// ─────────────────────────────────────────────────────────────────────────────
const GLOBAL_WIKITEXT_INLINE_TITLE = "$:/config/prosemirror/wikitext-inline-inputrules";

// ─────────────────────────────────────────────────────────────────────────────
// Declarative wikitext inline mark rules.
// Add a new entry here to enable real-time conversion for another syntax.
// ─────────────────────────────────────────────────────────────────────────────
const WIKITEXT_INLINE_MARK_RULES = [
	{ delimiter: "''", markType: "strong", name: "bold" },
	{ delimiter: "//", markType: "em", name: "italic" },
	{ delimiter: "__", markType: "underline", name: "underline" },
	{ delimiter: "^^", markType: "superscript", name: "superscript" },
	{ delimiter: ",,", markType: "subscript", name: "subscript" },
	{ delimiter: "~~", markType: "strike", name: "strikethrough" },
	{ delimiter: "`", markType: "code", name: "code" }
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function escapeRegex(string) {
	return string.replace(/[.*+?^${}()|[\]\\/]/g, function(match) {
		return "\\" + match;
	});
}

function markInputRule(regexp, markType, groupIndex) {
	groupIndex = groupIndex || 1;
	return new InputRule(regexp, (state, match, start, end) => {
		const innerText = match[groupIndex];
		if(!innerText) return null;
		const tr = state.tr;
		tr.delete(start, end);
		tr.insertText(innerText, start);
		const markFrom = start;
		const markTo = start + innerText.length;
		tr.addMark(markFrom, markTo, markType.create());
		tr.setSelection(TextSelection.create(tr.doc, markTo));
		tr.removeStoredMark(markType);
		return tr;
	});
}

function buildMarkInputRule(delimiter, markType) {
	const escaped = escapeRegex(delimiter);
	const forbiddenChar = escapeRegex(delimiter.charAt(0));
	const pattern = new RegExp(escaped + "([^" + forbiddenChar + "]+)" + escaped + "$");
	return markInputRule(pattern, markType);
}

function shouldEnableWikitextInlineRules(wiki) {
	if(!wiki) return true;
	const text = wiki.getTiddlerText(GLOBAL_WIKITEXT_INLINE_TITLE, "yes").trim().toLowerCase();
	return text !== "no";
}

function isRuleEnabled(wiki, ruleName) {
	if(!wiki) return true;
	const title = GLOBAL_WIKITEXT_INLINE_TITLE + "/" + ruleName;
	const text = wiki.getTiddlerText(title, "yes").trim().toLowerCase();
	return text !== "no";
}

// ─────────────────────────────────────────────────────────────────────────────
// Block-level rules
// ─────────────────────────────────────────────────────────────────────────────

function blockQuoteRule(nodeType) {
	return wrappingInputRule(/^\s*>\s$/, nodeType);
}

function codeBlockRule(nodeType) {
	return textblockTypeInputRule(/^```$/, nodeType);
}

function headingRule(nodeType, maxLevel) {
	return textblockTypeInputRule(new RegExp("^(\\!{1," + maxLevel + "}|\！{1," + maxLevel + "})\\s$"), nodeType, (match) => ({ level: match[1].length }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Wikilink rules
// ─────────────────────────────────────────────────────────────────────────────

function wikilinkWithTargetRule(markType) {
	return new InputRule(/\[\[([^\[\]|]+)\|([^\[\]|]+)\]\]$/, (state, match, start, end) => {
		// Guard against triple brackets e.g. [[[text|target]] — the regex
		// would match from the second "["; reject if the character before
		// the match is also "["
		if(start > 0 && state.doc.textBetween(start - 1, start) === "[") return null;
		const displayText = match[1];
		const target = match[2];
		if(!displayText || !target) return null;
		const tr = state.tr;
		tr.delete(start, end);
		tr.insertText(displayText, start);
		const markFrom = start;
		const markTo = start + displayText.length;
		tr.addMark(markFrom, markTo, markType.create({ href: target, title: null }));
		tr.setSelection(TextSelection.create(tr.doc, markTo));
		tr.removeStoredMark(markType);
		return tr;
	});
}

function wikilinkRule(markType) {
	return new InputRule(/\[\[([^\[\]|]+)\]\]$/, (state, match, start, end) => {
		// Guard against triple brackets e.g. [[[Target]] — the regex
		// would match from the second "["; reject if the character before
		// the match is also "["
		if(start > 0 && state.doc.textBetween(start - 1, start) === "[") return null;
		const innerText = match[1];
		if(!innerText) return null;
		const tr = state.tr;
		tr.delete(start, end);
		tr.insertText(innerText, start);
		const markFrom = start;
		const markTo = start + innerText.length;
		tr.addMark(markFrom, markTo, markType.create({ href: innerText, title: null }));
		tr.setSelection(TextSelection.create(tr.doc, markTo));
		tr.removeStoredMark(markType);
		return tr;
	});
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline rule builders
// ─────────────────────────────────────────────────────────────────────────────

function buildWikitextInlineRules(schema, options) {
	const rules = [];
	options = options || {};
	const wiki = options.wiki;

	if(!shouldEnableWikitextInlineRules(wiki)) {
		return rules;
	}

	// TW native inline mark syntax: ''bold'', //italic//, etc.
	WIKITEXT_INLINE_MARK_RULES.forEach((def) => {
		if(!isRuleEnabled(wiki, def.name)) return;
		const markType = schema.marks[def.markType];
		if(markType) {
			rules.push(buildMarkInputRule(def.delimiter, markType));
		}
	});

	// Wikilink syntax: [[Target]] and [[Display|Target]]
	const linkMark = schema.marks.link;
	if(linkMark) {
		rules.push(wikilinkWithTargetRule(linkMark));
		rules.push(wikilinkRule(linkMark));
	}

	return rules;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry
// ─────────────────────────────────────────────────────────────────────────────

function buildInputRules(schema, options) {
	let rules = [].concat(ellipsis, emDash);
	let type;
	type = schema.nodes.blockquote;
	if(type) {
		rules.push(blockQuoteRule(type));
	}
	type = schema.nodes.list;
	if(type) {
		rules.push(wrappingListInputRule(/^\s?([*-])\s$/, {
			kind: "bullet",
			collapsed: false
		}));
		rules.push(wrappingListInputRule(/^\s?(#)\s$|^\s?(\d+)\.\s$/, (params) => {
			const match = params.match;
			const order = match[1] === "#" ? 1 : parseInt(match[1], 10);
			return {
				kind: "ordered",
				collapsed: false,
				order: order != null && order >= 2 ? order : null
			};
		}));
	}
	type = schema.nodes.code_block;
	if(type) {
		rules.push(codeBlockRule(type));
	}
	type = schema.nodes.heading;
	if(type) {
		rules.push(headingRule(type, 6));
	}

	// Append configurable wikitext inline rules
	rules = rules.concat(buildWikitextInlineRules(schema, options));

	return inputRules({ rules: rules });
}

module.exports = {
	buildInputRules: buildInputRules,
	buildWikitextInlineRules: buildWikitextInlineRules,
	WIKITEXT_INLINE_MARK_RULES: WIKITEXT_INLINE_MARK_RULES
};
