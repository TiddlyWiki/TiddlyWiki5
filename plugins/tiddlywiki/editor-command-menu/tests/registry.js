/*\
title: $:/plugins/tiddlywiki/editor-command-menu/tests/registry.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for the editor-independent command descriptor registry.

\*/

"use strict";

describe("Editor command menu registry", function() {
	const registry = require("$:/plugins/tiddlywiki/editor-command-menu/registry.js");
	const temporaryTitle = "$:/temp/tests/editor-command";

	afterEach(function() {
		$tw.wiki.deleteTiddler(temporaryTitle);
	});

	it("keeps the generic plugin independent of ProseMirror", function() {
		const titles = $tw.wiki.filterTiddlers("[all[tiddlers+shadows]prefix[$:/plugins/tiddlywiki/editor-command-menu/]type[application/javascript]]").filter(function(title) {
			return title.indexOf("/tests/") === -1;
		});
		expect(titles.length).toBeGreaterThan(0);
		titles.forEach(function(title) {
			const text = $tw.wiki.getTiddlerText(title, "");
			expect(text.toLowerCase()).not.toContain("prosemirror");
			expect(text.toLowerCase()).not.toContain("slash-menu");
			expect(text.toLowerCase()).not.toContain("texteditor/snippet");
		});
	});

	it("reads semantic parameters without exposing registry fields as parameters", function() {
		$tw.wiki.addTiddler(new $tw.Tiddler({
			title: temporaryTitle,
			tags: [registry.COMMAND_TAG],
			caption: "Heading",
			"command-id": "toggle-heading",
			"command-level": "2",
			"command-category": "block-type",
			"command-surfaces": "slash-menu block-menu",
			"command-editors": "prosemirror"
		}));
		const command = registry.readCommandDescriptor($tw.wiki, temporaryTitle);
		expect(command.commandId).toBe("toggle-heading");
		expect(command.parameters.level).toBe("2");
		expect(command.parameters.category).toBeUndefined();
		expect(command.surfaces).toEqual(["slash-menu", "block-menu"]);
	});

	it("keeps slash-menu and block-menu command sets distinct", function() {
		const canExecute = function() { return true; };
		const slash = registry.getCommands($tw.wiki, {
			editorType: "prosemirror",
			contentType: "text/vnd.tiddlywiki",
			surface: "slash-menu"
		}, { canExecute: canExecute });
		const block = registry.getCommands($tw.wiki, {
			editorType: "prosemirror",
			contentType: "text/vnd.tiddlywiki",
			surface: "block-menu"
		}, { canExecute: canExecute });
		const slashIds = slash.map(function(command) { return command.commandId; });
		const blockIds = block.map(function(command) { return command.commandId; });
		expect(slashIds).toContain("toggle-mark");
		expect(slashIds).toContain("insert-table");
		expect(slashIds).not.toContain("delete-block");
		expect(blockIds).toContain("delete-block");
		expect(blockIds).toContain("duplicate-block");
		expect(blockIds).not.toContain("toggle-mark");
		expect(blockIds).not.toContain("insert-table");
	});

	it("filters descriptors by editor and executor capability", function() {
		const wrongEditor = registry.getCommands($tw.wiki, {
			editorType: "codemirror",
			contentType: "text/vnd.tiddlywiki",
			surface: "slash-menu"
		}, { canExecute: function() { return true; } });
		expect(wrongEditor.length).toBe(0);

		const filtered = registry.getCommands($tw.wiki, {
			editorType: "prosemirror",
			contentType: "text/vnd.tiddlywiki",
			surface: "slash-menu"
		}, {
			canExecute: function(command) {
				return command.commandId === "insert-table";
			}
		});
		expect(filtered.length).toBe(1);
		expect(filtered[0].commandId).toBe("insert-table");
	});

	it("groups categories contiguously and treats search text literally", function() {
		const commands = registry.getCommands($tw.wiki, {
			editorType: "prosemirror",
			contentType: "text/vnd.tiddlywiki",
			surface: "slash-menu"
		}, { canExecute: function() { return true; } });
		const closedCategories = Object.create(null);
		let previous = null;
		commands.forEach(function(command) {
			if(previous !== null && command.category !== previous) {
				closedCategories[previous] = true;
			}
			expect(closedCategories[command.category]).not.toBe(true);
			previous = command.category;
		});
		expect(function() {
			registry.filterCommands(commands, "[");
		}).not.toThrow();
		expect(registry.filterCommands(commands, "heading 2").some(function(command) {
			return command.parameters.level === "2";
		})).toBe(true);
	});

	it("uses the command-tag list for explicit ordering and labels as a stable fallback", function() {
		const firstTitle = temporaryTitle + "/zeta";
		const secondTitle = temporaryTitle + "/alpha";
		const tagTitle = registry.COMMAND_TAG;
		const originalTag = $tw.wiki.getTiddler(tagTitle);
		try {
			$tw.wiki.addTiddler(new $tw.Tiddler({
				title: firstTitle,
				tags: [tagTitle],
				caption: "Zulu",
				"command-id": "test-command",
				"command-category": "test",
				"command-surfaces": "test-surface"
			}));
			$tw.wiki.addTiddler(new $tw.Tiddler({
				title: secondTitle,
				tags: [tagTitle],
				caption: "Alpha",
				"command-id": "test-command",
				"command-category": "test",
				"command-surfaces": "test-surface"
			}));
			let commands = registry.getCommands($tw.wiki, {
				surface: "test-surface"
			}, { canExecute: function() { return true; } });
			expect(commands.map(function(command) { return command.label; })).toEqual(["Alpha", "Zulu"]);

			$tw.wiki.addTiddler(new $tw.Tiddler(originalTag, {
				title: tagTitle,
				list: [firstTitle, secondTitle]
			}));
			commands = registry.getCommands($tw.wiki, {
				surface: "test-surface"
			}, { canExecute: function() { return true; } });
			expect(commands.map(function(command) { return command.label; })).toEqual(["Zulu", "Alpha"]);
		} finally{
			$tw.wiki.deleteTiddler(firstTitle);
			$tw.wiki.deleteTiddler(secondTitle);
			if(originalTag) {
				$tw.wiki.addTiddler(originalTag);
			} else {
				$tw.wiki.deleteTiddler(tagTitle);
			}
		}
	});
});
