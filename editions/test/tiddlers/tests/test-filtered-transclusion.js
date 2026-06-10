/*\
title: test-filtered-transclusion.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for the filtered transclusion wikitext rules `{{{ ... }}}`, covering the
parsing of filters that contain pipe or brace characters
See issues: #9862, #7701, #4462

\*/

"use strict";

describe("Filtered transclusion parser tests", function() {

	// Create a wiki
	var wiki = $tw.test.wiki();

	// Define a parsing shortcut
	var parse = function(text) {
		return wiki.parseText("text/vnd.tiddlywiki",text).tree;
	};

	it("should keep vertical bars contained within filter operands and quoted strings as part of the filter (#9862, #4462)", function() {
		// A "|" inside a filter operand must not be mistaken for the tooltip delimiter
		expect(parse("{{{ a b c +[join[|]] }}}")).toEqual(

			[ { type: "list", attributes: { filter: { type: "string", value: " a b c +[join[|]] ", start: 3, end: 21 } }, isBlock: true, start: 0, end: 24, rule: "filteredtranscludeblock" } ]

		);
		// Multiple pipes inside a splitregexp operand (#4462)
		expect(parse("{{{ [[nobody, really; wants; to see]splitregexp[,|;]join[+]] }}}")).toEqual(

			[ { type: "list", attributes: { filter: { type: "string", value: " [[nobody, really; wants; to see]splitregexp[,|;]join[+]] ", start: 3, end: 61 } }, isBlock: true, start: 0, end: 64, rule: "filteredtranscludeblock" } ]

		);
		// A "|" inside a quoted string is part of the filter title, not a delimiter
		expect(parse("{{{ \"a|b\" }}}")).toEqual(

			[ { type: "list", attributes: { filter: { type: "string", value: " \"a|b\" ", start: 3, end: 10 } }, isBlock: true, start: 0, end: 13, rule: "filteredtranscludeblock" } ]

		);
		// A bare top-level "|" is still the tooltip delimiter (backwards compatible)
		expect(parse("{{{ abc|def }}}")).toEqual(

			[ { type: "list", attributes: { filter: { type: "string", value: " abc", start: 3, end: 7 }, tooltip: { type: "string", value: "def ", start: 8, end: 12 } }, isBlock: true, start: 0, end: 15, rule: "filteredtranscludeblock" } ]

		);
	});

	it("should record the correct source position of a template", function() {
		// The documented "||TemplateTitle" form. The template position must skip the
		// "||" even though there is no preceding tooltip
		expect(parse("{{{ [tag[mechanism]]||TemplateTitle }}}")).toEqual(

			[ { type: "list", attributes: { filter: { type: "string", value: " [tag[mechanism]]", start: 3, end: 20 }, template: { type: "string", value: "TemplateTitle", start: 22, end: 36 } }, isBlock: true, start: 0, end: 39, rule: "filteredtranscludeblock" } ]

		);
	});

	it("should not be broken by malformed filter syntax in a transclusion (#9862)", function() {
		// A stray closing bracket must not hang the scanner; the transclusion is
		// still recognised so the broken filter surfaces as a filter error
		expect(parse("{{{ ] }}}")).toEqual(

			[ { type: "list", attributes: { filter: { type: "string", value: " ] ", start: 3, end: 6 } }, isBlock: true, start: 0, end: 9, rule: "filteredtranscludeblock" } ]

		);
		// A filter run with a missing closing bracket is captured verbatim and
		// left for the filter compiler to report
		expect(parse("{{{ [tag[docs] }}}")).toEqual(

			[ { type: "list", attributes: { filter: { type: "string", value: " [tag[docs] ", start: 3, end: 15 } }, isBlock: true, start: 0, end: 18, rule: "filteredtranscludeblock" } ]

		);
		// An empty filter is not a filtered transclusion: "{{{}}}" is a "{"
		// followed by an empty "{{}}" transclusion followed by a "}"
		expect(parse("{{{}}}")).toEqual(

			[ { type: "element", tag: "p", rule: "parseblock", start: 0, end: 6, children: [ { type: "text", text: "{", start: 0, end: 1 }, { type: "transclude", attributes: {}, start: 1, end: 5, rule: "transcludeinline" }, { type: "text", text: "}", start: 5, end: 6 } ] } ]

		);
	});

	it("should not let a block filtered transclusion with a trailing character swallow later content (#7701)", function() {
		// A character after the closing braces means it is not a block transclusion,
		// so it falls through to the inline rule rather than greedily consuming the
		// rest of the document up to the next "}"
		expect(parse("{{{ [[any filter]] }}}a")).toEqual(

			[ { type: "element", tag: "p", rule: "parseblock", start: 0, end: 23, children: [ { type: "list", attributes: { filter: { type: "string", value: " [[any filter]] ", start: 3, end: 19 } }, start: 0, end: 22, rule: "filteredtranscludeinline" }, { type: "text", text: "a", start: 22, end: 23 } ] } ]

		);
		// The reported case: a trailing space, then a lone "}" later in the text.
		// The "}" must survive as its own paragraph, not be swallowed
		expect(parse("{{{ [[any filter]] }}} \n\n}")).toEqual(

			[
				{ type: "element", tag: "p", rule: "parseblock", start: 0, end: 23, children: [ { type: "list", attributes: { filter: { type: "string", value: " [[any filter]] ", start: 3, end: 19 } }, start: 0, end: 22, rule: "filteredtranscludeinline" }, { type: "text", text: " ", start: 22, end: 23 } ] },
				{ type: "element", tag: "p", rule: "parseblock", start: 25, end: 26, children: [ { type: "text", text: "}", start: 25, end: 26 } ] }
			]

		);
	});

});
