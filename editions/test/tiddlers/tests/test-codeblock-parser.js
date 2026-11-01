/*\
title: test-codeblock-parser.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the codeblock wikitext rule (#9047): an empty code block must parse
cleanly, and a closing fence only counts when it stands alone on its line.

\*/
"use strict";

describe("codeblock parser tests (#9047)", function() {

	var wiki = new $tw.Wiki();

	function parse(text) {
		return wiki.parseText("text/vnd.tiddlywiki",text).tree;
	}

	it("parses an empty code block with a language", function() {
		// Browser console: $tw.wiki.parseText("text/vnd.tiddlywiki","```bash\n```").tree
		// Expected: one codeblock node, code "", language "bash".
		var tree = parse("```bash\n```");
		expect(tree.length).toBe(1);
		expect(tree[0].type).toBe("codeblock");
		expect(tree[0].attributes.code.value).toBe("");
		expect(tree[0].attributes.language.value).toBe("bash");
	});

	it("handles CRLF line endings around both fences", function() {
		// Browser console: $tw.wiki.parseText("text/vnd.tiddlywiki","```bash\r\nfoo\r\n```").tree
		// Expected: one codeblock node with code "foo"; neither the CRLF after the
		// opening fence nor the one before the closing fence is part of the code.
		var tree = parse("```bash\r\nfoo\r\n```");
		expect(tree.length).toBe(1);
		expect(tree[0].type).toBe("codeblock");
		expect(tree[0].attributes.code.value).toBe("foo");
	});

	it("keeps the content of a block and drops the delimiting newlines", function() {
		// Browser console: $tw.wiki.parseText("text/vnd.tiddlywiki","```\nfoo\n```").tree
		// Expected: one codeblock node with code "foo"; the newlines around the
		// delimiter lines are not part of the code.
		var tree = parse("```\nfoo\n```");
		expect(tree.length).toBe(1);
		expect(tree[0].type).toBe("codeblock");
		expect(tree[0].attributes.code.value).toBe("foo");
	});

	it("only closes the block when the fence stands alone on its line", function() {
		// A content line ending in ``` is code, not a closing fence, e.g. nested
		// markdown fences or template literals quoted inside a code block.
		// Browser console: $tw.wiki.parseText("text/vnd.tiddlywiki","```\nabc```\ndef\n```").tree
		// Expected: one codeblock containing "abc```\ndef"; nothing leaks out as wikitext.
		var tree = parse("```\nabc```\ndef\n```");
		expect(tree.length).toBe(1);
		expect(tree[0].type).toBe("codeblock");
		expect(tree[0].attributes.code.value).toBe("abc```\ndef");
	});

	it("swallows the rest of the tiddler when no closing fence exists", function() {
		// Browser console: $tw.wiki.parseText("text/vnd.tiddlywiki","```bash\nfoo").tree
		// Expected: one codeblock node with code "foo", extending to the end of the text.
		var tree = parse("```bash\nfoo");
		expect(tree.length).toBe(1);
		expect(tree[0].type).toBe("codeblock");
		expect(tree[0].attributes.code.value).toBe("foo");
	});
});
