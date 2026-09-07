/*\
title: test-prosemirror-menu-elements.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for menu-elements.js (EditorAction collection, snippet loading, etc.)
\*/

"use strict";

describe("ProseMirror menu-elements tests", () => {

	let getAllMenuElements, flattenMenuElementsWithGroup, getBuiltinActionCommands;
	let buildSchema, SlashMenuPlugin, SlashMenuKey, EditorState;
	try {
		const mod = require("$:/plugins/tiddlywiki/prosemirror/features/slash-menu/menu-elements.js");
		getAllMenuElements = mod.getAllMenuElements;
		flattenMenuElementsWithGroup = mod.flattenMenuElementsWithGroup;
		getBuiltinActionCommands = mod.getBuiltinActionCommands;
		buildSchema = require("$:/plugins/tiddlywiki/prosemirror/core/engine.js").buildSchema;
		const slashPlugin = require("$:/plugins/tiddlywiki/prosemirror/features/slash-menu/plugin.js");
		SlashMenuPlugin = slashPlugin.SlashMenuPlugin;
		SlashMenuKey = slashPlugin.SlashMenuKey;
		EditorState = require("prosemirror-state").EditorState;
	} catch(e) {
		// prosemirror dependencies not available in this test env
		return;
	}

	function makeSlashMenuView(triggerOptions) {
		const schema = buildSchema();
		const plugin = SlashMenuPlugin([{
			id: "paragraph",
			label: "Paragraph",
			type: "command",
			command: function() {}
		}], triggerOptions || { triggerKeys: ["/"] });
		const state = EditorState.create({
			schema: schema,
			doc: schema.nodes.doc.create(null, [schema.nodes.paragraph.create()]),
			plugins: [plugin]
		});
		return {
			plugin: plugin,
			state: state,
			dispatch: function(tr) {
				this.state = this.state.apply(tr);
			}
		};
	}

	describe("getBuiltinActionCommands", () => {

		it("should return an object with command functions", () => {
			const schema = buildSchema();
			const cmds = getBuiltinActionCommands(schema);
			expect(cmds).toBeDefined();
			expect(typeof cmds).toBe("object");
		});

		it("should have entries for common actions", () => {
			const schema = buildSchema();
			const cmds = getBuiltinActionCommands(schema);
			const expectedKeys = [
				"codeblock", "blockquote", "paragraph",
				"heading1", "heading2", "heading3", "heading4", "heading5", "heading6",
				"horizontal-rule", "bold", "italic", "underline", "strikethrough", "code-inline"
			];
			for(let i = 0; i < expectedKeys.length; i++) {
				expect(typeof cmds[expectedKeys[i]]).toBe("function",
					"Expected command for '" + expectedKeys[i] + "' to be a function");
			}
		});
	});

	describe("getAllMenuElements", () => {

		it("should return an array", () => {
			const schema = buildSchema();
			const elements = getAllMenuElements($tw.wiki, schema);
			expect(Array.isArray(elements)).toBe(true);
		});

		it("should include EditorAction tiddler-based elements", () => {
			const schema = buildSchema();
			const elements = getAllMenuElements($tw.wiki, schema);
			// Should have some action-* items from the editor-actions/*.tid files
			const actionItems = elements.filter((e) => e && e.id && e.id.startsWith("action-"));
			expect(actionItems.length).toBeGreaterThan(0);
		});

		it("should include block-type category items", () => {
			const schema = buildSchema();
			const elements = getAllMenuElements($tw.wiki, schema);
			const blockTypeItems = elements.filter((e) => e && e.category === "block-type" && e.type === "command");
			expect(blockTypeItems.length).toBeGreaterThan(0);
		});
	});

	describe("flattenMenuElementsWithGroup", () => {

		it("should flatten submenus into group headers + items", () => {
			const input = [
				{ id: "a", label: "A", type: "command", available: () => true },
				{
					id: "sub1", label: "Sub 1", type: "submenu", available: () => true,
					elements: [
						{ id: "b", label: "B", type: "command", available: () => true },
						{ id: "c", label: "C", type: "command", available: () => true }
					]
				}
			];
			const flat = flattenMenuElementsWithGroup(input);
			expect(flat.length).toBe(4); // a, group-sub1, b, c
			expect(flat[0].id).toBe("a");
			expect(flat[1].id).toBe("group-sub1");
			expect(flat[1].type).toBe("group");
			expect(flat[2].id).toBe("b");
			expect(flat[3].id).toBe("c");
		});

		it("should handle empty array", () => {
			expect(flattenMenuElementsWithGroup([]).length).toBe(0);
		});
	});

	describe("SlashMenuPlugin trigger matching", () => {
		it("should open for '/' even if the physical key code differs", () => {
			const view = makeSlashMenuView({ triggerKeys: ["/"] });
			const handled = view.plugin.props.handleKeyDown(view, {
				key: "/",
				code: "Digit7"
			});
			expect(handled).toBe(true);
			expect(SlashMenuKey.getState(view.state).open).toBe(true);
		});

		it("should not open for '#' even when it comes from the slash key position", () => {
			const view = makeSlashMenuView({ triggerKeys: ["/"] });
			const handled = view.plugin.props.handleKeyDown(view, {
				key: "#",
				code: "Slash"
			});
			expect(handled).toBe(false);
			expect(SlashMenuKey.getState(view.state).open).toBe(false);
		});
	});
});
