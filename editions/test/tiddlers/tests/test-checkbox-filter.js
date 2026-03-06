/*\
title: test-checkbox-filter.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for the checkbox filter operator. Runs the full suite both with
the CheckboxIndexer enabled and with all indexers disabled, to verify
both the indexed fast-path and the regex fallback.

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("Checkbox filter operator", function() {

	function setupWiki(wikiOptions) {
		const wiki = new $tw.Wiki(wikiOptions);
		wiki.addTiddler({title: "HasUnchecked",   text: "* [ ] Task A\n* [ ] Task B"});
		wiki.addTiddler({title: "HasChecked",     text: "* [x] Done"});
		wiki.addTiddler({title: "HasUpperChecked",text: "* [X] Also done"});
		wiki.addTiddler({title: "HasBoth",        text: "* [ ] Todo\n* [x] Done"});
		wiki.addTiddler({title: "HasNone",        text: "Just text, no checkboxes"});
		wiki.addTiddler({title: "EmptyText",      text: ""});
		return wiki;
	}

	function runTests(wiki) {

		it("checkbox[] returns titles that contain any checkbox", function() {
			const result = wiki.filterTiddlers("[all[tiddlers]checkbox[]]").sort();
			expect(result).toEqual(["HasBoth","HasChecked","HasUnchecked","HasUpperChecked"].sort());
		});

		it("checkbox[checked] returns titles with at least one checked checkbox", function() {
			const result = wiki.filterTiddlers("[all[tiddlers]checkbox[checked]]").sort();
			expect(result).toEqual(["HasBoth","HasChecked","HasUpperChecked"].sort());
		});

		it("checkbox[unchecked] returns titles with at least one unchecked checkbox", function() {
			const result = wiki.filterTiddlers("[all[tiddlers]checkbox[unchecked]]").sort();
			expect(result).toEqual(["HasBoth","HasUnchecked"].sort());
		});

		it("!checkbox[] returns titles with no checkboxes", function() {
			const result = wiki.filterTiddlers("[all[tiddlers]!checkbox[]]").sort();
			expect(result).toEqual(["EmptyText","HasNone"].sort());
		});

		it("!checkbox[checked] returns titles with no checked checkboxes", function() {
			const result = wiki.filterTiddlers("[all[tiddlers]!checkbox[checked]]").sort();
			expect(result).toEqual(["EmptyText","HasNone","HasUnchecked"].sort());
		});

		it("!checkbox[unchecked] returns titles with no unchecked checkboxes", function() {
			const result = wiki.filterTiddlers("[all[tiddlers]!checkbox[unchecked]]").sort();
			expect(result).toEqual(["EmptyText","HasChecked","HasNone","HasUpperChecked"].sort());
		});

		it("checkbox[] returns empty list when no tiddlers match", function() {
			const emptyWiki = new $tw.Wiki();
			emptyWiki.addTiddler({title: "PlainText", text: "nothing here"});
			const result = emptyWiki.filterTiddlers("[all[tiddlers]checkbox[]]");
			expect(result).toEqual([]);
		});

		it("works when composed with other operators", function() {
			const result = wiki.filterTiddlers("[all[tiddlers]checkbox[unchecked]prefix[Has]]").sort();
			expect(result).toEqual(["HasBoth","HasUnchecked"].sort());
		});

		it("treats [X] (uppercase) as checked", function() {
			const result = wiki.filterTiddlers("[all[tiddlers]checkbox[checked]]");
			expect(result.indexOf("HasUpperChecked")).not.toBe(-1);
		});

		it("does not treat [X] (uppercase) as unchecked", function() {
			const result = wiki.filterTiddlers("[all[tiddlers]checkbox[unchecked]]");
			expect(result.indexOf("HasUpperChecked")).toBe(-1);
		});

		it("does not match [[WikiLinks]] as checkboxes", function() {
			const w = new $tw.Wiki();
			w.addTiddler({title: "WithLinks", text: "[[LinkTarget]] and [[Another]]"});
			const result = w.filterTiddlers("[all[tiddlers]checkbox[]]");
			expect(result).toEqual([]);
		});

		// ── :text suffix tests ───────────────────────────────────────────────

		it("checkbox:text[] returns the text of every checkbox item", function() {
			const w = new $tw.Wiki();
			w.addTiddler({title: "Tasks", text: "* [ ] Buy milk\n* [x] Write code\n* [ ] Ship feature"});
			const result = w.filterTiddlers("[all[tiddlers]checkbox:text[]]").sort();
			expect(result).toEqual(["Buy milk","Ship feature","Write code"].sort());
		});

		it("checkbox:text[checked] returns text of checked items only", function() {
			const w = new $tw.Wiki();
			w.addTiddler({title: "Tasks", text: "* [ ] Buy milk\n* [x] Write code\n* [X] Also done"});
			const result = w.filterTiddlers("[all[tiddlers]checkbox:text[checked]]").sort();
			expect(result).toEqual(["Also done","Write code"].sort());
		});

		it("checkbox:text[unchecked] returns text of unchecked items only", function() {
			const w = new $tw.Wiki();
			w.addTiddler({title: "Tasks", text: "* [ ] Buy milk\n* [x] Write code\n* [ ] Ship feature"});
			const result = w.filterTiddlers("[all[tiddlers]checkbox:text[unchecked]]").sort();
			expect(result).toEqual(["Buy milk","Ship feature"].sort());
		});

		it("checkbox:text[] returns items from multiple tiddlers flattened", function() {
			const w = new $tw.Wiki();
			w.addTiddler({title: "Work",  text: "[ ] Review PR"});
			w.addTiddler({title: "Home",  text: "[ ] Buy groceries"});
			const result = w.filterTiddlers("[all[tiddlers]checkbox:text[unchecked]]").sort();
			expect(result).toEqual(["Buy groceries","Review PR"].sort());
		});

		it("checkbox:text[] strips leading/trailing whitespace from item text", function() {
			const w = new $tw.Wiki();
			w.addTiddler({title: "T", text: "[ ]   Spaced item   "});
			const result = w.filterTiddlers("[all[tiddlers]checkbox:text[]]");
			expect(result).toEqual(["Spaced item"]);
		});

		it("checkbox:text[] returns empty array when there are no matching checkboxes", function() {
			const w = new $tw.Wiki();
			w.addTiddler({title: "T", text: "[x] Done"});
			const result = w.filterTiddlers("[all[tiddlers]checkbox:text[unchecked]]");
			expect(result).toEqual([]);
		});

		it("index is updated when a tiddler is modified", function() {
			// Start with an unchecked checkbox
			wiki.addTiddler({title: "MutableTask", text: "[ ] pending"});
			let result = wiki.filterTiddlers("[all[tiddlers]checkbox[unchecked]]");
			expect(result.indexOf("MutableTask")).not.toBe(-1);

			// Simulate checking it
			wiki.addTiddler({title: "MutableTask", text: "[x] done"});
			result = wiki.filterTiddlers("[all[tiddlers]checkbox[unchecked]]");
			expect(result.indexOf("MutableTask")).toBe(-1);
			result = wiki.filterTiddlers("[all[tiddlers]checkbox[checked]]");
			expect(result.indexOf("MutableTask")).not.toBe(-1);

			// Remove checkboxes entirely
			wiki.addTiddler({title: "MutableTask", text: "no more checkboxes"});
			result = wiki.filterTiddlers("[all[tiddlers]checkbox[]]");
			expect(result.indexOf("MutableTask")).toBe(-1);

			// Clean up
			wiki.deleteTiddler("MutableTask");
		});

		it("index is updated when a tiddler is deleted", function() {
			wiki.addTiddler({title: "TempTask", text: "[ ] temp"});
			let result = wiki.filterTiddlers("[all[tiddlers]checkbox[]]");
			expect(result.indexOf("TempTask")).not.toBe(-1);

			wiki.deleteTiddler("TempTask");
			result = wiki.filterTiddlers("[all[tiddlers]checkbox[]]");
			expect(result.indexOf("TempTask")).toBe(-1);
		});
	}

	describe("With no indexers (regex fallback)", function() {
		const wiki = setupWiki({enableIndexers: []});
		it("should not have the CheckboxIndexer", function() {
			expect(wiki.getIndexer("CheckboxIndexer")).toBe(null);
		});
		runTests(wiki);
	});

	describe("With all indexers", function() {
		const wiki = setupWiki();
		it("should have the CheckboxIndexer", function() {
			expect(wiki.getIndexer("CheckboxIndexer")).not.toBe(null);
		});
		runTests(wiki);
	});

});
