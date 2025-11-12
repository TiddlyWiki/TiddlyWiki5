/*\
title: $:/plugins/tiddlywiki/prosemirror/setup/menu.js
type: application/javascript
module-type: library

\*/

"use strict";

var wrapItem = require("prosemirror-menu").wrapItem;
var blockTypeItem = require("prosemirror-menu").blockTypeItem;
var Dropdown = require("prosemirror-menu").Dropdown;
var DropdownSubmenu = require("prosemirror-menu").DropdownSubmenu;
var joinUpItem = require("prosemirror-menu").joinUpItem;
var liftItem = require("prosemirror-menu").liftItem;
var selectParentNodeItem = require("prosemirror-menu").selectParentNodeItem;
var undoItem = require("prosemirror-menu").undoItem;
var redoItem = require("prosemirror-menu").redoItem;
var icons = require("prosemirror-menu").icons;
var MenuItem = require("prosemirror-menu").MenuItem;
var MenuElement = require("prosemirror-menu").MenuElement;
var NodeSelection = require("prosemirror-state").NodeSelection;
var EditorState = require("prosemirror-state").EditorState;
var Schema = require("prosemirror-model").Schema;
var NodeType = require("prosemirror-model").NodeType;
var MarkType = require("prosemirror-model").MarkType;
var toggleMark = require("prosemirror-commands").toggleMark;
var wrapInList = require("prosemirror-flat-list").wrapInList;
var TextField = require("$:/plugins/tiddlywiki/prosemirror/setup/prompt.js").TextField;
var openPrompt = require("$:/plugins/tiddlywiki/prosemirror/setup/prompt.js").openPrompt;

function canInsert(state, nodeType) {
	var $from = state.selection.$from;
	for(var d = $from.depth; d >= 0; d--) {
		var index = $from.index(d);
		if($from.node(d).canReplaceWith(index, index, nodeType)) return true;
	}
	return false;
}

function insertImageItem(nodeType) {
	return new MenuItem({
		title: "Insert image",
		label: "Image",
		enable: function(state) { return canInsert(state, nodeType); },
		run: function(state, _, view) {
			var from = state.selection.from, to = state.selection.to, attrs = null;
			if(state.selection instanceof NodeSelection && state.selection.node.type == nodeType)
				attrs = state.selection.node.attrs;
			openPrompt({
				title: "Insert image",
				fields: {
					src: new TextField({label: "Location", required: true, value: attrs && attrs.src}),
					title: new TextField({label: "Title", value: attrs && attrs.title}),
					alt: new TextField({label: "Description", value: attrs ? attrs.alt : state.doc.textBetween(from, to, " ")})
				},
				callback: function(attrs) {
					view.dispatch(view.state.tr.replaceSelectionWith(nodeType.createAndFill(attrs)));
					view.focus();
				}
			});
		}
	});
}

function cmdItem(cmd, options) {
	var passedOptions = {
		label: options.title,
		run: cmd
	};
	for(var prop in options) passedOptions[prop] = options[prop];
	if(!options.enable && !options.select)
		passedOptions[options.enable ? "enable" : "select"] = function(state) { return cmd(state); };

	return new MenuItem(passedOptions);
}

function markActive(state, type) {
	var from = state.selection.from, $from = state.selection.$from, to = state.selection.to, empty = state.selection.empty;
	if(empty) return !!type.isInSet(state.storedMarks || $from.marks());
	else return state.doc.rangeHasMark(from, to, type);
}

function markItem(markType, options) {
	var passedOptions = {
		active: function(state) { return markActive(state, markType); }
	};
	for(var prop in options) passedOptions[prop] = options[prop];
	return cmdItem(toggleMark(markType), passedOptions);
}

function linkItem(markType) {
	return new MenuItem({
		title: "Add or remove link",
		icon: icons.link,
		active: function(state) { return markActive(state, markType); },
		enable: function(state) { return !state.selection.empty; },
		run: function(state, dispatch, view) {
			if(markActive(state, markType)) {
				toggleMark(markType)(state, dispatch);
				return true;
			}
			openPrompt({
				title: "Create a link",
				fields: {
					href: new TextField({label: "Link target", required: true}),
					title: new TextField({label: "Title"})
				},
				callback: function(attrs) {
					toggleMark(markType, attrs)(view.state, view.dispatch);
					view.focus();
				}
			});
		}
	});
}

function wrapListItem(nodeType, options) {
	return cmdItem(wrapInList(nodeType, options.attrs), options);
}

function buildMenuItems(schema) {
	var r = {};
	var mark;
	mark = schema.marks.strong;
	if(mark)
		r.toggleStrong = markItem(mark, {title: "Toggle strong style", icon: icons.strong});
	mark = schema.marks.em;
	if(mark)
		r.toggleEm = markItem(mark, {title: "Toggle emphasis", icon: icons.em});
	mark = schema.marks.code;
	if(mark)
		r.toggleCode = markItem(mark, {title: "Toggle code font", icon: icons.code});
	mark = schema.marks.link;
	if(mark)
		r.toggleLink = linkItem(mark);

	var node;
	node = schema.nodes.image;
	if(node)
		r.insertImage = insertImageItem(node);
	node = schema.nodes.bullet_list;
	if(node)
		r.wrapBulletList = wrapListItem(node, {title: "Wrap in bullet list", icon: icons.bulletList});
	node = schema.nodes.ordered_list;
	if(node)
		r.wrapOrderedList = wrapListItem(node, {title: "Wrap in ordered list", icon: icons.orderedList});
	node = schema.nodes.blockquote;
	if(node)
		r.wrapBlockQuote = wrapItem(node, {title: "Wrap in block quote", icon: icons.blockquote});
	node = schema.nodes.paragraph;
	if(node)
		r.makeParagraph = blockTypeItem(node, {title: "Change to paragraph", label: "Plain"});
	node = schema.nodes.code_block;
	if(node)
		r.makeCodeBlock = blockTypeItem(node, {title: "Change to code block", label: "Code"});
	node = schema.nodes.heading;
	if(node)
		for(var i = 1; i <= 10; i++)
			r["makeHead" + i] = blockTypeItem(node, {title: "Change to heading " + i, label: "Level " + i, attrs: {level: i}});
	node = schema.nodes.horizontal_rule;
	if(node) {
		var hr = node;
		r.insertHorizontalRule = new MenuItem({
			title: "Insert horizontal rule",
			label: "Horizontal rule",
			enable: function(state) { return canInsert(state, hr); },
			run: function(state, dispatch) { dispatch(state.tr.replaceSelectionWith(hr.create())); }
		});
	}

	var cut = function(arr) { return arr.filter(function(x) { return x; }); };
	r.insertMenu = new Dropdown(cut([r.insertImage, r.insertHorizontalRule]), {label: "Insert"});
	r.typeMenu = new Dropdown(cut([r.makeParagraph, r.makeCodeBlock, r.makeHead1 && new DropdownSubmenu(cut([
		r.makeHead1, r.makeHead2, r.makeHead3, r.makeHead4, r.makeHead5, r.makeHead6
	]), {label: "Heading"})]), {label: "Type..."});

	r.inlineMenu = [cut([r.toggleStrong, r.toggleEm, r.toggleCode, r.toggleLink])];
	r.blockMenu = [cut([r.wrapBulletList, r.wrapOrderedList, r.wrapBlockQuote, joinUpItem, liftItem, selectParentNodeItem])];
	r.fullMenu = r.inlineMenu.concat([[r.insertMenu, r.typeMenu]], [[undoItem, redoItem]], r.blockMenu);

	return r;
}

exports.buildMenuItems = buildMenuItems;
