/*\
title: $:/plugins/tiddlywiki/prosemirror/setup/setup.js
type: application/javascript
module-type: library

\*/

"use strict";

const keymap = require("prosemirror-keymap").keymap;
const history = require("prosemirror-history").history;
const baseKeymap = require("prosemirror-commands").baseKeymap;
const Plugin = require("prosemirror-state").Plugin;
const dropCursor = require("prosemirror-dropcursor").dropCursor;
const gapCursor = require("prosemirror-gapcursor").gapCursor;
const menuBar = require("prosemirror-menu").menuBar;
const Schema = require("prosemirror-model").Schema;

const buildMenuItems = require("$:/plugins/tiddlywiki/prosemirror/setup/menu.js").buildMenuItems;
const buildKeymap = require("$:/plugins/tiddlywiki/prosemirror/setup/keymap.js").buildKeymap;
const buildInputRules = require("$:/plugins/tiddlywiki/prosemirror/setup/inputrules.js").buildInputRules;

exports.buildMenuItems = buildMenuItems;
exports.buildKeymap = buildKeymap;
exports.buildInputRules = buildInputRules;

function exampleSetup(options) {
	const plugins = [
		buildInputRules(options.schema),
		keymap(buildKeymap(options.schema, options.mapKeys)),
		keymap(baseKeymap),
		dropCursor(),
		gapCursor()
	];
	if(options.menuBar !== false)
		plugins.push(menuBar({ floating: options.floatingMenu !== false, content: options.menuContent || buildMenuItems(options.schema).fullMenu }));
	if(options.history !== false)
		plugins.push(history());

	return plugins.concat(new Plugin({
		props: {
			attributes: { class: "ProseMirror-example-setup-style" }
		}
	}));
}

exports.exampleSetup = exampleSetup;
