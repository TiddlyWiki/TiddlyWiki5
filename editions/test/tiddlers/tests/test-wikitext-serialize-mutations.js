/*\
title: test-wikitext-serialize-mutations.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Source fidelity must not replay syntax that has been edited in the tree.
\*/

"use strict";

describe("WikiText serialization after parse-tree edits", function() {
	function checkEdit(source,mutate,expected) {
		var tree = $tw.wiki.parseText("text/vnd.tiddlywiki",source).tree;
		mutate(tree);
		expect($tw.utils.serializeWikitextParseTree(tree,{source: source})).toBe(expected);
	}

	it("writes an attribute value even when it already occurs elsewhere in the tag", function() {
		checkEdit('<div a="old" b="new">Body</div>',function(tree) {
			tree[0].children[0].attributes.a.value = "new";
		},'<div a="new" b="new">Body</div>');
	});

	it("writes shortened code rather than matching it as a source substring", function() {
		checkEdit("```js\nkeep this suffix\n```",function(tree) {
			tree[0].attributes.code.value = "keep";
		},"```js\nkeep\n```");
	});

	it("writes a changed code language", function() {
		checkEdit("```js\nconst value = 1;\n```",function(tree) {
			tree[0].attributes.language.value = "css";
		},"```css\nconst value = 1;\n```");
	});

	it("writes reordered macro parameters", function() {
		checkEdit("<<example first second>>\n",function(tree) {
			var attributes = tree[0].orderedAttributes;
			attributes.filter(function(attribute) { return attribute.name === "0"; })[0].value = "second";
			attributes.filter(function(attribute) { return attribute.name === "1"; })[0].value = "first";
		},"<<example second first>>\n");
	});

	it("writes edits to a list row", function() {
		checkEdit("* keep this suffix",function(tree) {
			tree[0].children[0].children[0].text = "keep";
		},"* keep");
	});

	it("retains an intentional deletion of trailing text whitespace", function() {
		checkEdit("Before ",function(tree) {
			tree[0].children[0].text = "Before";
		},"Before");
	});

	it("writes changes inside a style block", function() {
		checkEdit("@@.note\nBefore\n@@",function(tree) {
			tree[0].children[0].children[0].text = "After";
		},"@@.note\nAfter\n@@");
	});

	it("writes a changed transclusion context while retaining its explicit target", function() {
		checkEdit("{{OldTarget}}\n",function(tree) {
			tree[0].attributes.tiddler.value = "NewTarget";
		},"{{NewTarget||OldTarget}}\n");
	});

	it("preserves unchanged neighbouring blocks and their gaps", function() {
		var source = "<<example    'first'>>\n\n\n```js\nkeep this suffix\n```\n\n<<example    'last'>>\n";
		checkEdit(source,function(tree) {
			tree[1].attributes.code.value = "keep";
		},source.replace("keep this suffix","keep"));
	});

	it("leaves the caller's source options and tree unchanged", function() {
		var source = "```js\nbody\n```",
			tree = $tw.wiki.parseText("text/vnd.tiddlywiki",source).tree,
			before = JSON.stringify(tree),
			options = {source: source};
		expect($tw.utils.serializeWikitextParseTree(tree,options)).toBe(source);
		expect(options).toEqual({source: source});
		expect(JSON.stringify(tree)).toBe(before);
	});

	it("verifies a source only once for multiple source-backed nodes", function() {
		var source = "<<example    'first'>>\n\n```js\nbody\n```",
			tree = $tw.wiki.parseText("text/vnd.tiddlywiki",source).tree,
			calls = 0;
		expect($tw.utils.serializeWikitextParseTree(tree,{source: source, wiki: {
			parseText: function(type,text,options) {
				calls++;
				return $tw.wiki.parseText(type,text,options);
			}
		}})).toBe(source);
		expect(calls).toBe(1);
	});

	it("retains source fidelity for a tree with explicit blank-line nodes", function() {
		var source = "<div  title='x'>\n\nFirst\n\n\nSecond\n</div>",
			tree = $tw.wiki.parseText("text/vnd.tiddlywiki",source,{preserveBlankLines: true}).tree;
		expect($tw.utils.serializeWikitextParseTree(tree,{source: source})).toBe(source);
	});

	it("retains source fidelity when parsing inline is explicitly requested", function() {
		var source = "<span  title='x'>value</span> <<example    'first'>>",
			tree = $tw.wiki.parseText("text/vnd.tiddlywiki",source,{parseAsInline: true}).tree;
		expect($tw.utils.serializeWikitextParseTree(tree,{source: source, parseAsInline: true})).toBe(source);
	});

	it("recognises an inline root without requiring a new caller option", function() {
		var source = "<<example    'first'>>",
			tree = $tw.wiki.parseText("text/vnd.tiddlywiki",source,{parseAsInline: true}).tree;
		expect($tw.utils.serializeWikitextParseTree(tree,{source: source})).toBe(source);
	});

	it("keeps block comments from changing the inferred parsing mode", function() {
		var source = "<!-- description -->\n<<example    'first'>>\n",
			tree = $tw.wiki.parseText("text/vnd.tiddlywiki",source).tree;
		expect($tw.utils.serializeWikitextParseTree(tree,{source: source})).toBe(source);
	});

	it("uses the edited tree when the source parser fails", function() {
		var source = "```js\nold body\n```",
			tree = $tw.wiki.parseText("text/vnd.tiddlywiki",source).tree;
		tree[0].attributes.code.value = "new body";
		expect($tw.utils.serializeWikitextParseTree(tree,{source: source, wiki: {
			parseText: function() { throw new Error("Extension parser failed"); }
		}})).toBe("```js\nnew body\n```");
	});

	it("keeps the tree-only editor path independent of source parsing", function() {
		var tree = [$tw.utils.wikitextParseTree.codeBlock("body","js")];
		expect($tw.utils.serializeWikitextParseTree(tree,{wiki: {
			parseText: function() { throw new Error("Source parser must not run"); }
		}})).toBe("```js\nbody\n```");
	});
});
