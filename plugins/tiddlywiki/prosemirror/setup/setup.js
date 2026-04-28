/*\
title: $:/plugins/tiddlywiki/prosemirror/setup/setup.js
type: application/javascript
module-type: library

\*/

"use strict";

const buildBaseSetupPlugins = require("$:/plugins/tiddlywiki/prosemirror/core/base-setup.js").buildBaseSetupPlugins;
const buildKeymap = require("$:/plugins/tiddlywiki/prosemirror/setup/keymap.js").buildKeymap;
const buildInputRules = require("$:/plugins/tiddlywiki/prosemirror/setup/inputrules.js").buildInputRules;

function buildMenuItems(schema) {
	return require("$:/plugins/tiddlywiki/prosemirror/setup/menu.js").buildMenuItems(schema);
}

exports.buildMenuItems = buildMenuItems;
exports.buildKeymap = buildKeymap;
exports.buildInputRules = buildInputRules;

// Legacy compatibility helper mirroring the original ProseMirror example-setup
// shape. The main editor runtime now assembles its plugins via core/base-setup.js.
function exampleSetup(options) {
	options = options || {};
	return buildBaseSetupPlugins(Object.assign({}, options, {
		getMenuPlugin: options.menuBar === false ? null : () => {
			const menuBar = require("prosemirror-menu").menuBar;
			return menuBar({
				floating: options.floatingMenu !== false,
				content: options.menuContent || buildMenuItems(options.schema).fullMenu
			});
		}
	}));
}

exports.exampleSetup = exampleSetup;
