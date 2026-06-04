/*\
title: test-filter-field-parens.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for field names that contain parentheses used as a filter operator suffix,
e.g. [regexp:_cd-work(s)[(?i)suite]].

Issue #9865: TiddlyWiki 5.4.0 added the round bracket operand syntax (varname)
for multi value variables, so the parser began treating "(" as an operand start.
Before 5.4.0 "(" was an ordinary character, so field names like _cd-work(s)
worked as a suffix; the change broke them.

Fix (parseFilterOperation in core/modules/filters.js): a "(...)" is part of a
suffix field name when a ":" precedes it and another operand bracket follows;
otherwise it is a round bracket operand.

\*/

"use strict";

describe("Filter operator suffixes containing parentheses (#9865)", function() {

	// Parse trees below: each operator has operator (name), suffix (raw text after the
	// first ":"), suffixes (that suffix split on ":" then ","), and operands ({text} for
	// [x], {variable:true,text} for <x>, {multiValuedVariable:true,text} for (x)).

	it("should keep a parenthesised field name as a single operator suffix", function() {
		// Core regression: "_cd-work(s)" must stay whole as the suffix. It must work with
		// literal, MVV (x) and variable <x> operands.
		expect($tw.wiki.parseFilter("[regexp:_cd-work(s)[(?i)suite]]")).toEqual(
			[ { prefix : "", operators : [ { operator : "regexp", suffix : "_cd-work(s)", suffixes : [ [ "_cd-work(s)" ] ], operands: [ { text:"(?i)suite" } ] } ] } ]
		);
		expect($tw.wiki.parseFilter("[regexp:_cd-work(s)(varname)]")).toEqual(
			[ { prefix : "", operators : [ { operator : "regexp", suffix : "_cd-work(s)", suffixes : [ [ "_cd-work(s)" ] ], operands: [ { multiValuedVariable: true, text:"varname" } ] } ] } ]
		);
		expect($tw.wiki.parseFilter("[regexp:_cd-work(s)<varname>]")).toEqual(
			[ { prefix : "", operators : [ { operator : "regexp", suffix : "_cd-work(s)", suffixes : [ [ "_cd-work(s)" ] ], operands: [ { variable: true, text:"varname" } ] } ] } ]
		);
	});

	it("should keep multiple parenthesised groups in a field name as one suffix", function() {
		// Consecutive groups like "_cd-work(s)(x)" all stay in the suffix; each is followed
		// by another operand bracket, so the operand is the final one.
		expect($tw.wiki.parseFilter("[regexp:_cd-work(s)(x)[(?i)suite]]")).toEqual(
			[ { prefix : "", operators : [ { operator : "regexp", suffix : "_cd-work(s)(x)", suffixes : [ [ "_cd-work(s)(x)" ] ], operands: [ { text:"(?i)suite" } ] } ] } ]
		);
		expect($tw.wiki.parseFilter("[regexp:_cd-work(s)(x)(varname)]")).toEqual(
			[ { prefix : "", operators : [ { operator : "regexp", suffix : "_cd-work(s)(x)", suffixes : [ [ "_cd-work(s)(x)" ] ], operands: [ { multiValuedVariable: true, text:"varname" } ] } ] } ]
		);
		var wiki = new $tw.Wiki();
		wiki.addTiddler({title: "Alpha", "_cd-work(s)(x)": "My Test Suite"});
		wiki.addTiddler({title: "Beta", "_cd-work(s)(x)": "nothing relevant"});
		expect(wiki.filterTiddlers("[regexp:_cd-work(s)(x)[(?i)suite]]")).toEqual(["Alpha"]);
	});

	it("should still parse round bracket operands (multi value variables) as operands", function() {
		// Must not break the feature: with no suffix, "(varname)" is a real MVV operand
		// (here on the bare title operator), followed by sort.
		expect($tw.wiki.parseFilter("[(varname)sort[]]")).toEqual(
			[ { prefix : "", operators : [ { operator : "title", operands: [ { multiValuedVariable: true, text:"varname" } ] }, { operator : "sort", operands: [ { text:"" } ] } ] } ]
		);
	});

	it("should take the regexp pattern from a variable when the field name has parentheses", function() {
		// Field name as suffix, pattern from a variable. A widget is needed to resolve the
		// variable, so build a root widget and use its child as the anchor.
		var wiki = new $tw.Wiki();
		wiki.addTiddler({title: "Alpha", "_cd-work(s)": "My Test Suite"});
		wiki.addTiddler({title: "Beta", "_cd-work(s)": "nothing relevant"});
		var widget = require("$:/core/modules/widgets/widget.js");
		var rootWidget = new widget.widget({type: "widget", children: [{type: "widget", children: []}]},
			{wiki: wiki, document: $tw.document});
		rootWidget.makeChildWidgets();
		var anchorWidget = rootWidget.children[0];
		rootWidget.setVariable("varname", "(?i)suite");
		// (varname) gives its first value as the pattern; <varname> the single value.
		expect(wiki.filterTiddlers("[regexp:_cd-work(s)(varname)]", anchorWidget)).toEqual(["Alpha"]);
		expect(wiki.filterTiddlers("[regexp:_cd-work(s)<varname>]", anchorWidget)).toEqual(["Alpha"]);
	});

	it("should keep parentheses in multi segment suffixes such as search fields and flags", function() {
		// search has a two segment suffix: comma separated fields in suffixes[0], flags in
		// suffixes[1]. A paren field must survive before ":flags", before "," and mid name.
		expect($tw.wiki.parseFilter("[search:_cd-work(s):casesensitive[term]]")).toEqual(
			[ { prefix : "", operators : [ { operator : "search", suffix : "_cd-work(s):casesensitive", suffixes : [ [ "_cd-work(s)" ], [ "casesensitive" ] ], operands: [ { text:"term" } ] } ] } ]
		);
		expect($tw.wiki.parseFilter("[search:_cd-work(s),title[term]]")).toEqual(
			[ { prefix : "", operators : [ { operator : "search", suffix : "_cd-work(s),title", suffixes : [ [ "_cd-work(s)", "title" ] ], operands: [ { text:"term" } ] } ] } ]
		);
		expect($tw.wiki.parseFilter("[search:work(s)done:flags[x]]")).toEqual(
			[ { prefix : "", operators : [ { operator : "search", suffix : "work(s)done:flags", suffixes : [ [ "work(s)done" ], [ "flags" ] ], operands: [ { text:"x" } ] } ] } ]
		);
	});

	it("should match a field with parentheses in the middle of its name, via regexp and search", function() {
		// Hardest case end to end: parentheses mid name "work(s)done", via regexp and search.
		var wiki = new $tw.Wiki();
		wiki.addTiddler({title: "Alpha", "work(s)done": "My Test Suite"});
		wiki.addTiddler({title: "Beta", "work(s)done": "nothing relevant"});
		wiki.addTiddler({title: "Gamma", text: "Suite"});
		expect(wiki.filterTiddlers("[regexp:work(s)done[(?i)suite]]")).toEqual(["Alpha"]);
		expect(wiki.filterTiddlers("[search:work(s)done[suite]]")).toEqual(["Alpha"]);
	});

});
