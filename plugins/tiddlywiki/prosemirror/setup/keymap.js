/*\
title: $:/plugins/tiddlywiki/prosemirror/setup/keymap.js
type: application/javascript
module-type: library

\*/

"use strict";

var prosemirrorCommands = require("prosemirror-commands");
var prosemirrorFlatList = require("prosemirror-flat-list");
var prosemirrorHistory = require("prosemirror-history");
var prosemirrorInputrules = require("prosemirror-inputrules");
var prosemirrorState = require("prosemirror-state");
var prosemirrorModel = require("prosemirror-model");

var mac = typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : false;

function buildKeymap(schema, mapKeys) {
	var keys = {}, type;
	function bind(key, cmd) {
		if(mapKeys) {
			var mapped = mapKeys[key];
			if(mapped === false) return;
			if(mapped) key = mapped;
		}
		keys[key] = cmd;
	}

	bind("Mod-z", prosemirrorHistory.undo);
	bind("Shift-Mod-z", prosemirrorHistory.redo);
	bind("Backspace", prosemirrorInputrules.undoInputRule);
	if(!mac) bind("Mod-y", prosemirrorHistory.redo);

	bind("Alt-ArrowUp", prosemirrorCommands.joinUp);
	bind("Alt-ArrowDown", prosemirrorCommands.joinDown);
	bind("Mod-BracketLeft", prosemirrorCommands.lift);
	bind("Escape", prosemirrorCommands.selectParentNode);

	type = schema.marks.strong;
	if(type) {
		bind("Mod-b", prosemirrorCommands.toggleMark(type));
		bind("Mod-B", prosemirrorCommands.toggleMark(type));
	}
	type = schema.marks.em;
	if(type) {
		bind("Mod-i", prosemirrorCommands.toggleMark(type));
		bind("Mod-I", prosemirrorCommands.toggleMark(type));
	}
	type = schema.marks.code;
	if(type)
		bind("Mod-`", prosemirrorCommands.toggleMark(type));
	type = schema.nodes.blockquote;
	if(type)
		bind("Ctrl->", prosemirrorCommands.wrapIn(type));
	type = schema.nodes.hard_break;
	if(type) {
		var br = type, cmd = prosemirrorCommands.chainCommands(prosemirrorCommands.exitCode, function(state, dispatch) {
			if(dispatch) dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView());
			return true;
		});
		bind("Mod-Enter", cmd);
		bind("Shift-Enter", cmd);
		if(mac) bind("Ctrl-Enter", cmd);
	}
	type = schema.nodes.list;
	if(type) {
		bind("Shift-Tab", prosemirrorFlatList.createDedentListCommand(type));
		bind("Tab", prosemirrorFlatList.createIndentListCommand(type));
	}
	type = schema.nodes.paragraph;
	if(type)
		bind("Shift-Ctrl-0", prosemirrorCommands.setBlockType(type));
	type = schema.nodes.code_block;
	if(type)
		bind("Shift-Ctrl-\\", prosemirrorCommands.setBlockType(type));
	type = schema.nodes.heading;
	if(type)
		for(var i = 1; i <= 6; i++) bind("Shift-Ctrl-" + i, prosemirrorCommands.setBlockType(type, {level: i}));
	type = schema.nodes.horizontal_rule;
	if(type) {
		var hr = type;
		bind("Mod-_", function(state, dispatch) {
			if(dispatch) dispatch(state.tr.replaceSelectionWith(hr.create()).scrollIntoView());
			return true;
		});
	}

	return keys;
}

module.exports = {
	buildKeymap: buildKeymap
};
