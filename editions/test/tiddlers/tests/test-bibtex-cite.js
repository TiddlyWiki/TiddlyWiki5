/*\
title: test-bibtex-cite.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the BibTeX plugin's citation template. Reproduce by adding an entry to a wiki with the plugin and writing this in a tiddler:
{{Dalgaard2001||citeAPA}}

\*/
"use strict";

describe("BibTeX citation template", function() {

	function makeWiki(entries) {
		var wiki = new $tw.Wiki();
		wiki.addTiddler($tw.wiki.getTiddler("citeAPA"));
		wiki.addTiddlers(entries);
		return wiki;
	}

	function entry(title,fields) {
		return Object.assign({title: title, "bibtex-entry-type": "book"},fields);
	}

	function apa(fields) {
		var wiki = makeWiki([entry("E",fields)]);
		return wiki.renderText("text/plain","text/vnd.tiddlywiki","{{E||citeAPA}}");
	}

	describe("citeAPA", function() {

		it("links to the entry and does not show its full reference", function() {
			var wiki = makeWiki([entry("Dalgaard2001",{"bibtex-author": "Dalgaard, Rune", "bibtex-title": "A title", "bibtex-year": "2001"})]),
				html = wiki.renderText("text/html","text/vnd.tiddlywiki","See {{Dalgaard2001||citeAPA}}.");
			expect(html).toContain('href="#Dalgaard2001"');
			expect(html).toContain(">(Dalgaard, 2001)</a>.");
			expect(html).toContain('title="A title"');
		});

		it("shortens authors by count", function() {
			expect(apa({"bibtex-author": "Rune Dalgaard", "bibtex-year": "2001"})).toBe("(Dalgaard, 2001)");
			expect(apa({"bibtex-author": "Li, Liang and Tseng, Shu", "bibtex-year": "2001"})).toBe("(Li & Tseng, 2001)");
			expect(apa({"bibtex-author": "Smith, A and Smith, B", "bibtex-year": "2001"})).toBe("(Smith & Smith, 2001)");
			expect(apa({"bibtex-author": "Li, L and Tseng, S and Chen, G", "bibtex-year": "2001"})).toBe("(Li et al., 2001)");
			expect(apa({"bibtex-author": "Li, L and others", "bibtex-year": "2001"})).toBe("(Li et al., 2001)");
			expect(apa({"bibtex-author": "van der Berg, Jan", "bibtex-year": "2001"})).toBe("(van der Berg, 2001)");
		});

		it("falls back when a field is missing", function() {
			expect(apa({"bibtex-editor": "Hunt, Verity", "bibtex-year": "2001"})).toBe("(Hunt, 2001)");
			expect(apa({"bibtex-author": "Hunt, Verity", "bibtex-date": "2001-03-04"})).toBe("(Hunt, 2001)");
			expect(apa({"bibtex-author": "Hunt, Verity"})).toBe("(Hunt, n.d.)");
			expect(apa({"bibtex-title": "Only a title", "bibtex-year": "2001"})).toBe("(Only a title, 2001)");
		});

	});

});
