/*\
title: $:/plugins/tiddlywiki/prosemirror/setup/menu.js
type: application/javascript
module-type: library

Build the ProseMirror menu bar items.

\*/

"use strict";

const {
	wrapItem, blockTypeItem, Dropdown, DropdownSubmenu,
	joinUpItem, liftItem, selectParentNodeItem,
	undoItem, redoItem, icons, MenuItem
} = require("prosemirror-menu");
const { NodeSelection } = require("prosemirror-state");
const { toggleMark } = require("prosemirror-commands");
const { wrapInList } = require("prosemirror-flat-list");
const { TextField, openPrompt } = require("$:/plugins/tiddlywiki/prosemirror/setup/prompt.js");

function twIcon(tiddlerTitle, fallbackText) {
	try {
		const htmlStr = $tw.wiki.renderTiddler("text/html", tiddlerTitle, {
			variables: { size: "1em" }
		});
		if(htmlStr) {
			const container = document.createElement("div");
			container.innerHTML = htmlStr;
			const svg = container.querySelector("svg");
			if(svg) {
				svg.style.width = "1em";
				svg.style.height = "1em";
				return { dom: svg };
			}
		}
	} catch(e) { /* ignore — not in browser */ }
	// Fallback: text icon
	return { text: fallbackText || "?", css: "font-weight: bold" };
}

function canInsert(state, nodeType) {
	const { $from } = state.selection;
	for(let d = $from.depth; d >= 0; d--) {
		const index = $from.index(d);
		if($from.node(d).canReplaceWith(index, index, nodeType)) {
			return true;
		}
	}
	return false;
}

function insertImageItem(nodeType) {
	return new MenuItem({
		title: $tw.wiki.getTiddlerText("$:/plugins/tiddlywiki/prosemirror/language/Menu/InsertImage", "Insert image"),
		label: $tw.wiki.getTiddlerText("$:/plugins/tiddlywiki/prosemirror/language/ImagePicker/Title", "Image"),
		enable: (state) => canInsert(state, nodeType),
		run(state, _, view) {
			const { from, to } = state.selection;
			let attrs = null;
			if(state.selection instanceof NodeSelection && state.selection.node.type === nodeType) {
				attrs = state.selection.node.attrs;
			}
			openPrompt({
				title: $tw.wiki.getTiddlerText("$:/plugins/tiddlywiki/prosemirror/language/Menu/InsertImage", "Insert image"),
				fields: {
					src: new TextField({ label: "Location", required: true, value: attrs && attrs.src }),
					title: new TextField({ label: "Title", value: attrs && attrs.title }),
					alt: new TextField({ label: "Description", value: attrs ? attrs.alt : state.doc.textBetween(from, to, " ") })
				},
				callback(attrs) {
					view.dispatch(view.state.tr.replaceSelectionWith(nodeType.createAndFill(attrs)));
					view.focus();
				}
			});
		}
	});
}

function cmdItem(cmd, options) {
	const passedOptions = Object.assign({
		label: options.title,
		run: cmd
	}, options);
	if(!options.enable && !options.select) {
		passedOptions[options.enable ? "enable" : "select"] = (state) => cmd(state);
	}
	return new MenuItem(passedOptions);
}

function markActive(state, type) {
	const { from, $from, to, empty } = state.selection;
	return empty
		? !!type.isInSet(state.storedMarks || $from.marks())
		: state.doc.rangeHasMark(from, to, type);
}

function markItem(markType, options) {
	return cmdItem(toggleMark(markType), Object.assign({
		active: (state) => markActive(state, markType),
	}, options));
}

function linkItem(markType) {
	return new MenuItem({
		title: $tw.wiki.getTiddlerText("$:/plugins/tiddlywiki/prosemirror/language/Menu/AddOrRemoveLink", "Add or remove link"),
		icon: icons.link,
		active: (state) => markActive(state, markType),
		enable: (state) => !state.selection.empty,
		run(state, dispatch, view) {
			if(markActive(state, markType)) {
				toggleMark(markType)(state, dispatch);
				return true;
			}
			const { from, to } = state.selection;
			const selectedText = state.doc.textBetween(from, to, "");
			dispatch(state.tr.addMark(from, to, markType.create({ href: selectedText, title: selectedText })));
			view.focus();
		}
	});
}

function wrapListItem(nodeType, options) {
	return cmdItem(wrapInList(nodeType, options.attrs), options);
}

// Pre-built icon specs from core SVG image tiddlers
const underlineIcon = twIcon("$:/core/images/underline", "U");
const strikethroughIcon = twIcon("$:/core/images/strikethrough", "S");
const superscriptIcon = twIcon("$:/core/images/superscript", "X²");
const subscriptIcon = twIcon("$:/core/images/subscript", "X₂");

function buildMenuItems(schema) {
	const r = {};
	let mark;

	mark = schema.marks.strong;
	if(mark) r.toggleStrong = markItem(mark, { title: "Toggle strong style", icon: icons.strong });

	mark = schema.marks.em;
	if(mark) r.toggleEm = markItem(mark, { title: "Toggle emphasis", icon: icons.em });

	mark = schema.marks.underline;
	if(mark) r.toggleUnderline = markItem(mark, { title: "Toggle underline", icon: underlineIcon });

	mark = schema.marks.strike;
	if(mark) r.toggleStrike = markItem(mark, { title: "Toggle strikethrough", icon: strikethroughIcon });

	mark = schema.marks.superscript;
	if(mark) r.toggleSup = markItem(mark, { title: "Toggle superscript", icon: superscriptIcon });

	mark = schema.marks.subscript;
	if(mark) r.toggleSub = markItem(mark, { title: "Toggle subscript", icon: subscriptIcon });

	mark = schema.marks.code;
	if(mark) r.toggleCode = markItem(mark, { title: "Toggle code font", icon: icons.code });

	mark = schema.marks.link;
	if(mark) r.toggleLink = linkItem(mark);

	let node;

	node = schema.nodes.image;
	if(node) r.insertImage = insertImageItem(node);

	node = schema.nodes.bullet_list;
	if(node) r.wrapBulletList = wrapListItem(node, { title: "Wrap in bullet list", icon: icons.bulletList });

	node = schema.nodes.ordered_list;
	if(node) r.wrapOrderedList = wrapListItem(node, { title: "Wrap in ordered list", icon: icons.orderedList });

	node = schema.nodes.blockquote;
	if(node) r.wrapBlockQuote = wrapItem(node, { title: "Wrap in block quote", icon: icons.blockquote });

	node = schema.nodes.paragraph;
	if(node) r.makeParagraph = blockTypeItem(node, { title: "Change to paragraph", label: "Plain" });

	node = schema.nodes.code_block;
	if(node) r.makeCodeBlock = blockTypeItem(node, { title: "Change to code block", label: "Code" });

	node = schema.nodes.heading;
	if(node) {
		for(let i = 1; i <= 6; i++) {
			r[`makeHead${i}`] = blockTypeItem(node, { title: `Change to heading ${i}`, label: `Level ${i}`, attrs: { level: i } });
		}
	}

	node = schema.nodes.horizontal_rule;
	if(node) {
		const hr = node;
		r.insertHorizontalRule = new MenuItem({
			title: "Insert horizontal rule",
			label: "Horizontal rule",
			enable: (state) => canInsert(state, hr),
			run(state, dispatch) {
				dispatch(state.tr.replaceSelectionWith(hr.create()));
			}
		});
	}

	const cut = (arr) => arr.filter(Boolean);

	r.insertMenu = new Dropdown(cut([r.insertImage, r.insertHorizontalRule]), { label: "Insert" });
	r.typeMenu = new Dropdown(cut([
		r.makeParagraph,
		r.makeCodeBlock,
		r.makeHead1 && new DropdownSubmenu(cut([
			r.makeHead1, r.makeHead2, r.makeHead3, r.makeHead4, r.makeHead5, r.makeHead6
		]), { label: "Heading" })
	]), { label: "Type..." });

	r.inlineMenu = [cut([r.toggleStrong, r.toggleEm, r.toggleUnderline, r.toggleStrike, r.toggleCode, r.toggleLink]),
		cut([r.toggleSup, r.toggleSub])];
	r.blockMenu = [cut([r.wrapBulletList, r.wrapOrderedList, r.wrapBlockQuote, joinUpItem, liftItem, selectParentNodeItem])];
	r.fullMenu = r.inlineMenu.concat([[r.insertMenu, r.typeMenu]], [[undoItem, redoItem]], r.blockMenu);

	return r;
}

exports.buildMenuItems = buildMenuItems;
