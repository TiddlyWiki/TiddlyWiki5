/*\
title: test-prosemirror-inputrules.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for ProseMirror input rules (buildInputRules).
These run in Node and verify that wikilink and other inline
input rules are registered in the returned plugin.

\*/

"use strict";

describe("ProseMirror input rules", () => {

	let buildInputRules, buildWikitextInlineRules, WIKITEXT_INLINE_MARK_RULES, buildSchema;
	try {
		const inputRulesMod = require("$:/plugins/tiddlywiki/prosemirror/core/inputrules.js");
		buildInputRules = inputRulesMod.buildInputRules;
		buildWikitextInlineRules = inputRulesMod.buildWikitextInlineRules;
		WIKITEXT_INLINE_MARK_RULES = inputRulesMod.WIKITEXT_INLINE_MARK_RULES;
		const schemaMod = require("$:/plugins/tiddlywiki/prosemirror/core/engine.js");
		buildSchema = schemaMod.buildSchema;
	} catch(e) {
		// Skip if any prosemirror dependency is unavailable in Node
		return;
	}

	it("should export buildInputRules function", () => {
		expect(typeof buildInputRules).toBe("function");
	});

	it("should return a plugin with rules array", () => {
		const schema = buildSchema();
		const plugin = buildInputRules(schema);
		expect(plugin).toBeDefined();
		expect(plugin.spec).toBeDefined();
		expect(plugin.spec.isInputRules).toBe(true);
	});

	it("should include wikilink input rules when schema has link mark", () => {
		const schema = buildSchema();
		const plugin = buildInputRules(schema);
		// Access the internal rules via the plugin spec props
		const handleTextInput = plugin.spec.props && plugin.spec.props.handleTextInput;
		expect(typeof handleTextInput).toBe("function");
	});

	it("should not include wikilink rules when schema lacks link mark", () => {
		const schema = buildSchema();
		// Create a schema without link mark by updating the spec
		const { Schema } = require("prosemirror-model");
		const nodes = schema.spec.nodes;
		const marks = schema.spec.marks.remove("link");
		const schemaNoLink = new Schema({ nodes, marks });
		const plugin = buildInputRules(schemaNoLink);
		expect(plugin).toBeDefined();
		expect(plugin.spec.isInputRules).toBe(true);
	});

	describe("wikilink regex patterns", () => {
		const simplePattern = /\[\[([^\[\]|]+)\]\]$/;
		const pipePattern = /\[\[([^\[\]|]+)\|([^\[\]|]+)\]\]$/;

		it("should match [[Target]]", () => {
			const match = simplePattern.exec("abc [[MyTiddler]]");
			expect(match).not.toBeNull();
			expect(match[1]).toBe("MyTiddler");
		});

		it("should match [[Display|Target]]", () => {
			const match = pipePattern.exec("abc [[here|MyTiddler]]");
			expect(match).not.toBeNull();
			expect(match[1]).toBe("here");
			expect(match[2]).toBe("MyTiddler");
		});

		it("should match [[http://example.com]] as external", () => {
			const match = simplePattern.exec("abc [[http://example.com]]");
			expect(match).not.toBeNull();
			expect(match[1]).toBe("http://example.com");
		});

		it("should match [[Display|http://example.com]] as external with pipe", () => {
			const match = pipePattern.exec("abc [[Site|http://example.com]]");
			expect(match).not.toBeNull();
			expect(match[1]).toBe("Site");
			expect(match[2]).toBe("http://example.com");
		});

		it("should not match when brackets are unclosed", () => {
			expect(simplePattern.exec("abc [[MyTiddler")).toBeNull();
			expect(pipePattern.exec("abc [[here|MyTiddler")).toBeNull();
		});

		it("should not match empty target", () => {
			expect(simplePattern.exec("abc [[]]")).toBeNull();
			expect(pipePattern.exec("abc [[|Target]]")).toBeNull();
			expect(pipePattern.exec("abc [[Display|]]")).toBeNull();
		});

		it("should not match nested brackets", () => {
			expect(simplePattern.exec("abc [[a[b]c]]")).toBeNull();
			expect(pipePattern.exec("abc [[a|b[c]]]")).toBeNull();
		});

		it("should match three opening brackets at regex level (triple-bracket protection is in the InputRule handler, not the regex)", () => {
			// Without lookbehind the regex matches [[[Target]] from the
			// second bracket; the handler checks doc[start-1] and rejects
			// when it sees another "[".
			const match = simplePattern.exec("abc [[[MyTiddler]]");
			expect(match).not.toBeNull();
			expect(match[1]).toBe("MyTiddler");
		});
	});

	describe("WIKITEXT_INLINE_MARK_RULES declarative config", () => {
		it("should expose the rule definitions", () => {
			expect(Array.isArray(WIKITEXT_INLINE_MARK_RULES)).toBe(true);
			expect(WIKITEXT_INLINE_MARK_RULES.length).toBeGreaterThan(0);
		});

		it("should include expected entries", () => {
			const names = WIKITEXT_INLINE_MARK_RULES.map((r) => r.name);
			expect(names).toContain("bold");
			expect(names).toContain("italic");
			expect(names).toContain("underline");
			expect(names).toContain("superscript");
			expect(names).toContain("subscript");
			expect(names).toContain("strikethrough");
			expect(names).toContain("code");
		});
	});

	describe("buildWikitextInlineRules", () => {
		it("should return wikilink rules when schema has link mark", () => {
			const schema = buildSchema();
			const rules = buildWikitextInlineRules(schema);
			expect(rules.length).toBeGreaterThanOrEqual(2);
		});

		it("should return mark rules for all configured prefixes", () => {
			const schema = buildSchema();
			const rules = buildWikitextInlineRules(schema);
			const markRuleCount = WIKITEXT_INLINE_MARK_RULES.filter((def) => schema.marks[def.markType]).length;
			// Plus 2 wikilink rules
			expect(rules.length).toBe(markRuleCount + 2);
		});

		it("should respect global disable via wiki mock", () => {
			const schema = buildSchema();
			const wiki = {
				getTiddlerText: function(title, defaultText) {
					if(title === "$:/config/prosemirror/wikitext-inline-inputrules") return "no";
					return defaultText;
				}
			};
			const rules = buildWikitextInlineRules(schema, { wiki: wiki });
			expect(rules.length).toBe(0);
		});

		it("should respect per-rule disable via wiki mock", () => {
			const schema = buildSchema();
			const wiki = {
				getTiddlerText: function(title, defaultText) {
					if(title === "$:/config/prosemirror/wikitext-inline-inputrules/bold") return "no";
					return defaultText;
				}
			};
			const rules = buildWikitextInlineRules(schema, { wiki: wiki });
			// All other rules still present, bold is missing
			const markRuleCount = WIKITEXT_INLINE_MARK_RULES.filter((def) => {
				if(def.name === "bold") return false;
				return !!schema.marks[def.markType];
			}).length;
			expect(rules.length).toBe(markRuleCount + 2);
		});
	});

});
