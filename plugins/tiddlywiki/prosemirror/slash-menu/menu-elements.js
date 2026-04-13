/*\
title: $:/plugins/tiddlywiki/prosemirror/slash-menu/menu-elements.js
type: application/javascript
module-type: library

Exports functions to get all menu elements for SlashMenu (default + snippets + EditorAction tiddlers)
\*/

"use strict";

const parseWidget = require("$:/plugins/tiddlywiki/prosemirror/widget-block/utils.js").parseWidget;
const scheduleEnterWidgetBlockEditModeNearSelection = require("$:/plugins/tiddlywiki/prosemirror/widget-block/actions.js").scheduleEnterWidgetBlockEditModeNearSelection;

const EDITOR_ACTION_TAG = "$:/tags/ProseMirror/EditorAction";

/**
 * Built-in command registry: actionId → PM command factory.
 * Each entry receives (schema) and returns a PM command function (state, dispatch, view) => boolean.
 */
function getBuiltinActionCommands(schema) {
	const pmCommands = require("prosemirror-commands");
	return {
		"codeblock": view => {
			const current = view.state.selection.$from.parent;
			if(current.type === schema.nodes.code_block) {
				pmCommands.setBlockType(schema.nodes.paragraph)(view.state, view.dispatch);
			} else {
				pmCommands.setBlockType(schema.nodes.code_block)(view.state, view.dispatch);
			}
			return true;
		},
		"blockquote": view => {
			const $from = view.state.selection.$from;
			for(let d = $from.depth; d > 0; d--) {
				if($from.node(d).type === schema.nodes.blockquote) {
					pmCommands.lift(view.state, view.dispatch);
					return true;
				}
			}
			pmCommands.wrapIn(schema.nodes.blockquote)(view.state, view.dispatch);
			return true;
		},
		"paragraph": view => {
			pmCommands.setBlockType(schema.nodes.paragraph)(view.state, view.dispatch);
			return true;
		},
		"heading1": view => { pmCommands.setBlockType(schema.nodes.heading, { level: 1 })(view.state, view.dispatch); return true; },
		"heading2": view => { pmCommands.setBlockType(schema.nodes.heading, { level: 2 })(view.state, view.dispatch); return true; },
		"heading3": view => { pmCommands.setBlockType(schema.nodes.heading, { level: 3 })(view.state, view.dispatch); return true; },
		"heading4": view => { pmCommands.setBlockType(schema.nodes.heading, { level: 4 })(view.state, view.dispatch); return true; },
		"heading5": view => { pmCommands.setBlockType(schema.nodes.heading, { level: 5 })(view.state, view.dispatch); return true; },
		"heading6": view => { pmCommands.setBlockType(schema.nodes.heading, { level: 6 })(view.state, view.dispatch); return true; },
		"horizontal-rule": view => {
			const tr = view.state.tr.replaceSelectionWith(schema.nodes.horizontal_rule.create());
			view.dispatch(tr);
			return true;
		},
		"bold": view => { pmCommands.toggleMark(schema.marks.strong)(view.state, view.dispatch); return true; },
		"italic": view => { pmCommands.toggleMark(schema.marks.em)(view.state, view.dispatch); return true; },
		"underline": view => { if(schema.marks.underline) { pmCommands.toggleMark(schema.marks.underline)(view.state, view.dispatch); } return true; },
		"strikethrough": view => { if(schema.marks.strike) { pmCommands.toggleMark(schema.marks.strike)(view.state, view.dispatch); } return true; },
		"code-inline": view => { pmCommands.toggleMark(schema.marks.code)(view.state, view.dispatch); return true; },
		"insert-table": view => {
			if(!schema.nodes.table || !schema.nodes.table_row || !schema.nodes.table_cell || !schema.nodes.table_header) return false;
			// Create a 3×3 table with header row
			const headerCells = [];
			let dataCells = [];
			for(let c = 0; c < 3; c++) {
				headerCells.push(schema.nodes.table_header.createAndFill());
				dataCells.push(schema.nodes.table_cell.createAndFill());
			}
			const headerRow = schema.nodes.table_row.create(null, headerCells);
			const dataRow1 = schema.nodes.table_row.create(null, dataCells);
			dataCells = [];
			for(let c2 = 0; c2 < 3; c2++) {
				dataCells.push(schema.nodes.table_cell.createAndFill());
			}
			const dataRow2 = schema.nodes.table_row.create(null, dataCells);
			const table = schema.nodes.table.create(null, [headerRow, dataRow1, dataRow2]);
			const tr = view.state.tr.replaceSelectionWith(table);
			view.dispatch(tr.scrollIntoView());
			view.focus();
			return true;
		},
		"hard-line-breaks": view => {
			if(!schema.nodes.hard_line_breaks_block) return false;
			const node = schema.nodes.hard_line_breaks_block.createAndFill();
			if(!node) return false;
			const tr = view.state.tr.replaceSelectionWith(node);
			view.dispatch(tr.scrollIntoView());
			view.focus();
			return true;
		}
	};
}

function getSnippetMenuElements(wiki) {
	return wiki.filterTiddlers("[all[shadows+tiddlers]tag[$:/tags/TextEditor/Snippet]]")
		.map(title => {
			const tiddler = wiki.getTiddler(title);
			if(!tiddler) {
				return null;
			}
			const label = tiddler.fields.caption || title;
			const snippetText = tiddler.fields.text;
			if(!snippetText) {
				return null;
			}
			return {
				id: "snippet-" + title,
				label: label,
				type: "command",
				category: "snippet",
				available: () => true,
				command: view => {
					const selection = view.state.selection;
					const tr = view.state.tr.insertText(snippetText, selection.from, selection.to);
					view.dispatch(tr);
					const widget = parseWidget((snippetText || "").trim());
					if(widget) {
						scheduleEnterWidgetBlockEditModeNearSelection(view, { expectedWidgetName: widget.widgetName });
					}
					return true;
				}
			};
		});
}

/**
 * Collect menu elements from $:/tags/ProseMirror/EditorAction tiddlers.
 * Each tiddler has: caption, description, category, icon, and an actionId field
 * that maps to a built-in PM command.
 */
function getEditorActionMenuElements(wiki, schema) {
	const builtinCommands = getBuiltinActionCommands(schema);
	const titles = wiki.filterTiddlers("[all[shadows+tiddlers]tag[" + EDITOR_ACTION_TAG + "]]");
	let result = [];
	for(let i = 0; i < titles.length; i++) {
		const title = titles[i];
		const tiddler = wiki.getTiddler(title);
		if(!tiddler) continue;
		const fields = tiddler.fields;
		const actionId = fields["action-id"] || fields.actionId || (title.split("/").pop());
		const label = fields.caption || actionId;
		const category = fields.category || "other";
		const icon = fields.icon || null;
		const description = fields.description || "";
		const commandFn = builtinCommands[actionId];
		if(!commandFn) continue; // Skip actions without a built-in handler
		result.push({
			id: "action-" + actionId,
			label: label,
			type: "command",
			category: category,
			icon: icon,
			description: description,
			available: () => true,
			command: commandFn
		});
	}
	return result;
}

function getBlockTypeMenuElements(wiki, schema) {
	const blockTypes = [
		{ id: "codeblock", label: wiki.getTiddlerText("$:/plugins/tiddlywiki/prosemirror/language/SlashMenu/TurnIntoCodeblock", "Turn into codeblock"), node: schema.nodes.code_block },
		{ id: "blockquote", label: wiki.getTiddlerText("$:/plugins/tiddlywiki/prosemirror/language/SlashMenu/TurnIntoQuote", "Turn into quote"), node: schema.nodes.blockquote },
		{ id: "paragraph", label: wiki.getTiddlerText("$:/plugins/tiddlywiki/prosemirror/language/SlashMenu/TurnIntoParagraph", "Turn into paragraph"), node: schema.nodes.paragraph }
	];
	const blockTypeCommands = blockTypes.map(item => ({
			id: item.id,
			label: item.label,
			type: "command",
			category: "block-type",
			available: () => true,
			command: view => {
				const tr = view.state.tr.setBlockType(view.state.selection.from, view.state.selection.to, item.node);
				view.dispatch(tr);
				return true;
			}
		}));
	return [{
		id: "blocktype-submenu",
		label: wiki.getTiddlerText("$:/plugins/tiddlywiki/prosemirror/language/SlashMenu/BlockType", "Block Type"),
		type: "submenu",
		category: "block-type",
		available: () => true,
		elements: blockTypeCommands
	}];
}

function flattenMenuElementsWithGroup(elements) {
	let result = [];
	elements.forEach(item => {
		if(item.type === "submenu" && Array.isArray(item.elements)) {
			result.push({
				id: "group-" + item.id,
				label: item.label,
				type: "group",
				available: () => true
			});
			result = result.concat(flattenMenuElementsWithGroup(item.elements));
		} else {
			result.push(item);
		}
	});
	return result;
}

exports.getAllMenuElements = (wiki, schema) => getSnippetMenuElements(wiki)
		.concat(getEditorActionMenuElements(wiki, schema))
		.concat(getBlockTypeMenuElements(wiki, schema))
		.filter(item => !!item);
exports.flattenMenuElementsWithGroup = flattenMenuElementsWithGroup;
exports.getBuiltinActionCommands = getBuiltinActionCommands;
