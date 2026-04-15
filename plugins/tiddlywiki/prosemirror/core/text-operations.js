/*\
title: $:/plugins/tiddlywiki/prosemirror/core/text-operations.js
type: application/javascript
module-type: library

Handles toolbar text operations dispatched from TW's editor toolbar
(wrap-selection, prefix-lines, wrap-lines, make-link, etc.)
and maps them to ProseMirror commands.

\*/

"use strict";

const pmCommands = require("prosemirror-commands");
const flatListCommands = require("prosemirror-flat-list");

const MARK_MAP = {
	"''": "strong",
	"//": "em",
	"__": "underline",
	"~~": "strike",
	"^^": "superscript",
	",,": "subscript",
	"`": "code"
};

function wrapSelectionToMark(prefix, suffix) {
	if(!prefix || !suffix || prefix !== suffix) return null;
	return MARK_MAP[prefix] || null;
}

function handleMakeLink(view, schema, paramObj) {
	const { state } = view;
	if(!schema.marks.link) return false;

	const linkTarget = paramObj.text || "";
	const sel = state.selection;

	if(linkTarget && !sel.empty) {
		const linkMark = schema.marks.link.create({ href: linkTarget, title: linkTarget });
		view.dispatch(state.tr.addMark(sel.from, sel.to, linkMark));
		view.focus();
		return true;
	}
	if(linkTarget && sel.empty) {
		const linkMark = schema.marks.link.create({ href: linkTarget, title: linkTarget });
		const linkText = schema.text(linkTarget, [linkMark]);
		view.dispatch(state.tr.replaceSelectionWith(linkText, false));
		view.focus();
		return true;
	}
	return false;
}

function handleTextOperation(engine, event) {
	if(!engine.view) return false;
	const { param, paramObject: paramObj = {} } = event;
	const { schema, view } = engine;
	const { state } = view;
	const dispatch = view.dispatch.bind(view);

	if(param === "wrap-selection") {
		const markName = wrapSelectionToMark(paramObj.prefix, paramObj.suffix);
		if(markName && schema.marks[markName]) {
			pmCommands.toggleMark(schema.marks[markName])(state, dispatch);
			view.focus();
			return true;
		}
		if(paramObj.prefix === "[[" && paramObj.suffix === "]]") {
			return handleMakeLink(view, schema, event.paramObject || {});
		}
		return false;
	}

	if(param === "prefix-lines" && paramObj.character === "!") {
		const level = parseInt(paramObj.count, 10) || 1;
		if(level >= 1 && level <= 6 && schema.nodes.heading) {
			const currentNode = state.selection.$from.parent;
			if(currentNode.type === schema.nodes.heading && currentNode.attrs.level === level) {
				pmCommands.setBlockType(schema.nodes.paragraph)(state, dispatch);
			} else {
				pmCommands.setBlockType(schema.nodes.heading, { level })(state, dispatch);
			}
			view.focus();
			return true;
		}
	}

	if(param === "prefix-lines" && paramObj.character === "*" && schema.nodes.list) {
		flatListCommands.createWrapInListCommand({ kind: "bullet" })(state, dispatch);
		view.focus();
		return true;
	}

	if(param === "prefix-lines" && paramObj.character === "#" && schema.nodes.list) {
		flatListCommands.createWrapInListCommand({ kind: "ordered" })(state, dispatch);
		view.focus();
		return true;
	}

	if(param === "wrap-lines" && paramObj.prefix === "```" && paramObj.suffix === "```" && schema.nodes.code_block) {
		const currentNode = state.selection.$from.parent;
		if(currentNode.type === schema.nodes.code_block) {
			pmCommands.setBlockType(schema.nodes.paragraph)(state, dispatch);
		} else {
			pmCommands.setBlockType(schema.nodes.code_block)(state, dispatch);
		}
		view.focus();
		return true;
	}

	if(param === "wrap-lines" && paramObj.prefix === "<<<" && paramObj.suffix === "<<<" && schema.nodes.blockquote) {
		const $from = state.selection.$from;
		let insideBlockquote = false;
		for(let d = $from.depth; d > 0; d--) {
			if($from.node(d).type === schema.nodes.blockquote) {
				pmCommands.lift(state, dispatch);
				view.focus();
				insideBlockquote = true;
				break;
			}
		}
		if(!insideBlockquote) {
			pmCommands.wrapIn(schema.nodes.blockquote)(state, dispatch);
			view.focus();
		}
		return true;
	}

	if(param === "make-link") return handleMakeLink(view, schema, event.paramObject || {});

	if(param === "insert-text" && paramObj.text !== undefined) {
		view.dispatch(state.tr.insertText(paramObj.text));
		view.focus();
		return true;
	}

	if(param === "replace-selection" && paramObj.text !== undefined) {
		view.dispatch(state.tr.replaceSelectionWith(schema.text(paramObj.text), false));
		view.focus();
		return true;
	}

	if(param === "replace-all" && paramObj.text !== undefined) {
		engine.updateDomNodeText(paramObj.text);
		view.focus();
		return true;
	}

	if(param === "focus-editor") {
		view.focus();
		return true;
	}

	if(param === "toggle-source") {
		engine.toggleSourcePanel();
		return true;
	}

	return false;
}

exports.handleTextOperation = handleTextOperation;
