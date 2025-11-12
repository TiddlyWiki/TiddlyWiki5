/*\
title: $:/plugins/tiddlywiki/prosemirror/setup/setup.js
type: application/javascript
module-type: library

\*/

"use strict";

var keymap = require("prosemirror-keymap").keymap;
var history = require("prosemirror-history").history;
var baseKeymap = require("prosemirror-commands").baseKeymap;
var Plugin = require("prosemirror-state").Plugin;
var dropCursor = require("prosemirror-dropcursor").dropCursor;
var gapCursor = require("prosemirror-gapcursor").gapCursor;
var menuBar = require("prosemirror-menu").menuBar;
var Schema = require("prosemirror-model").Schema;

var buildMenuItems = require("$:/plugins/tiddlywiki/prosemirror/setup/menu.js").buildMenuItems;
var buildKeymap = require("$:/plugins/tiddlywiki/prosemirror/setup/keymap.js").buildKeymap;
var buildInputRules = require("$:/plugins/tiddlywiki/prosemirror/setup/inputrules.js").buildInputRules;

exports.buildMenuItems = buildMenuItems;
exports.buildKeymap = buildKeymap;
exports.buildInputRules = buildInputRules;

function exampleSetup(options) {
	var plugins = [
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
