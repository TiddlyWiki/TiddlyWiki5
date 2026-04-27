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

const mac = typeof navigator != "undefined"
	? (navigator.userAgentData
		? /mac/i.test(navigator.userAgentData.platform)
		: /Mac|iP(hone|[oa]d)/.test(navigator.platform))
	: false;

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
		// Mod-Enter always inserts a hard_break inline node
		bind("hardbreak", "Mod-Enter", cmd);
		// Shift-Enter is handled below in the combined chain (block-exit + hard_break fallback)
		// We store the original hard_break command for use by the combined Shift-Enter handler
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

	// ── Shift-Enter: exit / split an inline-content block ────────────────────
	// Shared by hard_line_breaks_block and code_block.
	//
	// Rules (in priority order):
	//   1. Cursor at block START  → insert empty paragraph BEFORE the block
	//   2. Cursor at block END    → insert empty paragraph AFTER the block
	//   3. Cursor in MIDDLE       → split the block in two, insert paragraph between
	//
	// When the block has only one line the "start" rule wins (inserts before).
	// ─────────────────────────────────────────────────────────────────────────
	function makeShiftEnterExitHandler(blockTypePredicate) {
		return (state, dispatch) => {
			const $from = state.selection.$from;
			const $to = state.selection.$to;

			// Only handle collapsed selections (cursor, not range selection)
			if($from.pos !== $to.pos) return false;

			// Find the innermost ancestor block matching our predicate
			let blockDepth = -1;
			for(let d = $from.depth; d > 0; d--) {
				if(blockTypePredicate($from.node(d).type)) {
					blockDepth = d;
					break;
				}
			}
			if(blockDepth === -1) return false;

			const paragraphType = state.schema.nodes.paragraph;
			if(!paragraphType) return false;

			const blockStart = $from.start(blockDepth); // pos of first content char
			const blockEnd = $from.end(blockDepth);     // pos after last content char
			const cursorPos = $from.pos;

			const isAtStart = cursorPos === blockStart;
			const isAtEnd = cursorPos === blockEnd;

			if(!dispatch) return true; // dry-run: we will handle it

			const tr = state.tr;

			if(isAtStart) {
				// Insert empty paragraph BEFORE the block
				const insertBefore = $from.before(blockDepth);
				tr.insert(insertBefore, paragraphType.createAndFill());
				tr.setSelection(prosemirrorState.TextSelection.create(tr.doc, insertBefore + 1));

			} else if(isAtEnd) {
				// Insert empty paragraph AFTER the block
				const insertAfter = $from.after(blockDepth);
				tr.insert(insertAfter, paragraphType.createAndFill());
				tr.setSelection(prosemirrorState.TextSelection.create(tr.doc, insertAfter + 1));

			} else {
				// Split block at cursor, insert paragraph in between
				tr.split(cursorPos, 1);
				// After tr.split, the original block is split into two.
				// The split point becomes the boundary: first block ends, second block starts.
				// After split, the boundary between the two blocks is just after cursorPos.
				// We need to find the exact position between the two blocks.
				const $splitPos = tr.doc.resolve(cursorPos);
				const afterFirstBlock = $splitPos.after($splitPos.depth);
				tr.insert(afterFirstBlock, paragraphType.createAndFill());
				tr.setSelection(prosemirrorState.TextSelection.create(tr.doc, afterFirstBlock + 1));
			}

			dispatch(tr.scrollIntoView());
			return true;
		};
	}

	// Collect all Shift-Enter block-exit handlers; combine at the end with chainCommands
	const shiftEnterHandlers = [];

	type = schema.nodes.hard_line_breaks_block;
	if(type) {
		const hardLineBreaksType = type; // Capture in const before `type` is reassigned below
		const hardBreakType = schema.nodes.hard_break;
		if(hardBreakType) {
			// Enter: insert a hard_break inline node (stays inside the block)
			const enterInHardLineBreaks = (state, dispatch) => {
				const $from = state.selection.$from;
				for(let depth = $from.depth; depth > 0; depth--) {
					if($from.node(depth).type === hardLineBreaksType) {
						if(dispatch) {
							dispatch(state.tr.replaceSelectionWith(hardBreakType.create()).scrollIntoView());
						}
						return true;
					}
				}
				return false;
			};
			bind("hard-line-breaks-enter", "Enter", enterInHardLineBreaks);

			// Shift-Enter: exit / split the block
			shiftEnterHandlers.push(makeShiftEnterExitHandler((nodeType) => nodeType === hardLineBreaksType));
		}
	}
	type = schema.nodes.code_block;
	if(type) {
		bind("codeblock", "Shift-Ctrl-\\", prosemirrorCommands.setBlockType(type));

		// Shift-Enter in code_block: same exit/split behavior
		const codeBlockType = type;
		shiftEnterHandlers.push(makeShiftEnterExitHandler((nodeType) => nodeType === codeBlockType));
	}

	// Bind Shift-Enter: block-exit handlers run first; then fall through to hard_break insertion
	if(shiftEnterHandlers.length > 0) {
		// Build the hard_break insertion command that was previously bound to Shift-Enter
		const hardBreakNode = schema.nodes.hard_break;
		const hardBreakCmd = hardBreakNode
			? prosemirrorCommands.chainCommands(prosemirrorCommands.exitCode, (state, dispatch) => {
				if(dispatch) {
					dispatch(state.tr.replaceSelectionWith(hardBreakNode.create()).scrollIntoView());
				}
				return true;
			})
			: null;

		const allShiftEnterHandlers = [...shiftEnterHandlers];
		if(hardBreakCmd) allShiftEnterHandlers.push(hardBreakCmd);

		const combinedShiftEnter = prosemirrorCommands.chainCommands(...allShiftEnterHandlers);
		const shiftEnterKey = getShortcut("hardbreak-shift", "Shift-Enter");
		if(shiftEnterKey && shiftEnterKey !== "none") {
			keys[shiftEnterKey] = combinedShiftEnter;
		}
		if(mac) {
			const ctrlEnterKey = getShortcut("hardbreak-ctrl", "Ctrl-Enter");
			if(ctrlEnterKey && ctrlEnterKey !== "none") {
				keys[ctrlEnterKey] = combinedShiftEnter;
			}
		}
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
