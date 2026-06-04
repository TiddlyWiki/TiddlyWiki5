/*\
title: test-prosemirror-incremental-sync.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Unit tests for the incremental diff-based sync mechanism.
Tests Fragment.findDiffStart/findDiffEnd and ReplaceStep logic
used by applyExternalText() in engine.js and widget.js.

\*/

"use strict";

describe("ProseMirror incremental sync — diff calculation", () => {

	let buildSchema;
	let schema;

	try {
		require("prosemirror-model");
		buildSchema = require("$:/plugins/tiddlywiki/prosemirror/core/schema.js").buildSchema;
	} catch(e) {
		return;
	}

	beforeEach(() => {
		schema = buildSchema();
	});

	// Helper: create a doc node from JSON
	function makeDoc(json) {
		return schema.nodeFromJSON(json);
	}

	// Helper: create a simple paragraph doc
	function paraDoc(...texts) {
		return makeDoc({
			type: "doc",
			content: texts.map((text) => (text === ""
				? { type: "paragraph" }
				: { type: "paragraph", content: [{ type: "text", text: text }] })
			)
		});
	}

	// Helper: apply diff between two docs using doc.replace()
	function applyDiff(oldDoc, newDoc) {
		const slice = newDoc.slice(0, newDoc.content.size);
		const newContent = oldDoc.replace(0, oldDoc.content.size, slice);
		return newContent;
	}

	// ─── findDiffStart / findDiffEnd ────────────────────────────────

	describe("findDiffStart", () => {

		it("should return null for identical documents", () => {
			const a = paraDoc("Hello");
			const b = paraDoc("Hello");
			expect(a.content.findDiffStart(b.content)).toBeNull();
		});

		it("should return null for identical multi-paragraph docs", () => {
			const a = paraDoc("Hello", "World");
			const b = paraDoc("Hello", "World");
			expect(a.content.findDiffStart(b.content)).toBeNull();
		});

		it("should detect appended paragraph", () => {
			const a = paraDoc("Hello");
			const b = paraDoc("Hello", "World");
			const diffStart = a.content.findDiffStart(b.content);
			// Position after first paragraph (nodeSize = text.length + 2)
			expect(diffStart).toBe(a.content.size);
		});

		it("should detect changed text content", () => {
			const a = paraDoc("Hello World");
			const b = paraDoc("Hello Earth");
			const diffStart = a.content.findDiffStart(b.content);
			// After "Hello " inside the paragraph
			expect(diffStart).toBeGreaterThan(1); // After para open tag
			expect(diffStart).toBeLessThan(a.content.size - 1); // Before para close tag
		});

		it("should detect inserted paragraph in the middle", () => {
			const a = paraDoc("Hello", "World");
			const b = paraDoc("Hello", "!", "World");
			const diffStart = a.content.findDiffStart(b.content);
			// Should be after first paragraph
			expect(diffStart).toBeGreaterThan(0);
			expect(diffStart).toBeLessThan(a.content.size);
		});

		it("should detect removed paragraph", () => {
			const a = paraDoc("A", "B", "C");
			const b = paraDoc("A", "C");
			const diffStart = a.content.findDiffStart(b.content);
			expect(diffStart).toBeGreaterThan(0);
		});
	});

	describe("findDiffEnd", () => {

		it("should return null for identical documents", () => {
			const a = paraDoc("Hello");
			const b = paraDoc("Hello");
			expect(a.content.findDiffEnd(b.content)).toBeNull();
		});

		it("should find common suffix when prepending", () => {
			const a = paraDoc("Hello");
			const b = paraDoc("!", "Hello");
			const diffEnd = a.content.findDiffEnd(b.content);
			expect(diffEnd).toBeDefined();
			expect(diffEnd.a).toBe(0);
		});

		it("should find common suffix for middle insertion", () => {
			const a = paraDoc("Hello", "World");
			const b = paraDoc("Hello", "!", "World");
			const diffEnd = a.content.findDiffEnd(b.content);
			expect(diffEnd).toBeDefined();
			// Common suffix "World" paragraph — position is content-relative
			expect(diffEnd.a).toBeGreaterThan(0);
			expect(diffEnd.a).toBeLessThan(a.content.size);
		});
	});

	// ─── ReplaceStep diff application ──────────────────────────────

	describe("applyDiff (ReplaceStep)", () => {

		it("should handle no-op (identical docs)", () => {
			const oldDoc = paraDoc("Hello World");
			const newDoc = paraDoc("Hello World");
			const result = applyDiff(oldDoc, newDoc);
			expect(result.eq(oldDoc)).toBe(true);
		});

		it("should append a new paragraph at the end", () => {
			const oldDoc = paraDoc("Hello World");
			const newDoc = paraDoc("Hello World", "");
			const result = applyDiff(oldDoc, newDoc);
			expect(result.childCount).toBe(2);
			expect(result.child(0).textContent).toBe("Hello World");
			expect(result.child(1).textContent).toBe("");
		});

		it("should append a paragraph with text", () => {
			const oldDoc = paraDoc("Hello");
			const newDoc = paraDoc("Hello", "World");
			const result = applyDiff(oldDoc, newDoc);
			expect(result.childCount).toBe(2);
			expect(result.child(1).textContent).toBe("World");
		});

		it("should insert a paragraph in the middle", () => {
			const oldDoc = paraDoc("Hello", "World");
			const newDoc = paraDoc("Hello", "!", "World");
			const result = applyDiff(oldDoc, newDoc);
			expect(result.childCount).toBe(3);
			expect(result.child(0).textContent).toBe("Hello");
			expect(result.child(1).textContent).toBe("!");
			expect(result.child(2).textContent).toBe("World");
		});

		it("should remove a paragraph from the middle", () => {
			const oldDoc = paraDoc("A", "B", "C");
			const newDoc = paraDoc("A", "C");
			const result = applyDiff(oldDoc, newDoc);
			expect(result.childCount).toBe(2);
			expect(result.child(0).textContent).toBe("A");
			expect(result.child(1).textContent).toBe("C");
		});

		it("should change text within a paragraph", () => {
			const oldDoc = paraDoc("Hello World");
			const newDoc = paraDoc("Hello Earth");
			const result = applyDiff(oldDoc, newDoc);
			expect(result.childCount).toBe(1);
			expect(result.child(0).textContent).toBe("Hello Earth");
		});

		it("should handle complete replacement", () => {
			const oldDoc = paraDoc("Old content");
			const newDoc = paraDoc("New content");
			const result = applyDiff(oldDoc, newDoc);
			expect(result.childCount).toBe(1);
			expect(result.child(0).textContent).toBe("New content");
		});

		it("should preserve paragraphs that are not changed", () => {
			const oldDoc = paraDoc("A", "B", "C", "D", "E");
			const newDoc = paraDoc("A", "B", "X", "D", "E");
			const result = applyDiff(oldDoc, newDoc);
			expect(result.childCount).toBe(5);
			expect(result.child(0).textContent).toBe("A");
			expect(result.child(1).textContent).toBe("B");
			expect(result.child(2).textContent).toBe("X");
			expect(result.child(3).textContent).toBe("D");
			expect(result.child(4).textContent).toBe("E");
		});

		it("should handle multiple empty paragraphs", () => {
			const oldDoc = paraDoc("Hello", "", "", "World");
			const newDoc = paraDoc("Hello", "", "", "World");
			const result = applyDiff(oldDoc, newDoc);
			expect(result.eq(oldDoc)).toBe(true);
		});

		it("should add empty paragraphs (preserves user-created empty lines)", () => {
			const oldDoc = paraDoc("Hello", "World");
			const newDoc = paraDoc("Hello", "", "", "World");
			const result = applyDiff(oldDoc, newDoc);
			expect(result.childCount).toBe(4);
			expect(result.child(0).textContent).toBe("Hello");
			expect(result.child(1).textContent).toBe("");
			expect(result.child(2).textContent).toBe("");
			expect(result.child(3).textContent).toBe("World");
		});
	});

	// ─── Serialization roundtrip comparison ────────────────────────

	describe("roundtrip echo detection", () => {

		let wikiAstToProseMirrorAst, wikiAstFromProseMirrorAst;

		try {
			wikiAstToProseMirrorAst = require("$:/plugins/tiddlywiki/prosemirror/ast/to-prosemirror.js").to;
			wikiAstFromProseMirrorAst = require("$:/plugins/tiddlywiki/prosemirror/ast/from-prosemirror.js").from;
		} catch(e) {
			return;
		}

		function parseToPMDoc(wikitext) {
			const wikiAst = $tw.wiki.parseText("text/vnd.tiddlywiki", wikitext).tree;
			const pmAst = wikiAstToProseMirrorAst(wikiAst, { sourceText: wikitext });
			return schema.nodeFromJSON(pmAst);
		}

		function serializePMDoc(doc) {
			const content = doc.toJSON();
			const wikiAst = wikiAstFromProseMirrorAst(content);
			return $tw.utils.serializeWikitextParseTree(wikiAst);
		}

		it("should detect that roundtrip text matches lastSavedDocJSON", () => {
			// Simulate: user has "Hello World" + empty paragraph
			const pmDoc = parseToPMDoc("Hello World");
			const lastSavedJSON = pmDoc.toJSON();

			// Serialize (loses empty para) and reparse
			const serialized = serializePMDoc(pmDoc);
			const reparsedAst = $tw.wiki.parseText("text/vnd.tiddlywiki", serialized).tree;
			const reparsedPMAst = wikiAstToProseMirrorAst(reparsedAst, { sourceText: serialized });

			// Compare against lastSavedJSON — should match (echo detection)
			expect(JSON.stringify(reparsedPMAst)).toEqual(JSON.stringify(lastSavedJSON));
		});

		it("should detect genuine external change vs echo", () => {
			// Original: "Hello World"
			const original = parseToPMDoc("Hello World");
			const lastSavedJSON = original.toJSON();

			// External agent changes to "Hello Earth"
			const modified = parseToPMDoc("Hello Earth");
			const modifiedSerialized = serializePMDoc(modified);
			const reparsedAst = $tw.wiki.parseText("text/vnd.tiddlywiki", modifiedSerialized).tree;
			const reparsedPMAst = wikiAstToProseMirrorAst(reparsedAst, { sourceText: modifiedSerialized });

			// Should NOT match — genuine change
			expect(JSON.stringify(reparsedPMAst)).not.toEqual(JSON.stringify(lastSavedJSON));
		});
	});
});
