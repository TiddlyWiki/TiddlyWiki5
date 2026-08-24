/*\
title: $:/plugins/tiddlywiki/prosemirror/tests/test-editor-commands.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for semantic command execution without a browser EditorView.

\*/

"use strict";

describe("ProseMirror semantic editor commands", function() {
	const EditorState = require("prosemirror-state").EditorState;
	const TextSelection = require("prosemirror-state").TextSelection;
	const NodeSelection = require("prosemirror-state").NodeSelection;
	const AllSelection = require("prosemirror-state").AllSelection;
	const buildSchema = require("$:/plugins/tiddlywiki/prosemirror/core/schema.js").buildSchema;
	const commands = require("$:/plugins/tiddlywiki/prosemirror/core/editor-commands.js");
	const textOperations = require("$:/plugins/tiddlywiki/prosemirror/core/text-operations.js");
	const editorShared = require("$:/plugins/tiddlywiki/prosemirror/core/editor-shared.js");
	const dropLogic = require("$:/plugins/tiddlywiki/prosemirror/features/drag-handle/drop-logic.js");
	let schema;

	function createView(docJSON, selection) {
		const view = {
			state: EditorState.create({
				doc: schema.nodeFromJSON(docJSON),
				selection: selection
			}),
			focused: false,
			dispatch: function(transaction) {
				this.state = this.state.apply(transaction);
			},
			focus: function() {
				this.focused = true;
			}
		};
		return view;
	}

	function command(commandId, parameters) {
		return commands.createCommand(commandId, parameters);
	}

	function createSourceView(source) {
		return createView(editorShared.parseWikiTextToDoc($tw.wiki, "text/vnd.tiddlywiki", source));
	}

	beforeAll(function() {
		schema = buildSchema();
	});

	it("uses one structured handler for menu and toolbar mark commands", function() {
		const doc = schema.node("doc", null, [schema.node("paragraph", null, [schema.text("hello")])]);
		const view = createView(doc.toJSON());
		view.state = view.state.apply(view.state.tr.setSelection(TextSelection.create(view.state.doc, 1, 6)));
		const context = { view: view, wiki: $tw.wiki };
		expect(commands.canExecuteEditorCommand(context, command("toggle-mark", { mark: "strong" }))).toBe(true);
		expect(commands.executeEditorCommand(context, command("toggle-mark", { mark: "strong" }))).toBe(true);
		expect(view.state.doc.firstChild.firstChild.marks[0].type.name).toBe("strong");
		expect(view.focused).toBe(true);
	});

	it("toggles a heading without serializing and reparsing the document", function() {
		const doc = schema.node("doc", null, [schema.node("paragraph", null, [schema.text("Title")])]);
		const view = createView(doc.toJSON());
		const originalState = view.state;
		const context = { view: view, wiki: $tw.wiki };
		expect(commands.executeEditorCommand(context, command("toggle-heading", { level: 2 }))).toBe(true);
		expect(view.state).not.toBe(originalState);
		expect(view.state.doc.firstChild.type.name).toBe("heading");
		expect(view.state.doc.firstChild.attrs.level).toBe(2);
		expect(commands.executeEditorCommand(context, command("toggle-heading", { level: 2 }))).toBe(true);
		expect(view.state.doc.firstChild.type.name).toBe("paragraph");
	});

	it("does not rewrite a paragraph merely to clear its source metadata", function() {
		const view = createSourceView("Current paragraph");
		const context = { view: view, wiki: $tw.wiki, blockPos: 0, blockNode: view.state.doc.firstChild };
		expect(view.state.doc.firstChild.attrs.twSourceGroup).not.toBeNull();
		expect(commands.canExecuteEditorCommand(context, command("set-paragraph"))).toBe(false);
		expect(commands.executeEditorCommand(context, command("set-paragraph"))).toBe(false);
		expect(editorShared.serializeDocJSON(view.state.doc.toJSON())).toBe("Current paragraph");
	});

	it("unwraps a quote selected from the block handle", function() {
		const quote = schema.node("blockquote", null, [
			schema.node("paragraph", null, [schema.text("Quoted")])
		]);
		const view = createView(schema.node("doc", null, [quote]).toJSON());
		const context = { view: view, wiki: $tw.wiki, blockPos: 0, blockNode: view.state.doc.firstChild };
		expect(commands.executeEditorCommand(context, command("toggle-blockquote"))).toBe(true);
		expect(view.state.doc.firstChild.type.name).toBe("paragraph");
		expect(view.state.doc.firstChild.textContent).toBe("Quoted");
	});

	it("duplicates and deletes the block selected by the handle context", function() {
		const doc = schema.node("doc", null, [
			schema.node("paragraph", null, [schema.text("One")]),
			schema.node("paragraph", null, [schema.text("Two")])
		]);
		const view = createView(doc.toJSON());
		view.state = view.state.apply(view.state.tr.setSelection(NodeSelection.create(view.state.doc, 0)));
		const context = { view: view, wiki: $tw.wiki, blockPos: 0, blockNode: view.state.doc.firstChild };
		expect(commands.executeEditorCommand(context, command("duplicate-block"))).toBe(true);
		expect(view.state.doc.childCount).toBe(3);
		expect(view.state.doc.child(0).textContent).toBe("One");
		expect(view.state.doc.child(1).textContent).toBe("One");
		context.blockNode = view.state.doc.firstChild;
		expect(commands.executeEditorCommand(context, command("delete-block"))).toBe(true);
		expect(view.state.doc.childCount).toBe(2);
		expect(view.state.doc.firstChild.textContent).toBe("One");
	});

	it("gives a duplicated final block a fresh serialization boundary", function() {
		const view = createSourceView("One\n\nTwo");
		const secondPos = view.state.doc.firstChild.nodeSize;
		const second = view.state.doc.nodeAt(secondPos);
		const context = { view: view, wiki: $tw.wiki, blockPos: secondPos, blockNode: second };
		expect(commands.executeEditorCommand(context, command("duplicate-block"))).toBe(true);
		expect(editorShared.serializeDocJSON(view.state.doc.toJSON())).toBe("One\n\nTwo\n\nTwo");
	});

	it("gives a reordered block a fresh serialization boundary", function() {
		const view = createSourceView("One\n\nTwo");
		const first = view.state.doc.firstChild;
		const target = {
			insertPos: view.state.doc.content.size,
			dropContext: "doc",
			unwrapList: false
		};
		const transaction = dropLogic.buildMoveTransaction(view, { pos: 0, node: first }, target);
		expect(transaction).not.toBeNull();
		view.dispatch(transaction);
		expect(editorShared.serializeDocJSON(view.state.doc.toJSON())).toBe("Two\n\nOne");
	});

	it("keeps a valid empty paragraph when deleting the only block", function() {
		const doc = schema.node("doc", null, [schema.node("paragraph", null, [schema.text("Only")])]);
		const view = createView(doc.toJSON());
		const context = { view: view, wiki: $tw.wiki, blockPos: 0, blockNode: view.state.doc.firstChild };
		expect(commands.executeEditorCommand(context, command("delete-block"))).toBe(true);
		expect(view.state.doc.childCount).toBe(1);
		expect(view.state.doc.firstChild.type.name).toBe("paragraph");
		expect(view.state.doc.firstChild.textContent).toBe("");
	});

	it("marks newly inserted typed blocks for one-shot source editing", function() {
		const doc = schema.node("doc", null, [schema.node("paragraph")]);
		const view = createView(doc.toJSON());
		const context = { view: view, wiki: $tw.wiki };
		expect(commands.executeEditorCommand(context, command("insert-typed-block", { type: "application/json" }))).toBe(true);
		let typed = null;
		view.state.doc.descendants(function(node) {
			if(node.type.name === "typed_block") typed = node;
		});
		expect(typed).not.toBeNull();
		expect(typed.attrs.parseType).toBe("application/json");
		expect(typed.attrs.autoEdit).toBe(true);
	});

	it("parses toolbar WikiText insertions into structured nodes", function() {
		const view = createSourceView("");
		const context = { view: view, wiki: $tw.wiki };
		expect(commands.executeEditorCommand(context, command("insert-wikitext", {
			text: "[img[Example image]]"
		}))).toBe(true);
		expect(view.state.doc.firstChild.type.name).toBe("paragraph");
		expect(view.state.doc.firstChild.firstChild.type.name).toBe("image");
		expect(editorShared.serializeDocJSON(view.state.doc.toJSON())).toBe("[img[Example image]]");
	});

	it("keeps inline macro and transclusion snippets inline in populated text blocks", function() {
		[
			{ source: "<<now>>", expected: "before<<now>> after" },
			{ source: "{{Target}}", expected: "before{{Target}} after" }
		].forEach(function(example) {
			const view = createSourceView("before after");
			view.state = view.state.apply(view.state.tr.setSelection(TextSelection.create(view.state.doc, 7)));
			const context = { view: view, wiki: $tw.wiki };
			expect(commands.executeEditorCommand(context, command("insert-wikitext", {
				text: example.source
			}))).toBe(true);
			expect(view.state.doc.firstChild.child(1).type.name).toBe("opaque_inline");
			expect(editorShared.serializeDocJSON(view.state.doc.toJSON())).toBe(example.expected);
		});
	});

	it("wraps a trimmed text selection in a source-backed inline transclusion", function() {
		const doc = schema.node("doc", null, [schema.node("paragraph", null, [schema.text(" Target ")])]);
		const view = createView(doc.toJSON());
		view.state = view.state.apply(view.state.tr.setSelection(TextSelection.create(view.state.doc, 1, 9)));
		const context = { view: view, wiki: $tw.wiki };
		expect(commands.canExecuteEditorCommand(context, command("wrap-transclusion"))).toBe(true);
		expect(commands.executeEditorCommand(context, command("wrap-transclusion"))).toBe(true);
		expect(view.state.doc.firstChild.content.content.map(function(node) {
			return node.type.name;
		})).toEqual(["text", "opaque_inline", "text"]);
		expect(view.state.doc.firstChild.child(1).attrs.rawText).toBe("{{Target}}");
		expect(editorShared.serializeDocJSON(view.state.doc.toJSON())).toBe(" {{Target}} ");
	});

	it("keeps custom toolbar wrappers executable without using source offsets", function() {
		const doc = schema.node("doc", null, [schema.node("paragraph", null, [schema.text("value")])]);
		const view = createView(doc.toJSON());
		view.state = view.state.apply(view.state.tr.setSelection(TextSelection.create(view.state.doc, 1, 6)));
		const context = { view: view, wiki: $tw.wiki };
		expect(commands.executeEditorCommand(context, command("wrap-wikitext", {
			prefix: "<$text text=\"",
			suffix: "\"/>"
		}))).toBe(true);
		expect(view.state.doc.firstChild.firstChild.type.name).toBe("opaque_inline");
		expect(editorShared.serializeDocJSON(view.state.doc.toJSON())).toBe("<$text text=\"value\"/>");
	});

	it("adapts third-party prefix-lines operations at top-level block boundaries", function() {
		const view = createSourceView("first\n\nsecond");
		view.state = view.state.apply(view.state.tr.setSelection(TextSelection.create(view.state.doc, 2)));
		const context = { view: view, wiki: $tw.wiki };
		expect(commands.executeEditorCommand(context, command("prefix-wikitext-lines", {
			character: "[ ]",
			count: "1"
		}))).toBe(true);
		expect(editorShared.serializeDocJSON(view.state.doc.toJSON())).toBe("[ ] first\n\nsecond");
	});

	it("routes an actual third-party prefix-lines toolbar message through the safe adapter", function() {
		const view = createSourceView("task");
		const engine = { view: view, schema: schema, wiki: $tw.wiki, type: "text/vnd.tiddlywiki" };
		expect(textOperations.handleTextOperation(engine, {
			param: "prefix-lines",
			paramObject: { character: "[ ]", count: "1" }
		})).toBe(true);
		expect(editorShared.serializeDocJSON(view.state.doc.toJSON())).toBe("[ ] task");
	});

	it("normalises the standard toolbar's leading newline before toggling a code block", function() {
		const view = createSourceView("code");
		const engine = { view: view, schema: schema, wiki: $tw.wiki, type: "text/vnd.tiddlywiki" };
		expect(textOperations.handleTextOperation(engine, {
			param: "wrap-lines",
			paramObject: { prefix: "\n```", suffix: "```" }
		})).toBe(true);
		expect(view.state.doc.firstChild.type.name).toBe("code_block");
		expect(editorShared.serializeDocJSON(view.state.doc.toJSON())).toBe("```\ncode\n```");
	});

	it("adapts custom wrap-lines operations without source offsets", function() {
		const view = createSourceView("selected block\n\nother block");
		view.state = view.state.apply(view.state.tr.setSelection(TextSelection.create(view.state.doc, 2)));
		const context = { view: view, wiki: $tw.wiki };
		expect(commands.executeEditorCommand(context, command("wrap-wikitext-lines", {
			prefix: "\n@@.notice",
			suffix: "@@"
		}))).toBe(true);
		expect(editorShared.serializeDocJSON(view.state.doc.toJSON())).toBe("@@.notice\nselected block\n@@\n\nother block");
	});

	it("saves a structural selection through the toolbar compatibility command", function() {
		const destinationTitle = "$:/temp/tests/prosemirror-saved-selection";
		try {
			const view = createSourceView("one\n\ntwo");
			view.state = view.state.apply(view.state.tr.setSelection(new AllSelection(view.state.doc)));
			const context = { view: view, wiki: $tw.wiki };
			expect(commands.executeEditorCommand(context, command("save-selection", {
				tiddler: destinationTitle,
				field: "text"
			}))).toBe(true);
			expect($tw.wiki.getTiddlerText(destinationTitle)).toBe("one\n\ntwo");
		} finally{
			$tw.wiki.deleteTiddler(destinationTitle);
		}
	});

	it("excises a selection without converting ProseMirror positions to source offsets", function() {
		const destinationTitle = "$:/temp/tests/prosemirror-excision";
		const draftTitle = "$:/temp/tests/prosemirror-excision-source";
		try {
			$tw.wiki.addTiddler(new $tw.Tiddler({
				title: draftTitle,
				"draft.of": "Original tiddler",
				type: "text/vnd.tiddlywiki",
				text: "one two"
			}));
			const view = createSourceView("one two");
			view.state = view.state.apply(view.state.tr.setSelection(TextSelection.create(view.state.doc, 1, 4)));
			const context = {
				view: view,
				wiki: $tw.wiki,
				contentType: "text/vnd.tiddlywiki",
				engine: { type: "text/vnd.tiddlywiki", widget: { editTitle: draftTitle } }
			};
			expect(commands.executeEditorCommand(context, command("excise-selection", {
				title: destinationTitle,
				type: "transclude",
				tagnew: "yes"
			}))).toBe(true);
			const destination = $tw.wiki.getTiddler(destinationTitle);
			expect(destination.fields.text).toBe("one");
			expect(destination.fields.tags).toEqual(["Original tiddler"]);
			expect(editorShared.serializeDocJSON(view.state.doc.toJSON())).toBe("{{" + destinationTitle + "}} two");
		} finally{
			$tw.wiki.deleteTiddler(destinationTitle);
			$tw.wiki.deleteTiddler(draftTitle);
		}
	});

	it("excises a multi-block selection to a block source atom", function() {
		const destinationTitle = "$:/temp/tests/prosemirror-block-excision";
		try {
			const view = createSourceView("one\n\ntwo");
			view.state = view.state.apply(view.state.tr.setSelection(new AllSelection(view.state.doc)));
			const context = {
				view: view,
				wiki: $tw.wiki,
				contentType: "text/vnd.tiddlywiki",
				engine: { type: "text/vnd.tiddlywiki", widget: { editTitle: "Source" } }
			};
			expect(commands.executeEditorCommand(context, command("excise-selection", {
				title: destinationTitle,
				type: "transclude"
			}))).toBe(true);
			expect($tw.wiki.getTiddlerText(destinationTitle)).toBe("one\n\ntwo");
			expect(view.state.doc.childCount).toBe(1);
			expect(view.state.doc.firstChild.type.name).toBe("opaque_block");
			expect(editorShared.serializeDocJSON(view.state.doc.toJSON())).toBe("{{" + destinationTitle + "}}");
		} finally{
			$tw.wiki.deleteTiddler(destinationTitle);
		}
	});

	it("replaces all content with a transaction instead of rebuilding state", function() {
		const view = createSourceView("Before");
		const originalState = view.state;
		const context = { view: view, wiki: $tw.wiki };
		expect(commands.executeEditorCommand(context, command("replace-all-wikitext", {
			text: "!! After"
		}))).toBe(true);
		expect(view.state).not.toBe(originalState);
		expect(view.state.doc.firstChild.type.name).toBe("heading");
		expect(view.state.doc.firstChild.attrs.level).toBe(2);
		expect(editorShared.serializeDocJSON(view.state.doc.toJSON())).toBe("!! After");
	});
});
