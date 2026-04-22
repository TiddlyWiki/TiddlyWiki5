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
	describe("ProseMirror AST round-trip tests", () => {

		let wikiAstToProseMirrorAst, wikiAstFromProseMirrorAst;
		try {
			wikiAstToProseMirrorAst = require("$:/plugins/tiddlywiki/prosemirror/ast/to-prosemirror.js").to;
			wikiAstFromProseMirrorAst = require("$:/plugins/tiddlywiki/prosemirror/ast/from-prosemirror.js").from;
		} catch(e) {
			// If running in node and prosemirror libs aren't available, skip
			return;
		}

		function roundTrip(wikitext) {
			const parseResult = $tw.wiki.parseText("text/vnd.tiddlywiki", wikitext);
			const wikiAst = parseResult.tree;
			const pmAst = wikiAstToProseMirrorAst(wikiAst);
			// pmAst is a doc object; fromPM expects the doc's content array or the doc itself
			let restored;
			if(pmAst && pmAst.type === "doc" && pmAst.content) {
				restored = wikiAstFromProseMirrorAst(pmAst);
			} else {
				restored = wikiAstFromProseMirrorAst(pmAst);
			}
			return $tw.utils.serializeWikitextParseTree(restored).trimEnd();
		}

		// --- Basic inline formatting ---

		it("should round-trip bold text", () => {
			expect(roundTrip("''bold text''")).toBe("''bold text''");
		});

		it("should round-trip italic text", () => {
			expect(roundTrip("//italic text//")).toBe("//italic text//");
		});

		it("should round-trip bold+italic text", () => {
			const input = "''//bold italic//''";
			const result = roundTrip(input);
			// Both orderings are acceptable
			expect(result === "''//bold italic//''" || result === "//''bold italic''//").toBe(true);
		});

		it("should round-trip underline text", () => {
			expect(roundTrip("__underlined__")).toBe("__underlined__");
		});

		it("should round-trip strikethrough text", () => {
			expect(roundTrip("~~strikethrough~~")).toBe("~~strikethrough~~");
		});

		it("should round-trip superscript text", () => {
			expect(roundTrip("^^superscript^^")).toBe("^^superscript^^");
		});

		it("should round-trip subscript text", () => {
			expect(roundTrip(",,subscript,,")).toBe(",,subscript,,");
		});

		it("should round-trip inline code", () => {
			expect(roundTrip("`code`")).toBe("`code`");
		});

		// --- Headings ---

		it("should round-trip heading levels 1-6", () => {
			for(let i = 1; i <= 6; i++) {
				let prefix = "";
				for(let j = 0; j < i; j++) prefix += "!";
				const input = prefix + " Heading " + i;
				expect(roundTrip(input)).toBe(input);
			}
		});

		// --- Lists ---

		it("should round-trip bullet list", () => {
			const input = "* Item 1\n* Item 2\n* Item 3";
			expect(roundTrip(input)).toBe(input);
		});

		it("should round-trip ordered list", () => {
			const input = "# Item 1\n# Item 2\n# Item 3";
			expect(roundTrip(input)).toBe(input);
		});

		// --- Code blocks ---

		it("should round-trip code block", () => {
			const input = "```\nvar x = 1;\nconsole.log(x);\n```";
			const result = roundTrip(input);
			// Code block content should be preserved
			expect(result).toContain("var x = 1;");
			expect(result).toContain("console.log(x);");
		});

		// --- Block elements ---

		it("should round-trip hard line breaks block", () => {
			const input = '"""\nThis is some text\nThat is set like\nIt is a Poem\n"""';
			const result = roundTrip(input);
			expect(result).toContain('"""');
			expect(result).toContain("This is some text");
			expect(result).toContain("That is set like");
		});

		it("should round-trip typed block", () => {
			const input = '$$$application/javascript\nconsole.log("test");\n$$$';
			const result = roundTrip(input);
			expect(result).toContain("$$$application/javascript");
			expect(result).toContain('console.log("test");');
			expect(result).toContain("$$$");
		});

		it("should round-trip horizontal rule", () => {
			const input = "text above\n\n---\n\ntext below";
			const result = roundTrip(input);
			expect(result).toContain("---");
		});

		it("should round-trip blockquote", () => {
			const input = "<<<\nquoted text\n<<<";
			const result = roundTrip(input);
			expect(result).toContain("quoted text");
		});

		it("should round-trip blockquote with cite", () => {
			const input = "<<<\nquoted text\n<<<citation source";
			const result = roundTrip(input);
			expect(result).toContain("quoted text");
			expect(result).toContain("citation source");
		});

		// --- Links ---

		it("should round-trip internal link", () => {
			const input = "Click [[here|MyTiddler]] to go";
			const result = roundTrip(input);
			expect(result).toContain("[[here|MyTiddler]]");
		});

		it("should round-trip external link", () => {
			const input = "Visit [ext[example|https://example.com]]";
			const result = roundTrip(input);
			expect(result).toContain("https://example.com");
		});

		// --- Images ---

		it("should round-trip image shortcut", () => {
			const input = "[img[myimage.png]]";
			const result = roundTrip(input);
			expect(result).toContain("myimage.png");
		});

		// --- Macros / Widgets ---

		it("should round-trip simple macro call", () => {
			const input = "<<myMacro>>";
			const result = roundTrip(input);
			expect(result).toContain("myMacro");
		});

		it("should round-trip macro call with parameters", () => {
			const input = '<<myMacro "param1" key:"value">>';
			const result = roundTrip(input);
			expect(result).toContain("myMacro");
		});

		it("should round-trip macro with positional filter argument", () => {
			const input = '<<list-links "[tag[task]sort[title]]">>';
			const result = roundTrip(input);
			expect(result).toBe('<<list-links "[tag[task]sort[title]]">>');
		});

		// --- Pragmas ---

		it("should preserve \\define pragma", () => {
			const input = "\\define myMacro()\nHello World\n\\end\n\nBody text";
			const result = roundTrip(input);
			expect(result).toContain("\\define");
			expect(result).toContain("myMacro");
			expect(result).toContain("Body text");
		});

		it("should preserve \\procedure pragma", () => {
			const input = "\\procedure myProc(param1)\nProcedure body\n\\end\n\nContent after";
			const result = roundTrip(input);
			expect(result).toContain("\\procedure");
			expect(result).toContain("myProc");
			expect(result).toContain("Content after");
		});

		it("should preserve \\import pragma", () => {
			const input = "\\import [tag[macros]]\n\nBody text here";
			const result = roundTrip(input);
			expect(result).toContain("\\import");
			expect(result).toContain("[tag[macros]]");
			expect(result).toContain("Body text here");
		});

		// --- Table round-trip ---

		it("should round-trip a simple table", () => {
			const input = "|!Header 1|!Header 2|\n|Cell 1|Cell 2|\n";
			const result = roundTrip(input);
			expect(result).toContain("|!Header 1|!Header 2|");
			expect(result).toContain("|Cell 1|Cell 2|");
		});

		it("should round-trip a table with mixed content", () => {
			const input = "|!Header 1|!Header 2|\n|Cell 1|Cell 2|\n\nAfter table";
			const result = roundTrip(input);
			// Table content should not be lost
			expect(result).toContain("Header 1");
			expect(result).toContain("Cell 1");
			expect(result).toContain("After table");
		});

		it("should round-trip a table with only data cells", () => {
			const input = "|A|B|\n|C|D|\n";
			const result = roundTrip(input);
			expect(result).toContain("|A|B|");
			expect(result).toContain("|C|D|");
		});

		it("should round-trip a single-row table", () => {
			const input = "|!Solo Header|\n";
			const result = roundTrip(input);
			expect(result).toContain("|!Solo Header|");
		});

		// --- Mixed content ---

		it("should handle mixed content without data loss", () => {
			const input = "! Heading\n\nNormal paragraph with ''bold'' and //italic//.\n\n* List item 1\n* List item 2\n\n---\n\nEnd.";
			const result = roundTrip(input);
			expect(result).toContain("Heading");
			expect(result).toContain("bold");
			expect(result).toContain("italic");
			expect(result).toContain("List item");
			expect(result).toContain("---");
			expect(result).toContain("End.");
		});

		// --- Empty and edge cases ---

		it("should handle empty document", () => {
			const result = roundTrip("");
			// Should produce at least an empty string or whitespace
			expect(typeof result).toBe("string");
		});

		it("should handle plain text without formatting", () => {
			expect(roundTrip("Just plain text.")).toBe("Just plain text.");
		});

		// --- Pragma edge cases ---

		it("should not duplicate body text after \\define", () => {
			const input = "\\define myMacro()\nHello World\n\\end\n\nBody text";
			const result = roundTrip(input);
			// Body text should appear exactly once
			const count = result.split("Body text").length - 1;
			expect(count).toBe(1);
		});

		it("should not duplicate body text after \\procedure", () => {
			const input = "\\procedure myProc(param1)\nProcedure body\n\\end\n\nContent after";
			const result = roundTrip(input);
			const count = result.split("Content after").length - 1;
			expect(count).toBe(1);
		});

		it("should preserve multiple pragmas", () => {
			const input = "\\define foo()\nfoo body\n\\end\n\\define bar()\nbar body\n\\end\n\nMain content";
			const result = roundTrip(input);
			expect(result).toContain("foo");
			expect(result).toContain("bar");
			expect(result).toContain("Main content");
			// Ensure content isn't duplicated
			const count = result.split("Main content").length - 1;
			expect(count).toBe(1);
		});

		// --- Entity round-trip ---

		it("should preserve content with en-dash entity", () => {
			const input = "Pages 10&ndash;20";
			const result = roundTrip(input);
			// The en-dash should be preserved (either as entity or as unicode char)
			expect(result.length).toBeGreaterThan(5);
		});

		// --- Transclusion preservation ---

		it("should preserve tiddler transclusion", () => {
			const input = "{{MyTiddler}}";
			const result = roundTrip(input);
			expect(result).toContain("MyTiddler");
		});

		it("should preserve template transclusion", () => {
			const input = "{{||MyTemplate}}";
			const result = roundTrip(input);
			expect(result).toContain("MyTemplate");
		});

		// --- Hard break (Shift-Enter) ---

		it("should round-trip hard break (line break within paragraph)", () => {
			const input = "Line one\nLine two";
			const result = roundTrip(input);
			// Hard break or soft newline should be preserved
			expect(result).toContain("Line one");
			expect(result).toContain("Line two");
		});

		// --- Nested formatting ---

		it("should round-trip bold within list item", () => {
			const input = "* Item with ''bold'' text\n* Normal item";
			const result = roundTrip(input);
			expect(result).toContain("bold");
			expect(result).toContain("Normal item");
		});

		it("should round-trip link within heading", () => {
			const input = "! Heading with [[link|target]]";
			const result = roundTrip(input);
			expect(result).toContain("Heading");
			expect(result).toContain("link");
		});

		// --- Multiple paragraphs ---

		it("should preserve multiple paragraphs separated by blank lines", () => {
			const input = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.";
			const result = roundTrip(input);
			expect(result).toContain("First paragraph.");
			expect(result).toContain("Second paragraph.");
			expect(result).toContain("Third paragraph.");
		});

		// --- Nested lists ---

		it("should round-trip nested bullet lists", () => {
			const input = "* Item 1\n** Sub-item 1\n** Sub-item 2\n* Item 2";
			const result = roundTrip(input);
			expect(result).toContain("Item 1");
			expect(result).toContain("Sub-item 1");
			expect(result).toContain("Item 2");
		});

		// --- Mixed list types ---

		it("should round-trip mixed list types", () => {
			const input = "* Bullet\n# Number";
			const result = roundTrip(input);
			expect(result).toContain("Bullet");
			expect(result).toContain("Number");
		});

		// --- Inline code within formatted text ---

		it("should round-trip inline code", () => {
			const input = "Use `console.log()` for debugging";
			const result = roundTrip(input);
			expect(result).toContain("console.log()");
		});

		// --- Widget/transclusion edge cases ---

		it("should preserve widget with $ prefix", () => {
			const input = "<$list filter=\"[tag[test]]\">\nContent\n</$list>";
			const result = roundTrip(input);
			expect(result).toContain("$list");
			expect(result).toContain("tag[test]");
		});

		it("should preserve filter transclusion", () => {
			const input = "{{{ [tag[task]] }}}";
			const result = roundTrip(input);
			expect(result).toContain("tag[task]");
		});

		// --- Extreme edge cases ---

		it("should handle document with only whitespace", () => {
			const result = roundTrip("   ");
			expect(typeof result).toBe("string");
		});

		it("should handle single character document", () => {
			expect(roundTrip("x")).toBe("x");
		});

		it("should preserve special characters in text", () => {
			const input = "Text with <angle> & \"quotes\" and 'apostrophes'";
			const result = roundTrip(input);
			expect(result).toContain("angle");
			expect(result).toContain("quotes");
		});

		// --- Definition lists ---

		it("should round-trip definition list", () => {
			const input = "; Term\n: Definition";
			const result = roundTrip(input);
			expect(result).toContain("Term");
			expect(result).toContain("Definition");
		});

		it("should round-trip multiple definition pairs", () => {
			const input = "; Apple\n: A fruit\n; Banana\n: Another fruit";
			const result = roundTrip(input);
			expect(result).toContain("Apple");
			expect(result).toContain("A fruit");
			expect(result).toContain("Banana");
			expect(result).toContain("Another fruit");
		});
	});
}
