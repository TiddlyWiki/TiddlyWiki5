/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/keymap-emacs/plugin.js
type: application/javascript
module-type: codemirror6-plugin

Emacs-style keybindings for CodeMirror 6

\*/
"use strict";

if(!$tw.browser) return;

exports.plugin = {
	name: "keymap-emacs",
	description: "Emacs-style keybindings",
	priority: 50,
	keymapId: "emacs",

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	getExtensions: function(_context) {
		// The engine calls this only when emacs keymap is selected
		var core = this._core;
		var keymap = (core.view || {}).keymap;
		var commands = core.commands || {};

		if(!keymap || !commands.emacsStyleKeymap) {
			return [];
		}

		return [keymap.of(commands.emacsStyleKeymap)];
	}
};
