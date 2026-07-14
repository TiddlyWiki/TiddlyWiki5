/*\
title: test-markdown-frontmatter.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests markdown frontmatter deserializing and serializing.

\*/

/* eslint-env node, browser, jasmine */
"use strict";

describe("markdown frontmatter tests", function() {
	var markdownDeserializer = require("$:/plugins/tiddlywiki/markdown/serializer/deserializer.js"),
		markdownSerializer = require("$:/plugins/tiddlywiki/markdown/serializer/serializer.js");

	it("should deserialize YAML-style frontmatter from markdown", function() {
		var source = [
			"---",
			"title: Frontmatter Title",
			"tags:",
			"  - alpha",
			"  - beta gamma",
			"aliases:",
			"  - Alias One",
			"description: \"value: with colon\"",
			"---",
			"",
			"Body line 1",
			"---",
			"Body line 3"
		].join("\n");
		var tiddlers = markdownDeserializer["text/x-markdown"](source,Object.create(null)),
			tiddler = tiddlers[0];
		expect(tiddler.title).toBe("Frontmatter Title");
		expect(tiddler.type).toBe("text/x-markdown");
		expect(tiddler.tags).toBe("alpha [[beta gamma]]");
		expect(tiddler.aliases).toBe("[[Alias One]]");
		expect(tiddler.description).toBe("value: with colon");
		expect(tiddler.text).toBe("Body line 1\n---\nBody line 3");
	});

	it("should serialize markdown tiddler fields into frontmatter", function() {
		var serializer = markdownSerializer["text/x-markdown"],
			tiddler = new $tw.Tiddler({
				title: "Serializer Title",
				type: "text/x-markdown",
				tags: "alpha [[beta gamma]]",
				aliases: "[[Alias One]]",
				text: "Body"
			});
		expect(serializer).toBeDefined();
		var output = serializer(tiddler);
		expect(output).toContain("---\n");
		expect(output).toContain("title: Serializer Title");
		expect(output).toContain("tags:\n  - alpha\n  - beta gamma");
		expect(output).toContain("aliases:\n  - Alias One");
		expect(output).toContain("\n---\n\nBody");
	});
});
