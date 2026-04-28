/*\
title: $:/plugins/tiddlywiki/prosemirror/core/base-setup.js
type: application/javascript
module-type: library

Core setup plugins shared by the ProseMirror runtime.
This intentionally excludes the legacy prosemirror-menu menubar wiring.

\*/

"use strict";

const keymap = require("prosemirror-keymap").keymap;
const history = require("prosemirror-history").history;
const baseKeymap = require("prosemirror-commands").baseKeymap;
const Plugin = require("prosemirror-state").Plugin;
const dropCursor = require("prosemirror-dropcursor").dropCursor;
const gapCursor = require("prosemirror-gapcursor").gapCursor;

const buildKeymap = require("$:/plugins/tiddlywiki/prosemirror/core/keymap.js").buildKeymap;
const buildInputRules = require("$:/plugins/tiddlywiki/prosemirror/core/inputrules.js").buildInputRules;

function buildBaseSetupPlugins(options) {
	options = options || {};
	const plugins = [
		buildInputRules(options.schema),
		keymap(buildKeymap(options.schema, options.mapKeys)),
		keymap(baseKeymap),
		dropCursor(),
		gapCursor()
	];

	if(typeof options.getMenuPlugin === "function") {
		const menuPlugin = options.getMenuPlugin();
		if(menuPlugin) {
			plugins.push(menuPlugin);
		}
	}

	if(options.history !== false) {
		plugins.push(history());
	}

	plugins.push(new Plugin({
		props: {
			attributes: { class: "ProseMirror-tiddlywiki-style" }
		}
	}));

	return plugins;
}

exports.buildBaseSetupPlugins = buildBaseSetupPlugins;