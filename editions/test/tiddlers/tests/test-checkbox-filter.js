/*\
title: test-checkbox-filter.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for the checkbox filter operator.

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("Checkbox filter operator", function() {

	var wiki;

	beforeEach(function() {
		wiki = new $tw.Wiki();
		wiki.addTiddler({title: "HasUnchecked",   text: "* [ ] Task A\n* [ ] Task B"});
		wiki.addTiddler({title: "HasChecked",     text: "* [x] Done"});
		wiki.addTiddler({title: "HasUpperChecked",text: "* [X] Also done"});
		wiki.addTiddler({title: "HasBoth",        text: "* [ ] Todo\n* [x] Done"});
		wiki.addTiddler({title: "HasNone",        text: "Just text, no checkboxes"});
		wiki.addTiddler({title: "EmptyText",      text: ""});
	});

	it("checkbox[] returns titles that contain any checkbox", function() {
		var result = wiki.filterTiddlers("[all[tiddlers]checkbox[]]").sort();
		expect(result).toEqual(["HasBoth","HasChecked","HasUnchecked","HasUpperChecked"].sort());
	});

	it("checkbox[checked] returns titles with at least one checked checkbox", function() {
		var result = wiki.filterTiddlers("[all[tiddlers]checkbox[checked]]").sort();
		expect(result).toEqual(["HasBoth","HasChecked","HasUpperChecked"].sort());
	});

	it("checkbox[unchecked] returns titles with at least one unchecked checkbox", function() {
		var result = wiki.filterTiddlers("[all[tiddlers]checkbox[unchecked]]").sort();
		expect(result).toEqual(["HasBoth","HasUnchecked"].sort());
	});

	it("!checkbox[] returns titles with no checkboxes", function() {
		var result = wiki.filterTiddlers("[all[tiddlers]!checkbox[]]").sort();
		expect(result).toEqual(["EmptyText","HasNone"].sort());
	});

	it("!checkbox[checked] returns titles with no checked checkboxes", function() {
		var result = wiki.filterTiddlers("[all[tiddlers]!checkbox[checked]]").sort();
		expect(result).toEqual(["EmptyText","HasNone","HasUnchecked"].sort());
	});

	it("!checkbox[unchecked] returns titles with no unchecked checkboxes", function() {
		var result = wiki.filterTiddlers("[all[tiddlers]!checkbox[unchecked]]").sort();
		// HasBoth contains [ ] so it IS excluded; HasChecked/HasUpperChecked/HasNone/EmptyText have no [ ]
		expect(result).toEqual(["EmptyText","HasChecked","HasNone","HasUpperChecked"].sort());
	});

	it("checkbox[] returns empty list when no tiddlers match", function() {
		var emptyWiki = new $tw.Wiki();
		emptyWiki.addTiddler({title: "PlainText", text: "nothing here"});
		var result = emptyWiki.filterTiddlers("[all[tiddlers]checkbox[]]");
		expect(result).toEqual([]);
	});

	it("works when composed with other operators", function() {
		// Only tiddlers that have unchecked items AND whose title starts with "Has"
		var result = wiki.filterTiddlers("[all[tiddlers]checkbox[unchecked]prefix[Has]]").sort();
		expect(result).toEqual(["HasBoth","HasUnchecked"].sort());
	});

	it("treats [X] (uppercase) as checked", function() {
		var result = wiki.filterTiddlers("[all[tiddlers]checkbox[checked]]");
		expect(result.indexOf("HasUpperChecked")).not.toBe(-1);
	});

	it("does not treat [X] (uppercase) as unchecked", function() {
		var result = wiki.filterTiddlers("[all[tiddlers]checkbox[unchecked]]");
		expect(result.indexOf("HasUpperChecked")).toBe(-1);
	});

	it("does not match [[WikiLinks]] as checkboxes", function() {
		var w = new $tw.Wiki();
		w.addTiddler({title: "WithLinks", text: "[[LinkTarget]] and [[Another]]"});
		var result = w.filterTiddlers("[all[tiddlers]checkbox[]]");
		expect(result).toEqual([]);
	});

});
