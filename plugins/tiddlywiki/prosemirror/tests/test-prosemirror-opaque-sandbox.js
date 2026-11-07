/*\
title: test-prosemirror-opaque-sandbox.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the block-local tiddler bridge used by interactive opaque WikiText rules.

\*/

"use strict";

describe("ProseMirror opaque block sandbox", function() {
	const OpaqueSourceSandbox = require("$:/plugins/tiddlywiki/prosemirror/blocks/opaque-sandbox.js").OpaqueSourceSandbox;

	function makeWiki() {
		const texts = Object.create(null);
		const listeners = [];
		return {
			texts: texts,
			listeners: listeners,
			deleted: [],
			setCalls: [],
			sourceTiddlers: Object.create(null),
			generateNewTitle: function() {
				return "$:/temp/ProseMirror/RenderedBlock/test";
			},
			addTiddler: function(fields) {
				texts[fields.title] = fields.text || "";
				this.lastAddedFields = fields;
			},
			getTiddler: function(title) {
				return this.sourceTiddlers[title];
			},
			getTiddlerText: function(title, fallback) {
				return Object.prototype.hasOwnProperty.call(texts, title) ? texts[title] : fallback;
			},
			setText: function(title, field, index, text, options) {
				texts[title] = text;
				this.setCalls.push({ title: title, field: field, index: index, text: text, options: options });
			},
			deleteTiddler: function(title) {
				delete texts[title];
				this.deleted.push(title);
			},
			addEventListener: function(type, listener) {
				if(type === "change") listeners.push(listener);
			},
			removeEventListener: function(type, listener) {
				if(type === "change") {
					const index = listeners.indexOf(listener);
					if(index !== -1) listeners.splice(index, 1);
				}
			},
			fireChange: function(title) {
				const changes = {};
				changes[title] = { modified: true };
				listeners.slice().forEach(function(listener) { listener(changes); });
			}
		};
	}

	it("creates a temporary currentTiddler containing only the opaque block source", function() {
		const wiki = makeWiki();
		wiki.sourceTiddlers.Source = { fields: { title: "Source", caption: "Copied context", text: "whole document" } };
		const sandbox = new OpaqueSourceSandbox(wiki, function() {}, { sourceTitle: "Source" });
		const title = sandbox.ensure("[ ] Local item");

		expect(title.indexOf("$:/temp/")).toBe(0);
		expect(wiki.texts[title]).toBe("[ ] Local item");
		expect(wiki.lastAddedFields.caption).toBe("Copied context");
		expect(wiki.lastAddedFields.text).toBe("[ ] Local item");
		expect(sandbox.getVariables()).toEqual({
			currentTiddler: title,
			prosemirrorSourceTiddler: "Source"
		});
		expect(wiki.listeners.length).toBe(1);
	});

	it("turns a sandbox widget write into one source-change callback", function() {
		const wiki = makeWiki();
		const received = [];
		const sandbox = new OpaqueSourceSandbox(wiki, function(text) { received.push(text); });
		const title = sandbox.ensure("[ ] Local item");

		wiki.texts[title] = "[x] Local item";
		wiki.fireChange(title);
		wiki.fireChange(title);

		expect(received).toEqual(["[x] Local item"]);
	});

	it("does not echo a ProseMirror-originated source update", function() {
		const wiki = makeWiki();
		const received = [];
		const sandbox = new OpaqueSourceSandbox(wiki, function(text) { received.push(text); });
		const title = sandbox.ensure("old");

		sandbox.ensure("external update");
		wiki.fireChange(title);

		expect(wiki.setCalls.length).toBe(1);
		expect(wiki.setCalls[0].options.suppressTimestamp).toBe(true);
		expect(received).toEqual([]);
	});

	it("removes its listener and temporary tiddler on destroy", function() {
		const wiki = makeWiki();
		const sandbox = new OpaqueSourceSandbox(wiki, function() {});
		const title = sandbox.ensure("temporary");

		sandbox.destroy();

		expect(wiki.listeners.length).toBe(0);
		expect(wiki.deleted).toEqual([title]);
		expect(sandbox.getVariables()).toEqual({});
	});
});
