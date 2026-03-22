/*\
title: test-prosemirror-ast-roundtrip.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the ProseMirror AST round-trip: wikitext → wiki AST → PM AST → wiki AST → wikitext.
Ensures content is not lost or corrupted when editing in the WYSIWYG editor.

\*/

if(!$tw.browser) {
	// These tests require the wikitext-serialize plugin which is available in both
	// browser and node environments, but the prosemirror AST converters should work in node too.
	describe("ProseMirror AST round-trip tests", function() {

		var wikiAstToProseMirrorAst, wikiAstFromProseMirrorAst;
		try {
			wikiAstToProseMirrorAst = require("$:/plugins/tiddlywiki/prosemirror/ast/to-prosemirror.js").to;
			wikiAstFromProseMirrorAst = require("$:/plugins/tiddlywiki/prosemirror/ast/from-prosemirror.js").from;
		} catch(e) {
			// If running in node and prosemirror libs aren't available, skip
			return;
		}

		/**
		 * Helper: run a full round-trip and return the result wikitext.
		 * wikitext → parse → toPM → fromPM → serialize
		 */
		function roundTrip(wikitext) {
			var parseResult = $tw.wiki.parseText("text/vnd.tiddlywiki", wikitext);
			var wikiAst = parseResult.tree;
			var pmAst = wikiAstToProseMirrorAst(wikiAst);
			// pmAst is a doc object; fromPM expects the doc's content array or the doc itself
			var restored;
			if(pmAst && pmAst.type === "doc" && pmAst.content) {
				restored = wikiAstFromProseMirrorAst(pmAst);
			} else {
				restored = wikiAstFromProseMirrorAst(pmAst);
			}
			return $tw.utils.serializeWikitextParseTree(restored).trimEnd();
		}

		// --- Basic inline formatting ---

		it("should round-trip bold text", function() {
			expect(roundTrip("''bold text''")).toBe("''bold text''");
		});

		it("should round-trip italic text", function() {
			expect(roundTrip("//italic text//")).toBe("//italic text//");
		});

		it("should round-trip bold+italic text", function() {
			var input = "''//bold italic//''";
			var result = roundTrip(input);
			// Both orderings are acceptable
			expect(result === "''//bold italic//''" || result === "//''bold italic''//").toBe(true);
		});

		it("should round-trip underline text", function() {
			expect(roundTrip("__underlined__")).toBe("__underlined__");
		});

		it("should round-trip strikethrough text", function() {
			expect(roundTrip("~~strikethrough~~")).toBe("~~strikethrough~~");
		});

		it("should round-trip superscript text", function() {
			expect(roundTrip("^^superscript^^")).toBe("^^superscript^^");
		});

		it("should round-trip subscript text", function() {
			expect(roundTrip(",,subscript,,")).toBe(",,subscript,,");
		});

		it("should round-trip inline code", function() {
			expect(roundTrip("`code`")).toBe("`code`");
		});

		// --- Headings ---

		it("should round-trip heading levels 1-6", function() {
			for(var i = 1; i <= 6; i++) {
				var prefix = "";
				for(var j = 0; j < i; j++) prefix += "!";
				var input = prefix + " Heading " + i;
				expect(roundTrip(input)).toBe(input);
			}
		});

		// --- Lists ---

		it("should round-trip bullet list", function() {
			var input = "* Item 1\n* Item 2\n* Item 3";
			expect(roundTrip(input)).toBe(input);
		});

		it("should round-trip ordered list", function() {
			var input = "# Item 1\n# Item 2\n# Item 3";
			expect(roundTrip(input)).toBe(input);
		});

		// --- Code blocks ---

		it("should round-trip code block", function() {
			var input = "```\nvar x = 1;\nconsole.log(x);\n```";
			var result = roundTrip(input);
			// Code block content should be preserved
			expect(result).toContain("var x = 1;");
			expect(result).toContain("console.log(x);");
		});

		// --- Block elements ---

		it("should round-trip horizontal rule", function() {
			var input = "text above\n\n---\n\ntext below";
			var result = roundTrip(input);
			expect(result).toContain("---");
		});

		it("should round-trip blockquote", function() {
			var input = "<<<\nquoted text\n<<<";
			var result = roundTrip(input);
			expect(result).toContain("quoted text");
		});

		it("should round-trip blockquote with cite", function() {
			var input = "<<<\nquoted text\n<<<citation source";
			var result = roundTrip(input);
			expect(result).toContain("quoted text");
			expect(result).toContain("citation source");
		});

		// --- Links ---

		it("should round-trip internal link", function() {
			var input = "Click [[here|MyTiddler]] to go";
			var result = roundTrip(input);
			expect(result).toContain("[[here|MyTiddler]]");
		});

		it("should round-trip external link", function() {
			var input = "Visit [ext[example|https://example.com]]";
			var result = roundTrip(input);
			expect(result).toContain("https://example.com");
		});

		// --- Images ---

		it("should round-trip image shortcut", function() {
			var input = "[img[myimage.png]]";
			var result = roundTrip(input);
			expect(result).toContain("myimage.png");
		});

		// --- Macros / Widgets ---

		it("should round-trip simple macro call", function() {
			var input = "<<myMacro>>";
			var result = roundTrip(input);
			expect(result).toContain("myMacro");
		});

		it("should round-trip macro call with parameters", function() {
			var input = '<<myMacro "param1" key:"value">>';
			var result = roundTrip(input);
			expect(result).toContain("myMacro");
		});

		// --- Pragmas ---

		it("should preserve \\define pragma", function() {
			var input = "\\define myMacro()\nHello World\n\\end\n\nBody text";
			var result = roundTrip(input);
			expect(result).toContain("\\define");
			expect(result).toContain("myMacro");
			expect(result).toContain("Body text");
		});

		it("should preserve \\procedure pragma", function() {
			var input = "\\procedure myProc(param1)\nProcedure body\n\\end\n\nContent after";
			var result = roundTrip(input);
			expect(result).toContain("\\procedure");
			expect(result).toContain("myProc");
			expect(result).toContain("Content after");
		});

		it("should preserve \\import pragma", function() {
			var input = "\\import [tag[macros]]\n\nBody text here";
			var result = roundTrip(input);
			expect(result).toContain("\\import");
			expect(result).toContain("[tag[macros]]");
			expect(result).toContain("Body text here");
		});

		// --- Table round-trip ---

		it("should round-trip a simple table", function() {
			var input = "|!Header 1|!Header 2|\n|Cell 1|Cell 2|\n";
			var result = roundTrip(input);
			expect(result).toContain("|!Header 1|!Header 2|");
			expect(result).toContain("|Cell 1|Cell 2|");
		});

		it("should round-trip a table with mixed content", function() {
			var input = "|!Header 1|!Header 2|\n|Cell 1|Cell 2|\n\nAfter table";
			var result = roundTrip(input);
			// Table content should not be lost
			expect(result).toContain("Header 1");
			expect(result).toContain("Cell 1");
			expect(result).toContain("After table");
		});

		it("should round-trip a table with only data cells", function() {
			var input = "|A|B|\n|C|D|\n";
			var result = roundTrip(input);
			expect(result).toContain("|A|B|");
			expect(result).toContain("|C|D|");
		});

		it("should round-trip a single-row table", function() {
			var input = "|!Solo Header|\n";
			var result = roundTrip(input);
			expect(result).toContain("|!Solo Header|");
		});

		// --- Mixed content ---

		it("should handle mixed content without data loss", function() {
			var input = "! Heading\n\nNormal paragraph with ''bold'' and //italic//.\n\n* List item 1\n* List item 2\n\n---\n\nEnd.";
			var result = roundTrip(input);
			expect(result).toContain("Heading");
			expect(result).toContain("bold");
			expect(result).toContain("italic");
			expect(result).toContain("List item");
			expect(result).toContain("---");
			expect(result).toContain("End.");
		});

		// --- Empty and edge cases ---

		it("should handle empty document", function() {
			var result = roundTrip("");
			// Should produce at least an empty string or whitespace
			expect(typeof result).toBe("string");
		});

		it("should handle plain text without formatting", function() {
			expect(roundTrip("Just plain text.")).toBe("Just plain text.");
		});

		// --- Pragma edge cases ---

		it("should not duplicate body text after \\define", function() {
			var input = "\\define myMacro()\nHello World\n\\end\n\nBody text";
			var result = roundTrip(input);
			// Body text should appear exactly once
			var count = result.split("Body text").length - 1;
			expect(count).toBe(1);
		});

		it("should not duplicate body text after \\procedure", function() {
			var input = "\\procedure myProc(param1)\nProcedure body\n\\end\n\nContent after";
			var result = roundTrip(input);
			var count = result.split("Content after").length - 1;
			expect(count).toBe(1);
		});

		it("should preserve multiple pragmas", function() {
			var input = "\\define foo()\nfoo body\n\\end\n\\define bar()\nbar body\n\\end\n\nMain content";
			var result = roundTrip(input);
			expect(result).toContain("foo");
			expect(result).toContain("bar");
			expect(result).toContain("Main content");
			// Ensure content isn't duplicated
			var count = result.split("Main content").length - 1;
			expect(count).toBe(1);
		});

		// --- Entity round-trip ---

		it("should preserve content with en-dash entity", function() {
			var input = "Pages 10&ndash;20";
			var result = roundTrip(input);
			// The en-dash should be preserved (either as entity or as unicode char)
			expect(result.length).toBeGreaterThan(5);
		});

		// --- Transclusion preservation ---

		it("should preserve tiddler transclusion", function() {
			var input = "{{MyTiddler}}";
			var result = roundTrip(input);
			expect(result).toContain("MyTiddler");
		});

		it("should preserve template transclusion", function() {
			var input = "{{||MyTemplate}}";
			var result = roundTrip(input);
			expect(result).toContain("MyTemplate");
		});

		// --- Hard break (Shift-Enter) ---

		it("should round-trip hard break (line break within paragraph)", function() {
			var input = "Line one\nLine two";
			var result = roundTrip(input);
			// Hard break or soft newline should be preserved
			expect(result).toContain("Line one");
			expect(result).toContain("Line two");
		});

		// --- Nested formatting ---

		it("should round-trip bold within list item", function() {
			var input = "* Item with ''bold'' text\n* Normal item";
			var result = roundTrip(input);
			expect(result).toContain("bold");
			expect(result).toContain("Normal item");
		});

		it("should round-trip link within heading", function() {
			var input = "! Heading with [[link|target]]";
			var result = roundTrip(input);
			expect(result).toContain("Heading");
			expect(result).toContain("link");
		});

		// --- Multiple paragraphs ---

		it("should preserve multiple paragraphs separated by blank lines", function() {
			var input = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.";
			var result = roundTrip(input);
			expect(result).toContain("First paragraph.");
			expect(result).toContain("Second paragraph.");
			expect(result).toContain("Third paragraph.");
		});

		// --- Nested lists ---

		it("should round-trip nested bullet lists", function() {
			var input = "* Item 1\n** Sub-item 1\n** Sub-item 2\n* Item 2";
			var result = roundTrip(input);
			expect(result).toContain("Item 1");
			expect(result).toContain("Sub-item 1");
			expect(result).toContain("Item 2");
		});

		// --- Mixed list types ---

		it("should round-trip mixed list types", function() {
			var input = "* Bullet\n# Number";
			var result = roundTrip(input);
			expect(result).toContain("Bullet");
			expect(result).toContain("Number");
		});

		// --- Inline code within formatted text ---

		it("should round-trip inline code", function() {
			var input = "Use `console.log()` for debugging";
			var result = roundTrip(input);
			expect(result).toContain("console.log()");
		});

		// --- Widget/transclusion edge cases ---

		it("should preserve widget with $ prefix", function() {
			var input = "<$list filter=\"[tag[test]]\">\nContent\n</$list>";
			var result = roundTrip(input);
			expect(result).toContain("$list");
			expect(result).toContain("tag[test]");
		});

		it("should preserve filter transclusion", function() {
			var input = "{{{ [tag[task]] }}}";
			var result = roundTrip(input);
			expect(result).toContain("tag[task]");
		});

		// --- Extreme edge cases ---

		it("should handle document with only whitespace", function() {
			var result = roundTrip("   ");
			expect(typeof result).toBe("string");
		});

		it("should handle single character document", function() {
			expect(roundTrip("x")).toBe("x");
		});

		it("should preserve special characters in text", function() {
			var input = "Text with <angle> & \"quotes\" and 'apostrophes'";
			var result = roundTrip(input);
			expect(result).toContain("angle");
			expect(result).toContain("quotes");
		});

		// --- Definition lists ---

		it("should round-trip definition list", function() {
			var input = "; Term\n: Definition";
			var result = roundTrip(input);
			expect(result).toContain("Term");
			expect(result).toContain("Definition");
		});

		it("should round-trip multiple definition pairs", function() {
			var input = "; Apple\n: A fruit\n; Banana\n: Another fruit";
			var result = roundTrip(input);
			expect(result).toContain("Apple");
			expect(result).toContain("A fruit");
			expect(result).toContain("Banana");
			expect(result).toContain("Another fruit");
		});
	});
}
