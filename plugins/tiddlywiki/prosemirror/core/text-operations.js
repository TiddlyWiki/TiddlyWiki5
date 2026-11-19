/*\
title: $:/plugins/tiddlywiki/prosemirror/core/text-operations.js
type: application/javascript
module-type: library

Handles toolbar text operations dispatched from TW's editor toolbar
(wrap-selection, prefix-lines, wrap-lines, make-link, etc.)
and maps them to ProseMirror commands.

\*/

"use strict";

const {
	executeEditorCommand,
	createCommand
} = require("$:/plugins/tiddlywiki/prosemirror/core/editor-commands.js");

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

	if(!sel.empty) {
		// When selection exists, use explicit target if given, otherwise
		// fall back to the selected text itself (handles the "linkify" /
		// wrap-selection-with-[[ ]] toolbar button which sends no `text`).
		const href = linkTarget || state.doc.textBetween(sel.from, sel.to);
		const linkMark = schema.marks.link.create({ href: href, title: href });
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
	const commandContext = {
		view: view,
		wiki: engine.wiki,
		engine: engine,
		editorType: "prosemirror",
		contentType: engine.type || "text/vnd.tiddlywiki"
	};

	if(param === "wrap-selection") {
		const markName = wrapSelectionToMark(paramObj.prefix, paramObj.suffix);
		if(markName && schema.marks[markName]) {
			return executeEditorCommand(commandContext, createCommand("toggle-mark", { mark: markName }));
		}
		if(paramObj.prefix === "[[" && paramObj.suffix === "]]") {
			return handleMakeLink(view, schema, event.paramObject || {});
		}
		if(paramObj.prefix === "{{" && paramObj.suffix === "}}") {
			return executeEditorCommand(commandContext, createCommand("wrap-transclusion"));
		}
		return executeEditorCommand(commandContext, createCommand("wrap-wikitext", {
			prefix: paramObj.prefix,
			suffix: paramObj.suffix,
			trimSelection: paramObj.trimSelection
		}));
	}

	if(param === "prefix-lines" && paramObj.character === "!") {
		const level = parseInt(paramObj.count, 10) || 1;
		if(level >= 1 && level <= 6 && schema.nodes.heading) {
			return executeEditorCommand(commandContext, createCommand("toggle-heading", { level: level }));
		}
	}

	if(param === "prefix-lines" && paramObj.character === "*" && schema.nodes.list) {
		return executeEditorCommand(commandContext, createCommand("toggle-list", { kind: "bullet" }));
	}

	if(param === "prefix-lines" && paramObj.character === "#" && schema.nodes.list) {
		return executeEditorCommand(commandContext, createCommand("toggle-list", { kind: "ordered" }));
	}
	if(param === "prefix-lines") {
		return executeEditorCommand(commandContext, createCommand("prefix-wikitext-lines", {
			character: paramObj.character,
			count: paramObj.count
		}));
	}

	const linePrefix = typeof paramObj.prefix === "string" ? paramObj.prefix.replace(/^\r?\n/, "") : "";
	if(param === "wrap-lines" && linePrefix === "```" && paramObj.suffix === "```" && schema.nodes.code_block) {
		return executeEditorCommand(commandContext, createCommand("toggle-code-block"));
	}

	if(param === "wrap-lines" && linePrefix === "<<<" && paramObj.suffix === "<<<" && schema.nodes.blockquote) {
		return executeEditorCommand(commandContext, createCommand("toggle-blockquote"));
	}
	if(param === "wrap-lines") {
		return executeEditorCommand(commandContext, createCommand("wrap-wikitext-lines", {
			prefix: paramObj.prefix,
			suffix: paramObj.suffix
		}));
	}

	if(param === "make-link") return handleMakeLink(view, schema, event.paramObject || {});

	if(param === "insert-text" && paramObj.text !== undefined) {
		return executeEditorCommand(commandContext, createCommand("insert-wikitext", { text: paramObj.text }));
	}

	if(param === "replace-selection" && paramObj.text !== undefined) {
		return executeEditorCommand(commandContext, createCommand("insert-wikitext", { text: paramObj.text }));
	}

	if(param === "replace-all" && paramObj.text !== undefined) {
		return executeEditorCommand(commandContext, createCommand("replace-all-wikitext", { text: paramObj.text }));
	}

	if(param === "excise") {
		return executeEditorCommand(commandContext, createCommand("excise-selection", paramObj));
	}

	if(param === "save-selection") {
		return executeEditorCommand(commandContext, createCommand("save-selection", paramObj));
	}

	if(param === "focus-editor") {
		engine.focus();
		return true;
	}

	return false;
}

exports.handleTextOperation = handleTextOperation;
