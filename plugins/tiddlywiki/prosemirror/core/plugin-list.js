/*\
title: $:/plugins/tiddlywiki/prosemirror/core/plugin-list.js
type: application/javascript
module-type: library

Shared plugin assembly for the ProseMirror editor engine.

\*/

"use strict";

const { keymap } = require("prosemirror-keymap");
const { inputRules } = require("prosemirror-inputrules");
const { createListPlugins, listKeymap } = require("prosemirror-flat-list");

const { buildBaseSetupPlugins } = require("$:/plugins/tiddlywiki/prosemirror/core/base-setup.js");
const { placeholderPlugin } = require("$:/plugins/tiddlywiki/prosemirror/features/editor-placeholder.js");

const { createWidgetBlockPlugin, createWidgetBlockNodeViewPlugin } = require("$:/plugins/tiddlywiki/prosemirror/blocks/widget/plugin.js");
const { createImageBlockPlugin } = require("$:/plugins/tiddlywiki/prosemirror/blocks/image/block-plugin.js");
const { createImageNodeViewPlugin } = require("$:/plugins/tiddlywiki/prosemirror/blocks/image/plugin.js");
const { createPragmaBlockNodeViewPlugin } = require("$:/plugins/tiddlywiki/prosemirror/blocks/pragma/nodeview.js");
const { createInlineSourceNodeViewPlugin } = require("$:/plugins/tiddlywiki/prosemirror/blocks/inline-source/nodeview.js");
const { createCodeBlockNodeViewPlugin } = require("$:/plugins/tiddlywiki/prosemirror/blocks/code-block/nodeview.js");
const { createHardLineBreaksNodeViewPlugin } = require("$:/plugins/tiddlywiki/prosemirror/blocks/hard-line-breaks/nodeview.js");
const { createTypedBlockNodeViewPlugin } = require("$:/plugins/tiddlywiki/prosemirror/blocks/typed-block/nodeview.js");
const { createDragHandlePlugin } = require("$:/plugins/tiddlywiki/prosemirror/features/drag-handle/plugin.js");
const { createBlockPlaceholderPlugin } = require("$:/plugins/tiddlywiki/prosemirror/features/block-placeholder.js");
const { createLinkClassesPlugin } = require("$:/plugins/tiddlywiki/prosemirror/features/link-classes.js");
const { createLinkTooltipPlugin } = require("$:/plugins/tiddlywiki/prosemirror/features/link-tooltip.js");
const { getMarkdownInputRules } = require("$:/plugins/tiddlywiki/prosemirror/features/markdown-shortcuts.js");
const { createAutocompletePlugin } = require("$:/plugins/tiddlywiki/prosemirror/features/autocomplete.js");
const { createFindReplacePlugin } = require("$:/plugins/tiddlywiki/prosemirror/features/find-replace.js");
const { createSlashMenuPlugin } = require("$:/plugins/tiddlywiki/prosemirror/features/slash-menu/plugin.js");

let pmTables;
try {
	pmTables = require("prosemirror-tables");
} catch(e) {
	pmTables = null;
}

function buildPlugins(schema, wiki, nodeViewHost, contentType) {
	const listKeymapPlugin = keymap(listKeymap);
	const listPlugins = createListPlugins({ schema });

	const mdRules = getMarkdownInputRules(wiki, schema);
	const mdPlugin = mdRules.length > 0 ? [inputRules({ rules: mdRules })] : [];

	const tablePlugins = [];
	if(pmTables && schema.nodes.table) {
		tablePlugins.push(pmTables.columnResizing());
		tablePlugins.push(pmTables.tableEditing());
		tablePlugins.push(keymap({
			"Tab": pmTables.goToNextCell(1),
			"Shift-Tab": pmTables.goToNextCell(-1)
		}));
	}

	return [
		createSlashMenuPlugin({ wiki: wiki, contentType: contentType }),
		createImageBlockPlugin(),
		createImageNodeViewPlugin(nodeViewHost),
		listKeymapPlugin,
		placeholderPlugin({
			text: wiki.getTiddlerText("$:/config/prosemirror/placeholder", "Type / for commands")
		}),
		createWidgetBlockPlugin(),
		createWidgetBlockNodeViewPlugin(nodeViewHost),
		createPragmaBlockNodeViewPlugin(nodeViewHost),
		createInlineSourceNodeViewPlugin(nodeViewHost),
		createCodeBlockNodeViewPlugin(),
		createHardLineBreaksNodeViewPlugin(),
		createTypedBlockNodeViewPlugin(),
		createDragHandlePlugin({ wiki: wiki, contentType: contentType }),
		createAutocompletePlugin(wiki),
		createFindReplacePlugin(wiki),
		createLinkClassesPlugin(wiki),
		createLinkTooltipPlugin(nodeViewHost),
		createBlockPlaceholderPlugin(wiki)
	]
		.concat(mdPlugin)
		.concat(listPlugins)
		.concat(tablePlugins)
		.concat(buildBaseSetupPlugins({ schema: schema, wiki: wiki }));
}

exports.buildPlugins = buildPlugins;
