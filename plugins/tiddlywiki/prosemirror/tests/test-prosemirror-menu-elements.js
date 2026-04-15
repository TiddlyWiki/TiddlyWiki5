/*\
title: test-prosemirror-menu-elements.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for menu-elements.js (EditorAction collection, snippet loading, etc.)
\*/

"use strict";

describe("ProseMirror menu-elements tests", () => {

	let getAllMenuElements, flattenMenuElementsWithGroup, getBuiltinActionCommands;
	let buildSchema;
	try {
		const mod = require("$:/plugins/tiddlywiki/prosemirror/features/slash-menu/menu-elements.js");
		getAllMenuElements = mod.getAllMenuElements;
		flattenMenuElementsWithGroup = mod.flattenMenuElementsWithGroup;
		getBuiltinActionCommands = mod.getBuiltinActionCommands;
		buildSchema = require("$:/plugins/tiddlywiki/prosemirror/core/engine.js").buildSchema;
	} catch(e) {
		// prosemirror dependencies not available in this test env
		return;
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
			const actionItems = elements.filter(e => e && e.id && e.id.startsWith("action-"));
			expect(actionItems.length).toBeGreaterThan(0);
		});

		it("should include block-type submenu", () => {
			const schema = buildSchema();
			const elements = getAllMenuElements($tw.wiki, schema);
			const blockTypeSubmenu = elements.find(e => e && e.id === "blocktype-submenu");
			expect(blockTypeSubmenu).toBeDefined();
			expect(blockTypeSubmenu.type).toBe("submenu");
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
});
