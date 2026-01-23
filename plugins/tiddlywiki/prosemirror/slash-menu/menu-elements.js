/*\
title: $:/plugins/tiddlywiki/prosemirror/menu-elements.js
type: application/javascript
module-type: library

Exports functions to get all menu elements for SlashMenu (default + snippets)
\*/

"use strict";

const parseWidget = require("$:/plugins/tiddlywiki/prosemirror/widget-block/utils.js").parseWidget;
const scheduleEnterWidgetBlockEditModeNearSelection = require("$:/plugins/tiddlywiki/prosemirror/widget-block/actions.js").scheduleEnterWidgetBlockEditModeNearSelection;

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
				available: () => true,
				command: view => {
					const selection = view.state.selection;
					const tr = view.state.tr.insertText(snippetText, selection.from, selection.to);
					view.dispatch(tr);
					// If this snippet is a widget invocation, immediately enter edit mode for the
					// resulting widget block to match Notion-like flow.
					const widget = parseWidget((snippetText || "").trim());
					if(widget) {
						scheduleEnterWidgetBlockEditModeNearSelection(view, { expectedWidgetName: widget.widgetName });
					}
					return true;
				}
			};
		});
}

function getBlockTypeMenuElements(schema) {
	const blockTypes = [
		{ id: "codeblock", label: "Turn into codeblock", node: schema.nodes.code_block },
		{ id: "blockquote", label: "Turn into quote", node: schema.nodes.blockquote },
		{ id: "paragraph", label: "Turn into paragraph", node: schema.nodes.paragraph }
	];
	const blockTypeCommands = blockTypes.map(item => ({
			id: item.id,
			label: item.label,
			type: "command",
			available: () => true,
			command: view => {
				const tr = view.state.tr.setBlockType(view.state.selection.from, view.state.selection.to, item.node);
				view.dispatch(tr);
				return true;
			}
		}));
	return [{
		id: "blocktype-submenu",
		label: "Block Type",
		type: "submenu",
		available: () => true,
		elements: blockTypeCommands
	}];
}

function flattenMenuElementsWithGroup(elements) {
	let result = [];
	elements.forEach(item => {
		if(item.type === "submenu" && Array.isArray(item.elements)) {
			// Insert group title before submenu items
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
		.concat(getBlockTypeMenuElements(schema))
		.filter(item => !!item);
exports.flattenMenuElementsWithGroup = flattenMenuElementsWithGroup;
