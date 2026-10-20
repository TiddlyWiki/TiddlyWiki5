/*\
title: test-prosemirror-source-safety.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Exercise the same parse, schema and serialization boundary as the editor.
\*/

"use strict";

describe("ProseMirror source safety", () => {
	const shared = require("$:/plugins/tiddlywiki/prosemirror/core/editor-shared.js");
	const to = require("$:/plugins/tiddlywiki/prosemirror/ast/to-prosemirror.js").to;
	const schema = require("$:/plugins/tiddlywiki/prosemirror/core/schema.js").buildSchema();
	const type = "text/vnd.tiddlywiki";

	function checkSource(input) {
		const doc = schema.nodeFromJSON(shared.parseWikiTextToDoc($tw.wiki,type,input));
		doc.check();
		expect(shared.serializeDocJSON(doc.toJSON())).toBe(input);
		return doc;
	}

	[
		"; Term\n: Definition",
		"Before <$text text=\"hello\"/> after",
		"Before <<now>> after",
		"((myvar))\n\nKeep me",
		"<div class=<<mymacro param={{Something}}>>>content</div>\n\nKeep me",
		"\\whitespace trim\n\n  Body  ",
		"|caption|c\n|table-class|k\n|!A|!B|\n|one|two|\n|~|three|",
		"! Heading\r\n\r\nBody\r\n"
	].forEach((input) => {
		it("preserves source and creates valid content: " + input.split("\n")[0], () => {
			checkSource(input);
		});
	});

	it("keeps inline macros editable beside their surrounding text", () => {
		const doc = checkSource("Before <<now>> after");
		expect(doc.firstChild.type.name).toBe("paragraph");
		expect(doc.firstChild.child(1).type.name).toBe("opaque_inline");
	});

	it("keeps both image spellings editable without changing their original source", () => {
		const doc = checkSource('[img[Motovun Jack.jpg]]\n\n<$image source="Motovun Jack.jpg" />');
		expect(doc.childCount).toBe(2);
		for(let index = 0; index < doc.childCount; index++) {
			expect(doc.child(index).type.name).toBe("paragraph");
			expect(doc.child(index).firstChild.type.name).toBe("image");
		}
	});

	it("keeps internal and equivalent external link spellings editable", () => {
		const doc = checkSource("Visit [[InternalLinkTarget]] and [[TiddlyWiki|https://tiddlywiki.com]]");
		expect(doc.firstChild.type.name).toBe("paragraph");
		expect(doc.firstChild.child(1).marks[0].type.name).toBe("link");
		expect(doc.firstChild.lastChild.marks[0].attrs.href).toBe("https://tiddlywiki.com");
	});

	it("retains all source when a parser throws", () => {
		const input = "Never discard this source.\n\n<$custom/>\n\n";
		const wiki = { parseText: () => { throw new Error("Extension parser failed"); } };
		const doc = schema.nodeFromJSON(shared.parseWikiTextToDoc(wiki,type,input));
		doc.check();
		expect(doc.firstChild.type.name).toBe("opaque_block");
		expect(shared.serializeDocJSON(doc.toJSON())).toBe(input);
	});

	it("keeps parser-excluded block separators when an opaque widget edits its source", () => {
		const restore = require("$:/plugins/tiddlywiki/prosemirror/ast/source-preservation.js").restoreSourceBoundary;
		const node = { attrs: {
			rawText: "[ ] Local item", twSourceText: "[ ] Local item\n\n",
			twSourceCount: 1, twSourceIndex: 0
		} };
		expect(restore(node,"[x] Local item")).toBe("[x] Local item\n\n");
		node.attrs.twSourceCount = 2;
		expect(restore(node,"[x] Local item")).toBe("[x] Local item");
	});

	it("retains a code block's language when its text is edited", () => {
		const doc = checkSource("```js\noriginal\n```\n");
		expect(doc.firstChild.type.name).toBe("code_block");
		expect(doc.firstChild.attrs.language).toBe("js");
		const json = doc.toJSON();
		json.content[0].content[0].text = "changed";
		expect(shared.serializeDocJSON(json)).toBe("```js\nchanged\n```");
	});

	it("keeps exact source when dissolving an unchanged block", () => {
		const getNodeWikiText = require("$:/plugins/tiddlywiki/prosemirror/blocks/source-utils.js").getNodeWikiText;
		const input = "```js\r\noriginal  \r\n```\r\n\r\n";
		const doc = checkSource(input);
		expect(getNodeWikiText(doc.firstChild)).toBe(input);
	});

	it("retains cell spans and alignment when table text is edited", () => {
		const doc = checkSource("|A | B|\n|~|C|");
		expect(doc.firstChild.type.name).toBe("table");
		const json = doc.toJSON();
		json.content[0].content[0].content[0].content[0].content[0].text = "Changed";
		expect(shared.serializeDocJSON(json)).toBe("|Changed | B|\n|~|C|");
	});

	it("isolates a throwing converter to its source segment", () => {
		const input = "First\n\nSecond";
		const ast = $tw.wiki.parseText(type,input).tree;
		const docJSON = to(ast,{
			sourceText: input, preserveSource: true,
			element: () => { throw new Error("Extension converter failed"); }
		});
		const doc = schema.nodeFromJSON(docJSON);
		doc.check();
		expect(doc.childCount).toBe(2);
		expect(doc.firstChild.type.name).toBe("opaque_block");
		expect(shared.serializeDocJSON(doc.toJSON())).toBe(input);
	});

	it("falls back instead of admitting an invalid inline/block nesting", () => {
		const input = "Keep me";
		const ast = $tw.wiki.parseText(type,input).tree;
		const docJSON = to(ast,{
			sourceText: input, preserveSource: true,
			element: () => [{ type: "paragraph", content: [{ type: "opaque_block", attrs: { rawText: input } }] }]
		});
		const doc = schema.nodeFromJSON(docJSON);
		doc.check();
		expect(doc.firstChild.type.name).toBe("opaque_block");
		expect(shared.serializeDocJSON(doc.toJSON())).toBe(input);
	});

	it("does not serialize Markdown as WikiText", () => {
		const input = "# Heading\n\n**bold**\n";
		const doc = schema.nodeFromJSON(shared.parseWikiTextToDoc($tw.wiki,"text/markdown",input));
		doc.check();
		expect(doc.firstChild.type.name).toBe("opaque_block");
		expect(shared.serializeDocJSON(doc.toJSON())).toBe(input);
	});

	it("preserves the public serializer fixture corpus through the editor boundary", () => {
		const titles = $tw.wiki.filterTiddlers("[tag[$:/tags/wikitext-serialize-test-spec]]");
		expect(titles.length).toBeGreaterThan(0);
		titles.forEach((title) => {
			checkSource($tw.wiki.getTiddlerText(title));
		});
	});
});
