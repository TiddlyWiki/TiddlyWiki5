/*\
title: test-prosemirror-keymap.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests ProseMirror keymap commands that can run without a browser EditorView.

\*/

"use strict";

describe("ProseMirror keymap commands", () => {

	let buildSchema, buildKeymap, EditorState, NodeSelection;
	try {
		buildSchema = require("$:/plugins/tiddlywiki/prosemirror/core/schema.js").buildSchema;
		buildKeymap = require("$:/plugins/tiddlywiki/prosemirror/core/keymap.js").buildKeymap;
		const prosemirrorState = require("prosemirror-state");
		EditorState = prosemirrorState.EditorState;
		NodeSelection = prosemirrorState.NodeSelection;
	} catch(e) {
		return;
	}

	function createSelectedWidgetParagraphState() {
		const schema = buildSchema();
		const widgetParagraph = schema.nodes.paragraph.create(null, schema.text('<<list-links "[tag[test]]">>'));
		const doc = schema.nodes.doc.create(null, [widgetParagraph]);
		return EditorState.create({
			schema: schema,
			doc: doc,
			selection: NodeSelection.create(doc, 0)
		});
	}

	function applyCommand(state, command) {
		let nextState = state;
		const handled = command(state, (tr) => {
			nextState = state.apply(tr);
		});
		return { handled: handled, state: nextState };
	}

	function expectParagraphInsertedAfterWidget(result, expectedSelectionType) {
		expect(result.handled).toBe(true);
		expect(result.state.doc.childCount).toBe(2);
		expect(result.state.doc.child(0).textContent).toBe('<<list-links "[tag[test]]">>');
		expect(result.state.doc.child(1).type.name).toBe("paragraph");
		expect(result.state.selection.constructor.name).toBe(expectedSelectionType || "TextSelection");
		expect(result.state.selection.from).toBeGreaterThan(result.state.doc.child(0).nodeSize - 1);
	}

	it("Enter inserts a paragraph after a selected rendered widget paragraph", () => {
		const state = createSelectedWidgetParagraphState();
		const keys = buildKeymap(state.schema);
		expect(typeof keys.Enter).toBe("function");
		expectParagraphInsertedAfterWidget(applyCommand(state, keys.Enter));
	});

	it("Shift-Enter inserts a paragraph after a selected rendered widget paragraph", () => {
		const state = createSelectedWidgetParagraphState();
		const keys = buildKeymap(state.schema);
		expect(typeof keys["Shift-Enter"]).toBe("function");
		expectParagraphInsertedAfterWidget(applyCommand(state, keys["Shift-Enter"]));
	});

	it("Enter does not handle a selected regular paragraph", () => {
		const schema = buildSchema();
		const paragraph = schema.nodes.paragraph.create(null, schema.text("ordinary text"));
		const doc = schema.nodes.doc.create(null, [paragraph]);
		const state = EditorState.create({
			schema: schema,
			doc: doc,
			selection: NodeSelection.create(doc, 0)
		});
		const keys = buildKeymap(schema);
		expect(keys.Enter(state, null)).toBe(false);
	});

});