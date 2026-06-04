/*\
title: test-filter-field-parens.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for field names containing parentheses used as filter operator suffixes,
for example "[regexp:_cd-work(s)[(?i)suite]]". See issue #9865.

\*/

"use strict";

describe("Filter operator suffixes containing parentheses (#9865)", function() {

	it("should keep a parenthesised field name as a single operator suffix", function() {
		// A field name like "_cd-work(s)" must survive as the operator suffix, not be
		// split apart by the round bracket operand syntax for multi value variables
		expect($tw.wiki.parseFilter("[regexp:_cd-work(s)[(?i)suite]]")).toEqual(
			[ { prefix : "", operators : [ { operator : "regexp", suffix : "_cd-work(s)", suffixes : [ [ "_cd-work(s)" ] ], operands: [ { text:"(?i)suite" } ] } ] } ]
		);
		// A parenthesised field name can still be followed by a variable or MVV operand
		expect($tw.wiki.parseFilter("[regexp:_cd-work(s)(varname)]")).toEqual(
			[ { prefix : "", operators : [ { operator : "regexp", suffix : "_cd-work(s)", suffixes : [ [ "_cd-work(s)" ] ], operands: [ { multiValuedVariable: true, text:"varname" } ] } ] } ]
		);
		expect($tw.wiki.parseFilter("[regexp:_cd-work(s)<varname>]")).toEqual(
			[ { prefix : "", operators : [ { operator : "regexp", suffix : "_cd-work(s)", suffixes : [ [ "_cd-work(s)" ] ], operands: [ { variable: true, text:"varname" } ] } ] } ]
		);
	});

	it("should keep multiple parenthesised groups in a field name as one suffix", function() {
		// A field name with consecutive groups like "_cd-work(s)(x)" stays whole, because
		// each group is followed by another operand bracket
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
		expect($tw.wiki.parseFilter("[(varname)sort[]]")).toEqual(
			[ { prefix : "", operators : [ { operator : "title", operands: [ { multiValuedVariable: true, text:"varname" } ] }, { operator : "sort", operands: [ { text:"" } ] } ] } ]
		);
	});

	it("should match a parenthesised field name with a literal operand", function() {
		var wiki = new $tw.Wiki();
		wiki.addTiddler({title: "Alpha", "_cd-work(s)": "My Test Suite"});
		wiki.addTiddler({title: "Beta", "_cd-work(s)": "nothing relevant"});
		wiki.addTiddler({title: "Gamma", text: "suite"});
		expect(wiki.filterTiddlers("[regexp:_cd-work(s)[(?i)suite]]")).toEqual(["Alpha"]);
	});

	it("should take the regexp pattern from a variable when the field name has parentheses", function() {
		var wiki = new $tw.Wiki();
		wiki.addTiddler({title: "Alpha", "_cd-work(s)": "My Test Suite"});
		wiki.addTiddler({title: "Beta", "_cd-work(s)": "nothing relevant"});
		var widget = require("$:/core/modules/widgets/widget.js");
		var rootWidget = new widget.widget({type: "widget", children: [{type: "widget", children: []}]},
			{wiki: wiki, document: $tw.document});
		rootWidget.makeChildWidgets();
		var anchorWidget = rootWidget.children[0];
		rootWidget.setVariable("varname", "(?i)suite");
		// The field name "_cd-work(s)" is the suffix; the pattern comes from the variable
		expect(wiki.filterTiddlers("[regexp:_cd-work(s)(varname)]", anchorWidget)).toEqual(["Alpha"]);
		expect(wiki.filterTiddlers("[regexp:_cd-work(s)<varname>]", anchorWidget)).toEqual(["Alpha"]);
	});

});
