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

	it("names a language carrying a slash or a dot", function() {
		var tree = parse("```text/vnd.tiddlywiki\ncontent\n```");
		expect(tree.length).toBe(1);
		expect(tree[0].attributes.language.value).toBe("text/vnd.tiddlywiki");
		expect(tree[0].attributes.code.value).toBe("content");
	});

	it("takes the first word of the info string as the language", function() {
		var tree = parse("```  js  extra words\ncontent\n```");
		expect(tree[0].attributes.language.value).toBe("js");
	});

	it("holds a shorter fence inside a longer one", function() {
		var tree = parse("````\n```js\nvar a = 1;\n```\n````");
		expect(tree.length).toBe(1);
		expect(tree[0].attributes.code.value).toBe("```js\nvar a = 1;\n```");
	});

	it("refuses a closing fence shorter than the opening one", function() {
		var tree = parse("````\ncontent\n```\nstill inside\n````");
		expect(tree.length).toBe(1);
		expect(tree[0].attributes.code.value).toBe("content\n```\nstill inside");
	});

	it("closes on a fence carrying up to three spaces of indentation", function() {
		var tree = parse("```js\nvar a = 1;\n   ```\n");
		expect(tree.length).toBe(1);
		expect(tree[0].attributes.code.value).toBe("var a = 1;");
	});

	it("closes on a fence followed by trailing whitespace", function() {
		var tree = parse("```js\nvar a = 1;\n``` \n");
		expect(tree[0].attributes.code.value).toBe("var a = 1;");
	});

	it("records a language start and end that address the language itself", function() {
		var source = "```  js\ncontent\n```",
			node = parse(source)[0],
			language = node.attributes.language;
		expect(source.substring(language.start,language.end)).toBe("js");
	});


	it("closes on a fence longer than the one that opened it", function() {
		var tree = parse("```js\nvar a = 1;\n`````\n");
		expect(tree.length).toBe(1);
		expect(tree[0].attributes.code.value).toBe("var a = 1;");
	});

	it("nests three fence lengths", function() {
		var tree = parse("`````\n````\n```js\nvar a = 1;\n```\n````\n`````");
		expect(tree.length).toBe(1);
		expect(tree[0].attributes.code.value).toBe("````\n```js\nvar a = 1;\n```\n````");
	});

	it("keeps a shorter run of backticks as content", function() {
		var tree = parse("````\nsome ``` here\n````");
		expect(tree[0].attributes.code.value).toBe("some ``` here");
	});

	it("takes an empty language from an info string of whitespace alone", function() {
		var tree = parse("```   \ncontent\n```");
		expect(tree.length).toBe(1);
		expect(tree[0].attributes.language.value).toBe("");
	});

	it("refuses to open on an info string carrying a backtick", function() {
		var tree = parse("```a`b\ncontent\n```");
		expect(tree[0].type).not.toBe("codeblock");
	});

	it("refuses to close on a fence indented beyond three spaces", function() {
		var wiki = new $tw.Wiki(),
			result = wiki.parseText("text/vnd.tiddlywiki","```js\nvar a = 1;\n    ```\ntail\n");
		expect(result.tree[0].type).toBe("codeblock");
		expect(result.tree[0].attributes.code.value).toContain("tail");
		expect(result.diagnostics[0].code).toBe("unterminated-codeblock");
	});

	it("refuses to close on a fence carrying trailing text", function() {
		var wiki = new $tw.Wiki(),
			result = wiki.parseText("text/vnd.tiddlywiki","```js\nvar a = 1;\n``` and more\n");
		expect(result.tree[0].attributes.code.value).toContain("``` and more");
		expect(result.diagnostics[0].code).toBe("unterminated-codeblock");
	});

	it("reports a block that never closes and keeps its content", function() {
		var wiki = new $tw.Wiki(),
			result = wiki.parseText("text/vnd.tiddlywiki","```js\nvar a = 1;\n\n! A heading\n");
		expect(result.tree[0].type).toBe("codeblock");
		expect(result.tree[0].attributes.code.value).toContain("! A heading");
		expect(result.diagnostics.length).toBe(1);
		expect(result.diagnostics[0].code).toBe("unterminated-codeblock");
		expect(result.diagnostics[0].severity).toBe("warning");
	});

	it("closes an indented block on an equally indented fence", function() {
		var wiki = new $tw.Wiki(),
			result = wiki.parseText("text/vnd.tiddlywiki","   ```js\n   var a = 1;\n   ```\n");
		expect(result.tree[0].type).toBe("codeblock");
		expect(result.diagnostics.length).toBe(0);
	});

	it("closes a block whose fence ends the source without a newline", function() {
		var tree = parse("```js\nvar a = 1;\n```");
		expect(tree.length).toBe(1);
		expect(tree[0].attributes.code.value).toBe("var a = 1;");
	});

});
