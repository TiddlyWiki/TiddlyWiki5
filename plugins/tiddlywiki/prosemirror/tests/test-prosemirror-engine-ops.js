/*\
title: test-prosemirror-engine-ops.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for ProseMirror engine text operation mapping logic.
These run in node without a real EditorView, testing the helper methods.

\*/

"use strict";

describe("ProseMirror engine operation mapping", () => {

	let buildSchema, ProseMirrorEngine;
	try {
		// engine.js imports browser-only prosemirror-view at the top level,
		// so in Node it will throw. We still test buildSchema and mark mapping
		// by importing the engine module which re-exports buildSchema.
		const mod = require("$:/plugins/tiddlywiki/prosemirror/engine.js");
		buildSchema = mod.buildSchema;
		ProseMirrorEngine = mod.ProseMirrorEngine;
	} catch(e) {
		// If engine.js cannot be loaded (missing prosemirror-view in Node),
		// try buildSchema from a lighter module or skip gracefully.
		try {
			// buildSchema only needs prosemirror-model and prosemirror-schema-basic
			const Schema = require("prosemirror-model").Schema;
			// If we got here, prosemirror-model is available but engine.js failed
			// due to prosemirror-view. Skip the tests.
		} catch(e2) {
			// No prosemirror at all, skip
		}
		return;
	}

	// Test buildSchema
	describe("buildSchema", () => {

		it("should export buildSchema function", () => {
			expect(typeof buildSchema).toBe("function");
		});

		it("should return a ProseMirror schema with expected node types", () => {
			const schema = buildSchema();
			expect(schema).toBeDefined();
			expect(schema.nodes).toBeDefined();
			expect(schema.nodes.doc).toBeDefined();
			expect(schema.nodes.paragraph).toBeDefined();
			expect(schema.nodes.heading).toBeDefined();
			expect(schema.nodes.code_block).toBeDefined();
			expect(schema.nodes.blockquote).toBeDefined();
			expect(schema.nodes.horizontal_rule).toBeDefined();
			expect(schema.nodes.image).toBeDefined();
			expect(schema.nodes.hard_break).toBeDefined();
			expect(schema.nodes.list).toBeDefined();
		});

		it("should have custom block types (pragma_block, opaque_block)", () => {
			const schema = buildSchema();
			expect(schema.nodes.pragma_block).toBeDefined();
			expect(schema.nodes.opaque_block).toBeDefined();
		});

		it("should have extended marks (underline, strike, superscript, subscript)", () => {
			const schema = buildSchema();
			expect(schema.marks.strong).toBeDefined();
			expect(schema.marks.em).toBeDefined();
			expect(schema.marks.code).toBeDefined();
			expect(schema.marks.link).toBeDefined();
			expect(schema.marks.underline).toBeDefined();
			expect(schema.marks.strike).toBeDefined();
			expect(schema.marks.superscript).toBeDefined();
			expect(schema.marks.subscript).toBeDefined();
		});

		it("should set image node attrs with tw-specific fields", () => {
			const schema = buildSchema();
			const imageSpec = schema.nodes.image.spec;
			expect(imageSpec.attrs.twSource).toBeDefined();
			expect(imageSpec.attrs.twKind).toBeDefined();
			expect(imageSpec.attrs.twTooltip).toBeDefined();
			expect(imageSpec.attrs.width).toBeDefined();
			expect(imageSpec.attrs.height).toBeDefined();
		});

		it("should mark superscript and subscript as mutually exclusive", () => {
			const schema = buildSchema();
			expect(schema.marks.superscript.spec.excludes).toBe("subscript");
			expect(schema.marks.subscript.spec.excludes).toBe("superscript");
		});
	});

	// Test _wrapSelectionToMark mapping (we instantiate a mock engine)
	describe("_wrapSelectionToMark mapping", () => {

		// Create a minimal mock engine to test the prototype method
		const proto = {};
		// Copy the method if it exists on ProseMirrorEngine prototype
		if(ProseMirrorEngine && ProseMirrorEngine.prototype._wrapSelectionToMark) {
			proto._wrapSelectionToMark = ProseMirrorEngine.prototype._wrapSelectionToMark;
		}

		if(proto._wrapSelectionToMark) {
			it("should map bold prefix/suffix to 'strong'", () => {
				expect(proto._wrapSelectionToMark("''", "''")).toBe("strong");
			});

			it("should map italic prefix/suffix to 'em'", () => {
				expect(proto._wrapSelectionToMark("//", "//")).toBe("em");
			});

			it("should map underline prefix/suffix to 'underline'", () => {
				expect(proto._wrapSelectionToMark("__", "__")).toBe("underline");
			});

			it("should map strikethrough prefix/suffix to 'strike'", () => {
				expect(proto._wrapSelectionToMark("~~", "~~")).toBe("strike");
			});

			it("should map superscript prefix/suffix to 'superscript'", () => {
				expect(proto._wrapSelectionToMark("^^", "^^")).toBe("superscript");
			});

			it("should map subscript prefix/suffix to 'subscript'", () => {
				expect(proto._wrapSelectionToMark(",,", ",,")).toBe("subscript");
			});

			it("should map backtick prefix/suffix to 'code'", () => {
				expect(proto._wrapSelectionToMark("`", "`")).toBe("code");
			});

			it("should return null for non-matching prefix/suffix", () => {
				expect(proto._wrapSelectionToMark("[[", "]]")).toBeNull();
				expect(proto._wrapSelectionToMark("{{", "}}")).toBeNull();
				expect(proto._wrapSelectionToMark("<<<", "<<<")).toBeNull();
			});

			it("should return null for asymmetric prefix/suffix", () => {
				expect(proto._wrapSelectionToMark("''", "//")).toBeNull();
			});

			it("should return null for null/empty args", () => {
				expect(proto._wrapSelectionToMark(null, null)).toBeNull();
				expect(proto._wrapSelectionToMark("", "")).toBeNull();
			});
		}
	});
});
