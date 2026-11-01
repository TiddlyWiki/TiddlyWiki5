/*\
title: test-bibtex.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the BibTeX plugin's deserializer. Reproduce any case in the browser console of a wiki with the plugin:
$tw.wiki.deserializeTiddlers("application/x-bibtex","@book{a, title = {T}}")

\*/
"use strict";

describe("BibTeX deserializer", function() {

	var CONFIG = "$:/config/BibTeX/Standard",
		ERROR_TITLE = "BibTeX import error";

	function load(text) {
		return $tw.wiki.deserializeTiddlers("application/x-bibtex",text);
	}

	function titles(tiddlers) {
		return tiddlers.map(function(tiddler) {
			return tiddler.title;
		});
	}

	function sample() {
		var fs = require("fs"),
			path = require("path");
		return load(fs.readFileSync(path.resolve($tw.boot.corePath,"../plugins/tiddlywiki/bibtex/samples/first-jabref-bibtex-db.bib"),"utf8"));
	}

	describe("released behaviour, which must not change", function() {

		function title(source) {
			return load("@book{a, title = " + source + "}")[0]["bibtex-title"];
		}

		it("keeps values as written apart from leading whitespace", function() {
			expect(title("{{ACM}}")).toBe("{ACM}");
			expect(title('{M{\\"u}ller}')).toBe('M{\\"u}ller');
			expect(title("{ x }")).toBe("x ");
			expect(title("{x\n  y}")).toBe("x\n  y");
			expect(title('"A" # " B"')).toBe("AB");
		});

		it("keeps its own brace and quote rules", function() {
			expect(title("{a \\} b}")).toBe("a \\} b");
			expect(title('"a { b"')).toBe("a { b");
			expect(title('"M\\"uller"')).toBe('M\\"uller');
		});

		it("keeps the entry type and citation key as written", function() {
			expect(load("@BOOK{a, title = {T}}")[0]["bibtex-entry-type"]).toBe("BOOK");
			expect(load("@book#1{a, title = {T}}")[0]["bibtex-entry-type"]).toBe("book#1");
			expect(load("@book{a\n, title = {T}}")[0].title).toBe("a\n");
		});

		// The sample ships with the plugin but is not a tiddler, so it can only be read under Node.js
		if($tw.node) {
			it("imports the JabRef sample", function() {
				var tiddlers = sample(),
					dalgaard = tiddlers.find(function(tiddler) {
						return tiddler.title === "Dalgaard2001";
					});
				expect(tiddlers.length).toBe(85);
				expect(titles(tiddlers)).not.toContain(ERROR_TITLE);
				expect(dalgaard["bibtex-publisher"]).toBe("{ACM}");
			});
		}

	});

	describe("added syntax", function() {

		it("expands @string macros, ignoring case", function() {
			var tiddlers = load('@string{acm = "ACM Press"}\n@STRING(ieee = "IEEE")\n@book{a, publisher = ACM, series = ieee}');
			expect(tiddlers.length).toBe(1);
			expect(tiddlers[0]["bibtex-publisher"]).toBe("ACM Press");
			expect(tiddlers[0]["bibtex-series"]).toBe("IEEE");
		});

		it("keeps the name of an undefined macro without losing other entries", function() {
			var tiddlers = load("@book{a, publisher = Acm}\n@book{b, title = {T}}");
			expect(tiddlers.length).toBe(2);
			expect(tiddlers[0]["bibtex-publisher"]).toBe("Acm");
		});

		it("keeps spaces when concatenating macros", function() {
			expect(load('@string{acm = "ACM"}\n@book{a, title = acm # " Press"}')[0]["bibtex-title"]).toBe("ACM Press");
			expect(load('@string{pre = "Proc. of "}\n@book{a, title = pre # "X"}')[0]["bibtex-title"]).toBe("Proc. of X");
		});

		it("accepts parentheses around an entry", function() {
			var tiddlers = load("@book(a, title = {Round}, year = 1984)\n@book(b, title = {T},)");
			expect(titles(tiddlers)).toEqual(["a","b"]);
			expect(tiddlers[0]["bibtex-title"]).toBe("Round");
			expect(tiddlers[0]["bibtex-year"]).toBe("1984");
		});

		it("accepts an unquoted value followed by a newline", function() {
			expect(load("@book{a, year = 1984\n}")[0]["bibtex-year"]).toBe("1984");
		});

		it("accepts whitespace before the comma after a citation key", function() {
			expect(load("@book{a , title = {T}}")[0].title).toBe("a");
		});

		it("accepts entries without fields", function() {
			expect(titles(load("@book{a}\n@book{b,}\n@book{c, title = {T}}\n@book(d)"))).toEqual(["a","b","c","d"]);
		});

		it("accepts missing and repeated commas", function() {
			var tiddler = load("@book{a, title = {T}\n year = 1984,, note = {N}}")[0];
			expect(tiddler["bibtex-title"]).toBe("T");
			expect(tiddler["bibtex-year"]).toBe("1984");
			expect(tiddler["bibtex-note"]).toBe("N");
		});

		it("ignores an @ sign in text between entries", function() {
			var tiddlers = load("mail me@example.org today\n@book{a, title = {T}}");
			expect(tiddlers.length).toBe(1);
			expect(tiddlers[0]["bibtex-entry-type"]).toBe("book");
		});

	});

	describe("bad input", function() {

		it("does not hang on a final % line without a newline", function() {
			expect(load("@book{a, title = {T}}\n% end").length).toBe(1);
		});

		it("keeps the good entries and lists the bad one", function() {
			var tiddlers = load("@book{good, title = {T}}\n@book{bad x}\n@book{alsogood, title = {U}}");
			expect(titles(tiddlers)).toEqual(["good","alsogood",ERROR_TITLE]);
			expect(tiddlers[2].type).toBe("text/plain");
			expect(tiddlers[2].text).toContain("Line 2: ");
		});

		it("recovers from a value that is never closed", function() {
			var tiddlers = load("@book{a, title = {T\n@book{b, title = {U}}");
			expect(titles(tiddlers)).toEqual(["b",ERROR_TITLE]);
		});

		it("keeps the fields read before an entry breaks off", function() {
			var tiddlers = load("@book{a, title = {T}\n@book{b, title = {U}}");
			expect(titles(tiddlers)).toEqual(["a","b",ERROR_TITLE]);
			expect(tiddlers[0]["bibtex-title"]).toBe("T");
			expect(titles(load("@book{a, title = {T}"))).toEqual(["a",ERROR_TITLE]);
		});

		it("reports an entry with neither key nor fields", function() {
			expect(titles(load("@book{}"))).toEqual([ERROR_TITLE]);
			expect(titles(load("@book{,}"))).toEqual([ERROR_TITLE]);
		});

		it("does not read a bad file as wikitext", function() {
			expect(load("@book{a <<x>> b}")[0].type).toBe("text/plain");
		});

		it("does not overflow the stack on many % lines", function() {
			expect(load(new Array(100001).join("% x\n") + "@book{a, title = {T}}").length).toBe(1);
		});

	});

	describe("standard mode", function() {

		beforeEach(function() {
			$tw.wiki.addTiddler({title: CONFIG, text: "yes"});
		});

		afterEach(function() {
			$tw.wiki.deleteTiddler(CONFIG);
		});

		function value(text) {
			return load("@book{a, note = {" + text + "}}")[0]["bibtex-note"];
		}

		it("removes braces", function() {
			expect(value("{ACM}")).toBe("ACM");
			expect(value("The {TeX}book")).toBe("The TeXbook");
		});

		it("collapses whitespace and trims", function() {
			expect(value("x\n   y")).toBe("x y");
			expect(value("{ x }")).toBe("x");
		});

		it("decodes accents in every form", function() {
			expect(value('M\\"uller')).toBe("Müller");
			expect(value('M\\"{u}ller')).toBe("Müller");
			expect(value('M{\\"u}ller')).toBe("Müller");
			expect(value("\\v{s}")).toBe("š");
			expect(value("\\c c")).toBe("ç");
			expect(value("\\'{\\i}")).toBe("í");
		});

		it("decodes letters and escapes", function() {
			expect(value("Stra{\\ss}e")).toBe("Straße");
			expect(value("\\o{}re")).toBe("øre");
			expect(value("\\aa ngstr")).toBe("ångstr");
			expect(value("A \\& B \\% C \\_ D \\# E \\$ F")).toBe("A & B % C _ D # E $ F");
		});

		it("keeps unknown commands and math as written", function() {
			expect(value("\\emph{a{b}c} {D}")).toBe("\\emph{a{b}c} D");
			expect(value("$x_{10}$")).toBe("$x_{10}$");
			expect(value('a\\\\"u')).toBe('a\\\\"u');
		});

		it("does not convert addresses or the citation key", function() {
			var tiddler = load("@book{a\\_b, URL = {http://x/{a}\\_b}, doi = {1\\_2}, eprint = {{3}}}")[0];
			expect(tiddler.title).toBe("a\\_b");
			expect(tiddler["bibtex-url"]).toBe("http://x/{a}\\_b");
			expect(tiddler["bibtex-doi"]).toBe("1\\_2");
			expect(tiddler["bibtex-eprint"]).toBe("{3}");
		});

		it("cleans the entry type and citation key", function() {
			expect(load("@BOOK{a, title = {T}}")[0]["bibtex-entry-type"]).toBe("book");
			expect(load("@book\n{a\n, title = {T}}")[0]["bibtex-entry-type"]).toBe("book");
			expect(load("@book{a\n, title = {T}}")[0].title).toBe("a");
		});

		it("counts braces as BibTeX does", function() {
			var bibtexParse = require("$:/plugins/tiddlywiki/bibtex/bibtexParse.js"),
				options = {standard: true};
			expect(bibtexParse.toJSON('@book{a, title = "x {"}y", year = 1984}',options)[0].entryTags).toEqual({title: 'x {"}y', year: "1984"});
			expect(bibtexParse.toJSON("@book{a, title = {x\\}}",options)[0].entryTags.title).toBe("x\\");
		});

		if($tw.node) {
			it("imports the JabRef sample", function() {
				var tiddlers = sample(),
					dalgaard = tiddlers.find(function(tiddler) {
						return tiddler.title === "Dalgaard2001";
					});
				expect(tiddlers.length).toBe(85);
				expect(dalgaard["bibtex-publisher"]).toBe("ACM");
				tiddlers.forEach(function(tiddler) {
					Object.keys(tiddler).forEach(function(name) {
						if(name !== "bibtex-url") {
							expect(String(tiddler[name])).not.toMatch(/^\{/);
						}
					});
				});
			});
		}

	});

});
