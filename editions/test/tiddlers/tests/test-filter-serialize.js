/*\
title: test-filter-serialize.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the filter expression serialization from filter AST.

\*/

describe("Filter serialization unit tests", function () {

	// --- Core round-trip ---

	it("should round-trip operator syntax variants", function () {
		const cases = [
			// basic operators
			"[tag[docs]]",
			"[!tag[docs]]",
			"[tag[docs]sort[title]]",
			// operator suffixes
			"[search:title,text[foo]]",
			"[search:title:literal,casesensitive[hello]]",
			// operand types: square, indirect, variable, multi-valued variable
			"[title{CurrentTiddler}]",
			"[tag<myVar>]",
			"[tag(myMVV)]",
			// multiple and empty operands
			"[operator[a],[b]]",
			"[operator[a],{b},<c>,(d)]",
			"[length[]]",
			// complex real-world filter
			"[all[tiddlers]!is[system]sort[title]limit[20]]",
		];
		cases.forEach((filter) => {
			const tree = $tw.wiki.parseFilter(filter);
			expect($tw.utils.serializeFilterParseTree(tree)).toBe(filter);
		});
	});

	it("should round-trip all run prefix types", function () {
		const cases = [
			"[tag[docs]] [tag[other]]",
			"[tag[docs]] +[sort[title]]",
			"[tag[docs]] -[tag[exclude]]",
			"[tag[docs]] ~[tag[fallback]]",
			"=[tag[docs]]",
			"=>[sum[]]",
			"[tag[docs]] :filter[get[text]length[]compare:integer:gteq[100]]",
			":reduce:flat[add[]]",
		];
		cases.forEach((filter) => {
			const tree = $tw.wiki.parseFilter(filter);
			expect($tw.utils.serializeFilterParseTree(tree)).toBe(filter);
		});
	});

	it("should handle edge cases: empty, null, undefined", function () {
		expect($tw.utils.serializeFilterParseTree($tw.wiki.parseFilter(""))).toBe("");
		expect($tw.utils.serializeFilterParseTree(null)).toBe("");
		expect($tw.utils.serializeFilterParseTree(undefined)).toBe("");
	});

	it("should handle deprecated regexp operand", function () {
		// /pattern/ syntax is deprecated but must round-trip correctly
		const tree = $tw.wiki.parseFilter("[modifier/Joe/]");
		const serialized = $tw.utils.serializeFilterParseTree(tree);
		expect(serialized).toBe("[modifier/Joe/]");
	});

	// --- CST: shorthand title quote preservation ---

	it("should annotate shorthand title operators with titleQuote metadata", function () {
		let tree;
		tree = $tw.wiki.parseFilter("MyTitle");
		expect(tree[0].operators[0].titleQuote).toBe("none");

		tree = $tw.wiki.parseFilter("\"My Title\"");
		expect(tree[0].operators[0].titleQuote).toBe("double");

		tree = $tw.wiki.parseFilter("'My Title'");
		expect(tree[0].operators[0].titleQuote).toBe("single");

		// explicit bracket form must NOT get titleQuote
		tree = $tw.wiki.parseFilter("[title[MyTitle]]");
		expect(tree[0].operators[0].titleQuote).toBeUndefined();
	});

	it("should round-trip all shorthand title quote styles", function () {
		// All four styles produce the same AST text value but differ in titleQuote
		const cases = [
			["MyTitle",          "MyTitle"],
			['"My Title"',       '"My Title"'],
			["'My Title'",       "'My Title'"],
			["[title[MyTitle]]", "[title[MyTitle]]"],  // bracket form stays as bracket
			["MyTitle [tag[docs]]", "MyTitle [tag[docs]]"],  // mixed with regular run
			['"Title One" \'Title Two\' TitleThree', '"Title One" \'Title Two\' TitleThree'],
		];
		cases.forEach((pair) => {
			const tree = $tw.wiki.parseFilter(pair[0]);
			expect($tw.utils.serializeFilterParseTree(tree)).toBe(pair[1]);
		});
	});

	// --- Formatting options ---

	it("should support maxRunsPerLine and custom indent", function () {
		const tree = $tw.wiki.parseFilter("[tag[a]] [tag[b]] [tag[c]] [tag[d]]");
		expect($tw.utils.serializeFilterParseTree(tree, {maxRunsPerLine: 2}))
			.toBe("[tag[a]] [tag[b]]\n  [tag[c]] [tag[d]]");
		expect($tw.utils.serializeFilterParseTree(tree, {maxRunsPerLine: 1, indent: "\t"}))
			.toBe("[tag[a]]\n\t[tag[b]]\n\t[tag[c]]\n\t[tag[d]]");
		// default: no wrapping
		expect($tw.utils.serializeFilterParseTree(tree))
			.toBe("[tag[a]] [tag[b]] [tag[c]] [tag[d]]");
	});

	it("should support wrapAt column width", function () {
		const tree = $tw.wiki.parseFilter("[tag[alpha]] [tag[beta]] [tag[gamma]]");
		// [tag[alpha]] = 12 chars; adding " [tag[beta]]" (12) = 24 which exceeds wrapAt:20
		expect($tw.utils.serializeFilterParseTree(tree, {wrapAt: 20}))
			.toBe("[tag[alpha]]\n  [tag[beta]]\n  [tag[gamma]]");
	});

});
