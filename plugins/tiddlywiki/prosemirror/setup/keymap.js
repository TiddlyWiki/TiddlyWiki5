/*\
title: $:/plugins/tiddlywiki/prosemirror/setup/keymap.js
type: application/javascript
module-type: library

\*/

"use strict";

const prosemirrorCommands = require("prosemirror-commands");
const prosemirrorFlatList = require("prosemirror-flat-list");
const prosemirrorHistory = require("prosemirror-history");
const prosemirrorInputrules = require("prosemirror-inputrules");
const prosemirrorState = require("prosemirror-state");
const prosemirrorModel = require("prosemirror-model");

const mac = typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : false;

/**
 * Get keyboard shortcut from config, with fallback to default
 * @param {string} action - The action name (e.g., "bold", "italic")
 * @param {string} defaultKey - The default key binding
 * @returns {string|null} - The configured key binding, or null if disabled
 */
function getShortcut(action, defaultKey) {
	const configTiddler = "$:/config/prosemirror/shortcuts/" + action;
	const customKey = $tw.wiki.getTiddlerText(configTiddler, "").trim();
	
	// If custom key is explicitly set to "none", disable the shortcut
	if(customKey === "none") {
		return null;
	}
	
	// Use custom key if provided, otherwise use default
	return customKey || defaultKey;
}

function buildKeymap(schema, mapKeys) {
	const keys = {};
	let type;
	const bind = (action, defaultKey, cmd) => {
		let key = getShortcut(action, defaultKey);
		
		// Skip if disabled
		if(key === null) {
			return;
		}
		
		if(mapKeys) {
			const mapped = mapKeys[key];
			if(mapped === false) {
				return;
			}
			if(mapped) {
				key = mapped;
			}
		}
		keys[key] = cmd;
	};

	bind("undo", "Mod-z", prosemirrorHistory.undo);
	bind("redo", "Shift-Mod-z", prosemirrorHistory.redo);
	bind("undo-input", "Backspace", prosemirrorInputrules.undoInputRule);
	if(!mac) {
		bind("redo-alt", "Mod-y", prosemirrorHistory.redo);
	}

	bind("join-up", "Alt-ArrowUp", prosemirrorCommands.joinUp);
	bind("join-down", "Alt-ArrowDown", prosemirrorCommands.joinDown);
	bind("lift", "Mod-BracketLeft", prosemirrorCommands.lift);
	bind("select-parent", "Escape", prosemirrorCommands.selectParentNode);

	type = schema.marks.strong;
	if(type) {
		const boldCmd = prosemirrorCommands.toggleMark(type);
		bind("bold", "Mod-b", boldCmd);
		// Also bind uppercase variant
		const upperKey = getShortcut("bold", "Mod-b");
		if(upperKey && upperKey !== "none") {
			keys[upperKey.replace("b", "B")] = boldCmd;
		}
	}
	type = schema.marks.em;
	if(type) {
		const italicCmd = prosemirrorCommands.toggleMark(type);
		bind("italic", "Mod-i", italicCmd);
		// Also bind uppercase variant
		const upperKey = getShortcut("italic", "Mod-i");
		if(upperKey && upperKey !== "none") {
			keys[upperKey.replace("i", "I")] = italicCmd;
		}
	}
	type = schema.marks.code;
	if(type) {
		bind("code", "Mod-`", prosemirrorCommands.toggleMark(type));
	}
	type = schema.nodes.blockquote;
	if(type) {
		bind("blockquote", "Ctrl->", prosemirrorCommands.wrapIn(type));
	}
	type = schema.nodes.hard_break;
	if(type) {
		const br = type;
		const cmd = prosemirrorCommands.chainCommands(prosemirrorCommands.exitCode, (state, dispatch) => {
			if(dispatch) {
				dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView());
			}
			return true;
		});
		bind("hardbreak", "Mod-Enter", cmd);
		const shiftEnterKey = getShortcut("hardbreak-shift", "Shift-Enter");
		if(shiftEnterKey && shiftEnterKey !== "none") {
			keys[shiftEnterKey] = cmd;
		}
		if(mac) {
			const ctrlEnterKey = getShortcut("hardbreak-ctrl", "Ctrl-Enter");
			if(ctrlEnterKey && ctrlEnterKey !== "none") {
				keys[ctrlEnterKey] = cmd;
			}
		}
	}
	type = schema.nodes.list;
	if(type) {
		bind("dedent", "Shift-Tab", prosemirrorFlatList.createDedentListCommand(type));
		bind("indent", "Tab", prosemirrorFlatList.createIndentListCommand(type));
	}
	type = schema.nodes.paragraph;
	if(type) {
		bind("paragraph", "Shift-Ctrl-0", prosemirrorCommands.setBlockType(type));
	}
	type = schema.nodes.code_block;
	if(type) {
		bind("codeblock", "Shift-Ctrl-\\", prosemirrorCommands.setBlockType(type));
	}
	type = schema.nodes.heading;
	if(type) {
		for(let i = 1; i <= 6; i++) {
			bind("heading" + i, "Shift-Ctrl-" + i, prosemirrorCommands.setBlockType(type, {level: i}));
		}
	}
	type = schema.nodes.horizontal_rule;
	if(type) {
		const hr = type;
		bind("hr", "Mod-_", (state, dispatch) => {
			if(dispatch) {
				dispatch(state.tr.replaceSelectionWith(hr.create()).scrollIntoView());
			}
			return true;
		});
	}

	return keys;
}

module.exports = {
	buildKeymap: buildKeymap
};
