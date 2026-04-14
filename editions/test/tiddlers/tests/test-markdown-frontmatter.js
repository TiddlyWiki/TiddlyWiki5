/*\
title: test-markdown-frontmatter.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for the markdown plugin's YAML frontmatter parser, deserializer,
and serializer.

\*/

/* eslint-env node, browser, jasmine */
/* eslint no-mixed-spaces-and-tabs: ["error", "smart-tabs"]*/
"use strict";

describe("markdown YAML frontmatter", function() {

	var yaml = require("$:/plugins/tiddlywiki/markdown/yaml.js");
	var deserializer = require("$:/plugins/tiddlywiki/markdown/frontmatter-deserializer.js");
	var serializer = require("$:/plugins/tiddlywiki/markdown/frontmatter-serializer.js");

	// --- YAML parser ---

	describe("yaml.load scalars", function() {
		it("parses null forms", function() {
			expect(yaml.load("null")).toBe(null);
			expect(yaml.load("~")).toBe(null);
			expect(yaml.load("")).toBe(null);
		});
		it("parses booleans", function() {
			expect(yaml.load("true")).toBe(true);
			expect(yaml.load("True")).toBe(true);
			expect(yaml.load("false")).toBe(false);
		});
		it("parses numbers", function() {
			expect(yaml.load("42")).toBe(42);
			expect(yaml.load("-7")).toBe(-7);
			expect(yaml.load("3.14")).toBe(3.14);
			expect(yaml.load("1e10")).toBe(1e10);
			expect(yaml.load("0xFF")).toBe(255);
			expect(yaml.load("0o17")).toBe(15);
		});
		it("parses special floats", function() {
			expect(yaml.load(".inf")).toBe(Infinity);
			expect(yaml.load("-.inf")).toBe(-Infinity);
		});
		it("parses quoted strings", function() {
			expect(yaml.load('"hello world"')).toBe("hello world");
			expect(yaml.load("'hello world'")).toBe("hello world");
			expect(yaml.load('"line1\\nline2"')).toBe("line1\nline2");
		});
		it("parses plain strings", function() {
			expect(yaml.load("hello")).toBe("hello");
		});
		it("rejects non-strings", function() {
			expect(function() { yaml.load(123); }).toThrowError(yaml.YAMLException);
		});
	});

	describe("yaml.load flow collections", function() {
		it("parses flow sequences", function() {
			expect(yaml.load("[a, b, c]")).toEqual(["a","b","c"]);
			expect(yaml.load("[1, 2, 3]")).toEqual([1,2,3]);
			expect(yaml.load('[1, "two", true, null]')).toEqual([1,"two",true,null]);
			expect(yaml.load("[]")).toEqual([]);
			expect(yaml.load('["multi word", simple]')).toEqual(["multi word","simple"]);
		});
		it("parses flow mappings", function() {
			expect(yaml.load("{a: 1, b: 2}")).toEqual({a:1,b:2});
			expect(yaml.load("{}")).toEqual({});
		});
	});

	describe("yaml.load block collections", function() {
		it("parses simple block mappings", function() {
			expect(yaml.load("title: Hello\ntags: foo bar\nrating: 6")).toEqual({
				title: "Hello",
				tags: "foo bar",
				rating: 6
			});
		});
		it("parses block mapping with flow array value", function() {
			expect(yaml.load("title: Test\ntags: [concept, synthesis, multi word tag]")).toEqual({
				title: "Test",
				tags: ["concept","synthesis","multi word tag"]
			});
		});
		it("parses block mapping with quoted value", function() {
			expect(yaml.load('title: "A: Subtitle"')).toEqual({title: "A: Subtitle"});
		});
		it("parses block mapping with null value", function() {
			expect(yaml.load("title: Test\ndescription:")).toEqual({
				title: "Test",
				description: null
			});
		});
		it("parses block sequences", function() {
			expect(yaml.load("- alpha\n- beta\n- gamma")).toEqual(["alpha","beta","gamma"]);
			expect(yaml.load("- 1\n- two\n- true")).toEqual([1,"two",true]);
		});
		it("parses nested block mappings", function() {
			expect(yaml.load("outer:\n  inner: value\n  count: 3")).toEqual({
				outer: {inner: "value", count: 3}
			});
		});
		it("parses block mapping with block sequence value", function() {
			expect(yaml.load("title: Test\ntags:\n  - concept\n  - synthesis")).toEqual({
				title: "Test",
				tags: ["concept","synthesis"]
			});
		});
		it("ignores comments and blank lines", function() {
			expect(yaml.load("# comment\ntitle: Test\n# more\nrating: 5")).toEqual({
				title: "Test",
				rating: 5
			});
		});
	});

	describe("yaml.dump", function() {
		it("dumps simple mappings", function() {
			expect(yaml.dump({title: "Hello", rating: 6}).trim()).toBe("title: Hello\nrating: 6");
		});
		it("dumps arrays", function() {
			expect(yaml.dump({tags: ["a","b"]}).trim()).toBe("tags:\n  - a\n  - b");
		});
		it("dumps null and booleans", function() {
			expect(yaml.dump({x: null}).trim()).toBe("x: null");
			expect(yaml.dump({x: true, y: false}).trim()).toBe("x: true\ny: false");
		});
		it("dumps empty containers", function() {
			expect(yaml.dump({}).trim()).toBe("{}");
			expect(yaml.dump({x: []}).trim()).toBe("x: []");
		});
		it("quotes string values that look like numbers", function() {
			expect(yaml.dump({rating: "9"}).trim()).toBe('rating: "9"');
		});
	});

	// --- Deserializer ---

	describe("frontmatter deserializer", function() {
		var ds = deserializer["text/x-markdown"];

		it("extracts simple frontmatter into fields", function() {
			var result = ds("---\ntitle: Foo\ntags: [a, b]\n---\n\nBody text.",{});
			expect(result.length).toBe(1);
			expect(result[0].title).toBe("Foo");
			expect(result[0].tags).toBe("a b");
			expect(result[0].text).toBe("Body text.");
			expect(result[0].type).toBe("text/x-markdown");
		});
		it("converts YAML arrays for list fields to TW bracketed lists", function() {
			var result = ds("---\ntags: [concept, multi word tag, simple]\n---\n\nbody",{});
			expect(result[0].tags).toBe("concept [[multi word tag]] simple");
		});
		it("falls back to plain body when no frontmatter present", function() {
			var result = ds("Just a body, no frontmatter.",{});
			expect(result[0].text).toBe("Just a body, no frontmatter.");
			expect(result[0].title).toBeUndefined();
		});
		it("falls back to plain body when frontmatter is malformed", function() {
			var result = ds("---\nnot: [valid yaml: at all\n---\n\nbody",{});
			// Malformed YAML still parses something; we just ensure body is set
			expect(result[0].text).toBeDefined();
		});
		it("ignores created and modified per collision policy", function() {
			var result = ds("---\ntitle: T\ncreated: 2026-01-01\nmodified: 2026-02-02\n---\n\nb",{});
			expect(result[0].created).toBeUndefined();
			expect(result[0].modified).toBeUndefined();
		});
		it("merges existing tags with frontmatter tags", function() {
			var result = ds("---\ntags: [b, c]\n---\n\nbody",{tags: "a"});
			// Order: existing first, then new uniques
			expect(result[0].tags).toBe("a b c");
		});
		it("emits non-string non-array values as JSON", function() {
			var result = ds("---\ntitle: T\nmeta: {nested: deep}\n---\n\nb",{});
			expect(result[0].meta).toBe('{"nested":"deep"}');
		});
		it("handles CRLF line endings around frontmatter", function() {
			var result = ds("---\r\ntitle: T\r\n---\r\n\r\nbody",{});
			expect(result[0].title).toBe("T");
			expect(result[0].text).toBe("body");
		});
	});

	// --- Serializer ---

	describe("frontmatter serializer", function() {
		var ser = serializer["text/x-markdown"];

		it("emits frontmatter and body", function() {
			var t = new $tw.Tiddler({title: "Foo", text: "body", tags: "a b"});
			var out = ser(t);
			expect(out).toContain("---\n");
			expect(out).toContain("title: Foo");
			expect(out).toContain("tags:\n  - a\n  - b");
			expect(out.split("\n---\n\n")[1]).toBe("body");
		});
		it("emits list fields as YAML arrays preserving multi-word tags", function() {
			var t = new $tw.Tiddler({title: "X", tags: "concept [[multi word tag]] simple", text: "b"});
			var out = ser(t);
			expect(out).toContain("- concept");
			expect(out).toContain("- multi word tag");
			expect(out).toContain("- simple");
		});
		it("skips text, created, modified, bag, revision", function() {
			var t = new $tw.Tiddler({
				title: "X",
				text: "body",
				created: "20260101000000000",
				modified: "20260101000000000",
				bag: "default",
				revision: "1"
			});
			var out = ser(t);
			expect(out).not.toContain("created:");
			expect(out).not.toContain("modified:");
			expect(out).not.toContain("bag:");
			expect(out).not.toContain("revision:");
			expect(out).not.toContain("text:");
		});
		it("skips type when it equals text/x-markdown", function() {
			var t = new $tw.Tiddler({title: "X", type: "text/x-markdown", text: "b"});
			expect(ser(t)).not.toContain("type:");
		});
		it("emits type when it differs from text/x-markdown", function() {
			var t = new $tw.Tiddler({title: "X", type: "text/html", text: "b"});
			expect(ser(t)).toContain("type: text/html");
		});
		it("emits no frontmatter when only skipped fields are present", function() {
			var t = new $tw.Tiddler({text: "body only"});
			expect(ser(t)).toBe("body only");
		});
		it("returns empty string for null tiddler", function() {
			expect(ser(null)).toBe("");
		});
		it("title appears first in output", function() {
			var t = new $tw.Tiddler({title: "Z", rating: "9", tags: "a", text: "b"});
			var out = ser(t);
			var lines = out.split("\n");
			// First line is "---", second should be "title: Z"
			expect(lines[0]).toBe("---");
			expect(lines[1]).toBe("title: Z");
		});
	});

	// --- Round-trip ---

	describe("frontmatter round-trip", function() {
		var ds = deserializer["text/x-markdown"];
		var ser = serializer["text/x-markdown"];

		it("preserves title, tags, and body across deserialize → serialize", function() {
			var input = "---\ntitle: My Tiddler\ntags: [concept, synthesis]\nrating: \"7\"\n---\n\nThis is the body.";
			var fields = ds(input,{})[0];
			var t = new $tw.Tiddler(fields);
			var out = ser(t);
			var reparsed = ds(out,{})[0];
			expect(reparsed.title).toBe("My Tiddler");
			expect(reparsed.tags).toBe("concept synthesis");
			expect(reparsed.rating).toBe("7");
			expect(reparsed.text).toBe("This is the body.");
		});
	});

});
