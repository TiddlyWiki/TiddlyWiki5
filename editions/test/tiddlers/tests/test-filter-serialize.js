/*\
title: test-filter-serialize.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the filter expression serialization from filter AST.

\*/

describe("Filter serialization unit tests", function () {

	it("should serialize simple operator", function () {
		var filter = "[tag[docs]]";
		var tree = $tw.wiki.parseFilter(filter);
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("[tag[docs]]");
	});

	it("should serialize negated operator", function () {
		var filter = "[!tag[docs]]";
		var tree = $tw.wiki.parseFilter(filter);
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("[!tag[docs]]");
	});

	it("should serialize chained operators", function () {
		var filter = "[tag[docs]sort[title]]";
		var tree = $tw.wiki.parseFilter(filter);
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("[tag[docs]sort[title]]");
	});

	it("should serialize multiple runs", function () {
		var filter = "[tag[docs]] [tag[other]]";
		var tree = $tw.wiki.parseFilter(filter);
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("[tag[docs]] [tag[other]]");
	});

	it("should serialize + prefix", function () {
		var filter = "[tag[docs]] +[sort[title]]";
		var tree = $tw.wiki.parseFilter(filter);
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("[tag[docs]] +[sort[title]]");
	});

	it("should serialize - prefix", function () {
		var filter = "[tag[docs]] -[tag[exclude]]";
		var tree = $tw.wiki.parseFilter(filter);
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("[tag[docs]] -[tag[exclude]]");
	});

	it("should serialize ~ prefix", function () {
		var filter = "[tag[docs]] ~[tag[fallback]]";
		var tree = $tw.wiki.parseFilter(filter);
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("[tag[docs]] ~[tag[fallback]]");
	});

	it("should serialize => prefix", function () {
		var filter = "=>[sum[]]";
		var tree = $tw.wiki.parseFilter(filter);
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("=>[sum[]]");
	});

	it("should serialize = prefix", function () {
		var filter = "=[tag[docs]]";
		var tree = $tw.wiki.parseFilter(filter);
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("=[tag[docs]]");
	});

	it("should serialize named prefix :filter", function () {
		var filter = "[tag[docs]] :filter[get[text]length[]compare:integer:gteq[100]]";
		var tree = $tw.wiki.parseFilter(filter);
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("[tag[docs]] :filter[get[text]length[]compare:integer:gteq[100]]");
	});

	it("should serialize operator suffix with single part", function () {
		var filter = "[search:title,text[foo]]";
		var tree = $tw.wiki.parseFilter(filter);
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("[search:title,text[foo]]");
	});

	it("should serialize operator suffix with multiple parts", function () {
		var filter = "[search:title:literal,casesensitive[hello]]";
		var tree = $tw.wiki.parseFilter(filter);
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("[search:title:literal,casesensitive[hello]]");
	});

	it("should serialize indirect operand {}", function () {
		var filter = "[title{CurrentTiddler}]";
		var tree = $tw.wiki.parseFilter(filter);
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("[title{CurrentTiddler}]");
	});

	it("should serialize variable operand <>", function () {
		var filter = "[tag<myVar>]";
		var tree = $tw.wiki.parseFilter(filter);
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("[tag<myVar>]");
	});

	it("should serialize multi-valued variable operand ()", function () {
		var filter = "[tag(myMVV)]";
		var tree = $tw.wiki.parseFilter(filter);
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("[tag(myMVV)]");
	});

	it("should serialize multiple operands", function () {
		var filter = "[operator[a],[b]]";
		var tree = $tw.wiki.parseFilter(filter);
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("[operator[a],[b]]");
	});

	it("should serialize mixed operand types", function () {
		var filter = "[operator[a],{b},<c>,(d)]";
		var tree = $tw.wiki.parseFilter(filter);
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("[operator[a],{b},<c>,(d)]");
	});

	it("should serialize empty operand", function () {
		var filter = "[length[]]";
		var tree = $tw.wiki.parseFilter(filter);
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("[length[]]");
	});

	it("should serialize empty filter", function () {
		var tree = $tw.wiki.parseFilter("");
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("");
	});

	it("should serialize complex real-world filter", function () {
		var filter = "[all[tiddlers]!is[system]sort[title]limit[20]]";
		var tree = $tw.wiki.parseFilter(filter);
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("[all[tiddlers]!is[system]sort[title]limit[20]]");
	});

	it("should handle null/undefined input", function () {
		expect($tw.utils.serializeFilterParseTree(null)).toBe("");
		expect($tw.utils.serializeFilterParseTree(undefined)).toBe("");
	});

	it("should serialize named prefix with suffixes", function () {
		var filter = ":reduce:flat[add[]]";
		var tree = $tw.wiki.parseFilter(filter);
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe(":reduce:flat[add[]]");
	});

	// --- CST round-trip tests for shorthand title syntax ---

	it("should round-trip unquoted title (CST: none)", function () {
		var filter = "MyTitle";
		var tree = $tw.wiki.parseFilter(filter);
		expect(tree[0].operators[0].titleQuote).toBe("none");
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("MyTitle");
	});

	it("should round-trip double-quoted title (CST: double)", function () {
		var filter = "\"My Title\"";
		var tree = $tw.wiki.parseFilter(filter);
		expect(tree[0].operators[0].titleQuote).toBe("double");
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("\"My Title\"");
	});

	it("should round-trip single-quoted title (CST: single)", function () {
		var filter = "'My Title'";
		var tree = $tw.wiki.parseFilter(filter);
		expect(tree[0].operators[0].titleQuote).toBe("single");
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("'My Title'");
	});

	it("should NOT set titleQuote on explicit bracket form [title[...]]", function () {
		var filter = "[title[MyTitle]]";
		var tree = $tw.wiki.parseFilter(filter);
		expect(tree[0].operators[0].titleQuote).toBeUndefined();
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("[title[MyTitle]]");
	});

	it("should round-trip multiple shorthand titles with different quotes", function () {
		var filter = "\"Title One\" 'Title Two' TitleThree";
		var tree = $tw.wiki.parseFilter(filter);
		expect(tree[0].operators[0].titleQuote).toBe("double");
		expect(tree[1].operators[0].titleQuote).toBe("single");
		expect(tree[2].operators[0].titleQuote).toBe("none");
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("\"Title One\" 'Title Two' TitleThree");
	});

	it("should serialize shorthand title mixed with a regular run", function () {
		var filter = "MyTitle [tag[docs]]";
		var tree = $tw.wiki.parseFilter(filter);
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("MyTitle [tag[docs]]");
	});

	// --- Formatting options ---

	it("should wrap at maxRunsPerLine", function () {
		var filter = "[tag[a]] [tag[b]] [tag[c]] [tag[d]]";
		var tree = $tw.wiki.parseFilter(filter);
		var serialized = $tw.utils.serializeFilterParseTree(tree, {maxRunsPerLine: 2});
		expect(serialized).toBe("[tag[a]] [tag[b]]\n  [tag[c]] [tag[d]]");
	});

	it("should use custom indent string", function () {
		var filter = "[tag[a]] [tag[b]] [tag[c]]";
		var tree = $tw.wiki.parseFilter(filter);
		var serialized = $tw.utils.serializeFilterParseTree(tree, {maxRunsPerLine: 1, indent: "\t"});
		expect(serialized).toBe("[tag[a]]\n\t[tag[b]]\n\t[tag[c]]");
	});

	it("should wrap at wrapAt column width", function () {
		var filter = "[tag[alpha]] [tag[beta]] [tag[gamma]]";
		var tree = $tw.wiki.parseFilter(filter);
		// "[tag[alpha]]" is 12 chars, " [tag[beta]]" would make 24, " [tag[gamma]]" would make 37
		// wrapAt:20 → wrap before [tag[beta]]
		var serialized = $tw.utils.serializeFilterParseTree(tree, {wrapAt: 20});
		expect(serialized).toBe("[tag[alpha]]\n  [tag[beta]]\n  [tag[gamma]]");
	});

	it("should not wrap with default options", function () {
		var filter = "[tag[a]] [tag[b]] [tag[c]]";
		var tree = $tw.wiki.parseFilter(filter);
		var serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("[tag[a]] [tag[b]] [tag[c]]");
	});
});
