/*\
title: test-prosemirror-slash-menu.js
type: application/javascript
tags: [[$:/tags/test-spec]]
\*/

"use strict";

describe("ProseMirror slash trigger", () => {
	const { EditorState, TextSelection } = require("prosemirror-state");
	const schema = require("$:/plugins/tiddlywiki/prosemirror/core/schema.js").buildSchema();
	const shouldOpen = require("$:/plugins/tiddlywiki/prosemirror/features/slash-menu/plugin.js").shouldOpen;

	function view(type, text) {
		const doc = schema.nodes.doc.create(null,[schema.nodes[type].create(null,text ? schema.text(text) : null)]);
		return { state: EditorState.create({ doc, selection: TextSelection.create(doc,doc.content.size - 1) }) };
	}

	it("opens at block start or after whitespace", () => {
		expect(shouldOpen(view("paragraph",""),{ key: "/" })).toBe(true);
		expect(shouldOpen(view("paragraph","Some "),{ key: "/" })).toBe(true);
	});

	it("keeps ordinary slashes inside a word literal", () => {
		expect(shouldOpen(view("paragraph","https:"),{ key: "/" })).toBe(false);
	});

	it("does not intercept code block input", () => {
		expect(shouldOpen(view("code_block",""),{ key: "/" })).toBe(false);
	});

	it("does not open during IME composition", () => {
		const editor = view("paragraph","");
		expect(shouldOpen(editor,{ key: "/", isComposing: true })).toBe(false);
		expect(shouldOpen(editor,{ key: "/", keyCode: 229 })).toBe(false);
		editor.composing = true;
		expect(shouldOpen(editor,{ key: "/" })).toBe(false);
	});
});
