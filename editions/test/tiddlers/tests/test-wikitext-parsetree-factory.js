/*\
title: test-wikitext-parsetree-factory.js
type: application/javascript
tags: [[$:/tags/test-spec]]

$tw.utils.wikitextParseTree: the node factory an editor builds parse trees
with, and the classification helpers it reads them with. Every factory node
must serialize without a source, reparse to the same kinds and serialize
again to the same text.

Reproduce a case in the browser F12 console (test edition, or any wiki with
the wikitext-serialize and hard-line-breaks plugins):

	var f = $tw.utils.wikitextParseTree;
	var tree = [f.heading(1,[f.text("Title")]), f.paragraph([f.text("text")])];
	var out = $tw.utils.serializeWikitextParseTree(tree); // "! Title\n\ntext"
	$tw.wiki.parseText("text/vnd.tiddlywiki",out).tree.map(f.kindOf); // ["heading","paragraph"]

\*/

"use strict";

describe("wikitextParseTree factory and classification", function() {

	var f = $tw.utils.wikitextParseTree;

	function serialize(tree) {
		return $tw.utils.serializeWikitextParseTree(tree);
	}

	function parse(text) {
		return $tw.wiki.parseText("text/vnd.tiddlywiki",text,{preserveBlankLines: true}).tree;
	}

	// The kind of every node, nested as [kind, [child kinds]] where children exist
	function kinds(nodes) {
		return nodes.map(function(node) {
			var kind = f.kindOf(node);
			return node.children && node.children.length ? [kind, kinds(node.children)] : kind;
		});
	}

	// Serialize, reparse, compare the kinds, serialize again: the second text must equal the first
	function roundTrip(tree,expectedText) {
		var text = serialize(tree);
		expect(text).toBe(expectedText);
		var reparsed = parse(text);
		expect(kinds(reparsed)).toEqual(kinds(tree));
		expect(serialize(reparsed)).toBe(text);
		return reparsed;
	}

	it("should build the block constructs the walker separates by rule name", function() {
		roundTrip([
			f.heading(2,[f.text("Title")],{classes: ["a","b"]}),
			f.paragraph([f.text("text")]),
			f.horizontalRule(),
			f.codeBlock("var x = 1;","js")
		],"!!.a.b Title\n\ntext\n\n---\n\n```js\nvar x = 1;\n```");
	});

	it("should write a blank line node as an empty line", function() {
		roundTrip([f.paragraph([f.text("A")]), f.blankLine(), f.paragraph([f.text("B")])],"A\n\n\nB");
	});

	it("should build lists with nested lists and item classes", function() {
		roundTrip([
			f.list("ul",[
				f.listItem([f.text("one")],{classes: ["first"]}),
				f.listItem([f.text("two"), f.list("ol",[f.listItem([f.text("sub")])])])
			])
		],"*.first one\n* two\n*# sub");
		roundTrip([
			f.definitionList([f.definitionTerm([f.text("term")]), f.definitionDescription([f.text("meaning")])])
		],"; term\n: meaning");
	});

	it("should build a quote block with classes and a citation", function() {
		roundTrip([
			f.quoteBlock([f.paragraph([f.text("quoted")])],{classes: ["x"], cite: [f.text("who")]})
		],"<<<.x\nquoted\n<<< who");
	});

	it("should build a table with caption, class, header and cell options", function() {
		roundTrip([
			f.table([
				f.tableRow([f.tableCell([f.text("h")],{header: true}), f.tableCell([f.text("r")],{align: "right"})]),
				f.tableRow([f.tableCell([f.text("wide")],{colspan: 2})])
			],{caption: [f.text("cap")], classes: ["c"]})
		],"|c|k\n|cap|c\n|!h| r|\n|wide|<|");
	});

	it("should build a hard break", function() {
		if(!$tw.modules.titles["$:/plugins/tiddlywiki/hard-line-breaks/ssnl.js"]) {
			pending("needs the hard-line-breaks plugin");
		}
		roundTrip([f.paragraph([f.text("a"), f.hardBreak(), f.text("b")])],"a  \\\nb");
	});

	it("should build an html break and a hard line break region", function() {
		roundTrip([f.paragraph([f.text("a"), f.htmlBreak(), f.text("b")])],"a<br>b");
		roundTrip([f.paragraph([f.hardLineBreaksRegion([[f.text("line one")],[f.text("line two")]])])],'"""\nline one\nline two\n"""');
	});

	it("should build every emphasis kind", function() {
		roundTrip([f.paragraph([
			f.emphasis("bold",[f.text("b")]), f.text(" "),
			f.emphasis("italic",[f.text("i")]), f.text(" "),
			f.emphasis("underscore",[f.text("u")]), f.text(" "),
			f.emphasis("strikethrough",[f.text("s")]), f.text(" "),
			f.emphasis("superscript",[f.text("p")]), f.text(" "),
			f.emphasis("subscript",[f.text("q")]), f.text(" "),
			f.emphasis("code",[f.text("c")])
		])],"''b'' //i// __u__ ~~s~~ ^^p^^ ,,q,, `c`");
		expect(function() { f.emphasis("shout",[]); }).toThrow();
	});

	it("should build links and images", function() {
		roundTrip([f.paragraph([
			f.link("Target",[f.text("caption")]), f.text(" "),
			f.link("Plain"), f.text(" "),
			f.externalLink("https://x.y/",[f.text("site")]), f.text(" "),
			f.externalLink("https://x.y/")
		])],"[[caption|Target]] [[Plain]] [ext[site|https://x.y/]] [ext[https://x.y/]]");
		roundTrip([f.paragraph([f.image("pic.png",{tooltip: "tip", width: "10"})])],'[img width="10" [tip|pic.png]]');
	});

	it("should write a link around formatted text in the widget or html form", function() {
		// The bracket forms hold plain text only
		roundTrip([f.paragraph([f.link("Target",[f.emphasis("bold",[f.text("b")])])])],"<$link to=\"Target\">''b''</$link>");
		roundTrip([f.paragraph([f.externalLink("https://x.y/",[f.emphasis("bold",[f.text("b")])])])],"<a class=\"tc-tiddlylink-external\" href=\"https://x.y/\" target=\"_blank\" rel=\"noopener noreferrer\">''b''</a>");
	});

	it("should build macro calls with positional and named parameters", function() {
		// The walker ends a trailing block macro call with its line end, so it stays a block on reparse
		roundTrip([f.macroCall("now",["YYYY"],{block: true})],"<<now YYYY>>\n");
		roundTrip([f.paragraph([f.text("at "), f.macroCall("now",[{value: "YYYY", quoted: true}, {name: "tz", value: "a b"}])])],'at <<now "YYYY" tz:"a b">>');
		// A numeric name is positional, as the parser names them
		roundTrip([f.paragraph([f.text("at "), f.macroCall("m",[{name: "0", value: "x"}, {name: "k", value: "v", assignmentOperator: ":"}])])],"at <<m x k:v>>");
	});

	it("should build widgets at block and inline position", function() {
		roundTrip([
			f.widget("$list",{filter: "[tag[x]]"},[f.paragraph([f.text("body")])],{block: true, blockContent: true}),
			f.paragraph([f.text("see "), f.widget("$image",{source: "x.png"},null,{selfClosing: true})])
		],'<$list filter="[tag[x]]">\n\nbody\n</$list>\n\nsee <$image source="x.png"/>');
		// Without the blank line after the open tag an element is inline content, which the parser wraps in a paragraph
		var div = f.widget("div",{"class": "note"},[f.text("inline body")],{block: true});
		expect(serialize([div])).toBe('<div class="note">inline body</div>');
		expect(kinds(parse(serialize([div])))).toEqual([["paragraph",[["element",["text"]]]]]);
	});

	it("should write opaque text verbatim and rebuild pragma nodes", function() {
		var opaque = f.opaque("<$foo bar='1'/>\ntext",{block: true});
		expect(f.kindOf(opaque)).toBe("opaque");
		expect(serialize([opaque, f.paragraph([f.text("after")])])).toBe("<$foo bar='1'/>\ntext\n\nafter");
		var pragmas = f.pragma("\\define m() x");
		expect(kinds(pragmas)).toEqual(["pragma"]);
		expect(pragmas[0].start).toBeUndefined();
		// A pragma writes the blank line that separates it from the body itself
		expect(serialize(pragmas)).toBe("\\define m() x\n\n");
	});

	it("should classify every construct of a parsed text", function() {
		var text = "! h\n\ntext\n\n* a\n\n---\n\n|t|\n\n```\ncode\n```\n\n<<<\nq\n<<<\n\n<$list/>\n\n{{X}}\n\n<<now>>\n\n<!-- c -->\n\n<%if [[x]]%>\n\ny\n<%endif%>";
		expect(parse(text).map(f.kindOf)).toEqual(["heading","paragraph","list","horizontalRule","table","codeBlock","quoteBlock","widget","transclusion","macroCall","comment","conditional"]);
		expect(parse("\\rules except bold\n''x''")[0]).toEqual(jasmine.objectContaining({rule: "rules"}));
		expect(f.kindOf(parse("\\rules except bold\n''x''")[0])).toBe("pragma");
		expect(parse("a ''b'' //c// [[d]] [ext[https://e/]] [img[f]] `g` <br> {{h}} <<i>>")[0].children.map(f.kindOf))
			.toEqual(["text","emphasis","text","emphasis","text","link","text","externalLink","text","image","text","emphasis","text","hardBreak","text","transclusion","text","macroCall"]);
		expect(f.emphasisKind(parse("''b''")[0].children[0])).toBe("bold");
		// A <$text> widget has the node type "text" too
		expect(f.kindOf(parse('a <$text text="b"/>')[0].children[1])).toBe("widget");
		expect(f.kindOf(null)).toBe("unknown");
	});

	it("should tell an element closed by the end of the text from one with a close tag", function() {
		expect(f.hasImplicitCloseTag(parse('<$let a="x">\n\ntext')[0])).toBe(true);
		expect(f.hasImplicitCloseTag(parse('<$let a="x">\n\ntext\n\n</$let>')[0])).toBe(false);
		expect(f.hasImplicitCloseTag(parse('a <$text text="b"/>')[0].children[1])).toBe(false);
		expect(f.hasImplicitCloseTag(f.widget("$let",{a: "x"},[f.text("t")]))).toBe(false);
	});

	it("should take a region, a quote block and a list apart", function() {
		var region = parse('"""\nline one\nline two\n"""')[0].children[0];
		expect(f.kindOf(region)).toBe("hardLineBreaksRegion");
		expect(f.regionLines(region).map(function(line) { return line.map(function(node) { return node.text; }).join(""); })).toEqual(["line one","line two"]);
		var quote = parse("<<< opener\nbody\n<<< closer")[0],
			parts = f.quoteParts(quote);
		expect(parts.openingCite.map(function(node) { return node.text; })).toEqual(["opener"]);
		expect(parts.closingCite.map(function(node) { return node.text; })).toEqual(["closer"]);
		expect(parts.body.map(f.kindOf)).toEqual(["paragraph"]);
		var list = parse("*.c one\n** sub\n* two")[0],
			items = f.listItems(list);
		expect(f.listKind(list)).toBe("ul");
		expect(items.length).toBe(2);
		expect(items[0].classes).toEqual(["c"]);
		expect(items[0].children.map(f.kindOf)).toEqual(["text"]);
		expect(items[0].nested.map(f.kindOf)).toEqual(["list"]);
		expect(items[1].nested).toEqual([]);
		expect(f.headingLevel(parse("!!! h")[0])).toBe(3);
		expect(f.headingLevel(list)).toBeNull();
		var cells = parse("|!h|^ c |<|")[0].children[0].children[0].children;
		expect(f.tableCellOptions(cells[0])).toEqual({header: true});
		expect(f.tableCellOptions(cells[1])).toEqual({header: false, align: "center", valign: "top", colspan: 2});
	});

	it("should slice the source of a parsed node and nothing for an editor node", function() {
		var source = "text ''bold'' more",
			bold = parse(source)[0].children[1];
		expect(f.sourceSlice(bold,source)).toBe("''bold''");
		expect(f.sourceSlice(f.emphasis("bold",[f.text("x")]),source)).toBeNull();
		expect(f.isBlock(f.heading(1,[]))).toBe(true);
		expect(f.isBlock(f.emphasis("bold",[]))).toBe(false);
		expect(f.isBlock(f.opaque("x",{block: true}))).toBe(true);
	});

});
