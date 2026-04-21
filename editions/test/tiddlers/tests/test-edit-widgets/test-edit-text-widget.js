/*\
title: test-edit-text-widget.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Covers the `rows` / `autoHeight` / `minHeight` interaction in the
edit-text widget. Regression guard for issue #9451 / PR #9454 follow-up
fix (rows=1 autoHeight=yes must still grow).

Assertions target the routing inside SimpleEngine.fixHeight (which
branch runs, called with which minHeight) — pixel measurement needs a
real browser.

\*/

"use strict";

describe("Edit-text widget", function() {

	// Shared helpers live in $:/tests/test-edit-widgets/helpers. See that
	// file for what each helper prepares and where it is used across the suite.
	var helpers = require("$:/tests/test-edit-widgets/helpers");

	// Local wrapper: every test in THIS file seeds an empty "TestTiddler"
	// as its default binding target, so we inject that by default.
	function makeWiki(extraTiddlers) {
		return helpers.makeWiki(extraTiddlers,{seedTestTiddler: true});
	}

	// Local alias — `renderEditText` reads more naturally than
	// `helpers.renderFromAttrs` for the routing tests.
	function renderEditText(attrs,wiki,tiddlerTitle) {
		return helpers.renderFromAttrs(attrs,wiki,tiddlerTitle);
	}

	// ---------------------------------------------------------------
	// Attribute parsing
	// ---------------------------------------------------------------

	describe("attribute parsing", function() {

		// manual: on a bare <$edit-text tiddler="T"/>, open devtools and
		// inspect the widget instance — the element should be a textarea,
		// there should be no rows attribute, and auto-height should be on.
		// Manual Preview: Also use the widget-tree
		it("defaults: tag=textarea, autoHeight=yes, no rows, minHeight=100px", function() {
			var et = renderEditText({});
			expect(et.editTag).toBe("textarea");
			expect(et.editAutoHeight).toBe(true);
			expect(et.editRows).toBeUndefined();
			expect(et.editMinHeight).toBe("100px");
		});

		// manual: render <$edit-text tiddler="T" rows=5 autoHeight="no" minHeight="1em"/>
		// — the widget's internal state should reflect all three explicit
		// values, overriding the defaults verified in the previous test.
		// Manual Preview: Also use the widget-tree
		it("explicit attributes override defaults (rows, autoHeight, minHeight)", function() {
			var et = renderEditText({rows: "5", autoHeight: "no", minHeight: "1em"});
			expect(et.editRows).toBe("5");
			expect(et.editAutoHeight).toBe(false);
			expect(et.editMinHeight).toBe("1em");
		});

		// manual: render <$edit-text tiddler="T" field="caption" tag="textarea"/>
		// — the element should be a multi-line textarea even though the
		// field is not `text`.
		it("tag=textarea override applies to non-text fields", function() {
			var et = renderEditText({field: "caption", tag: "textarea"});
			expect(et.editTag).toBe("textarea");
		});

		// manual: set $:/config/TextEditor/EditorHeight/Mode = "fixed"
		// (via control panel → settings → editor toolbar, or edit the
		// tiddler directly). <$edit-text tiddler="T"/> should now behave
		// as fixed-height (scrollbar on overflow) by default.
		it("$:/config/TextEditor/EditorHeight/Mode=fixed flips default autoHeight to false", function() {
			var wiki = makeWiki([
				{title: "$:/config/TextEditor/EditorHeight/Mode", text: "fixed"}
			]);
			var et = renderEditText({},wiki);
			expect(et.editAutoHeight).toBe(false);
		});

		// manual: with the same Mode=fixed config as above, an explicit
		// <$edit-text tiddler="T" autoHeight="yes"/> should still auto-grow
		// — the per-widget attribute wins over the global config.
		it("explicit autoHeight=yes overrides Mode=fixed config", function() {
			var wiki = makeWiki([
				{title: "$:/config/TextEditor/EditorHeight/Mode", text: "fixed"}
			]);
			var et = renderEditText({autoHeight: "yes"},wiki);
			expect(et.editAutoHeight).toBe(true);
		});
	});

	// ---------------------------------------------------------------
	// DOM node construction (SimpleEngine)
	// ---------------------------------------------------------------

	describe("DOM node construction (non-toolbar SimpleEngine)", function() {

		// manual: render <$edit-text tiddler="T" rows=1/> and inspect the
		// element — it should carry rows="1". Proves SimpleEngine copies
		// widget.editRows onto the DOM element.
		it("sets the rows attribute on the DOM node when rows is specified", function() {
			var et = renderEditText({rows: "1"});
			expect(et.engine.domNode.getAttribute("rows")).toBe("1");
		});
	});

	// ---------------------------------------------------------------
	// fixHeight routing — the core of the fix
	// ---------------------------------------------------------------

	describe("fixHeight routing", function() {

		var originalResize, resizeSpy;

		beforeEach(function() {
			originalResize = $tw.utils.resizeTextAreaToFit;
			resizeSpy = jasmine.createSpy("resizeTextAreaToFit").and.returnValue(0);
			$tw.utils.resizeTextAreaToFit = resizeSpy;
		});

		afterEach(function() {
			$tw.utils.resizeTextAreaToFit = originalResize;
		});

		// Make the SimpleEngine.fixHeight think we are in a real DOM so it
		// actually reaches the $tw.utils.resizeTextAreaToFit call. Without
		// this the engine short-circuits because fakedom nodes carry
		// isTiddlyWikiFakeDom === true.
		function callFixHeight(et) {
			et.engine.domNode.isTiddlyWikiFakeDom = false;
			et.engine.fixHeight();
		}

		// manual: render <$edit-text tiddler="T" rows=1 autoHeight=yes minHeight=1em/>
		// (the TiddlyTools idiom). In 5.4.0 pre-fix, the textarea stayed
		// a single row forever; after the fix, it starts at 1 row and
		// grows as you type newlines. This covers BRANCH A (autoHeight=yes)
		// of SimpleEngine.fixHeight: resize is called with minHeight even
		// when rows is set. Strict superset of the no-rows baseline.
		it("rows=1 autoHeight=yes minHeight=1em still calls resize (regression test for the PR #9454 follow-up fix)", function() {
			var et = renderEditText({rows: "1", autoHeight: "yes", minHeight: "1em"});
			callFixHeight(et);
			expect(resizeSpy).toHaveBeenCalled();
			expect(resizeSpy.calls.mostRecent().args[1]).toBe("1em");
		});

		// manual: render <$edit-text tiddler="T" rows=5 autoHeight=no/> —
		// the textarea must stay locked at exactly 5 rows tall, even if
		// you paste in 50 lines (vertical scrollbar appears inside).
		it("rows=5 autoHeight=no does NOT call resize and does NOT apply the fixed-height fallback", function() {
			var et = renderEditText({rows: "5", autoHeight: "no"});
			callFixHeight(et);
			expect(resizeSpy).not.toHaveBeenCalled();
			// rows attribute governs height — CSS height must remain unset
			expect(et.engine.domNode.style.height).toBe("");
		});

		// manual: set $:/config/TextEditor/EditorHeight/Height = "250px",
		// then render <$edit-text tiddler="T" autoHeight="no"/> — the
		// textarea should be exactly 250px tall regardless of content.
		it("autoHeight=no with no rows applies the fixed-height fallback from config", function() {
			var wiki = makeWiki([
				{title: "$:/config/TextEditor/EditorHeight/Height", text: "250px"}
			]);
			var et = renderEditText({autoHeight: "no"},wiki);
			callFixHeight(et);
			expect(resizeSpy).not.toHaveBeenCalled();
			expect(et.engine.domNode.style.height).toBe("250px");
		});

		// manual: set $:/config/TextEditor/EditorHeight/Height = "5px",
		// render <$edit-text tiddler="T" autoHeight="no"/> — the textarea
		// should be 20px tall (clamped), not a sliver, so it stays usable.
		it("autoHeight=no fallback height is clamped to at least 20px", function() {
			var wiki = makeWiki([
				{title: "$:/config/TextEditor/EditorHeight/Height", text: "5px"}
			]);
			var et = renderEditText({autoHeight: "no"},wiki);
			callFixHeight(et);
			expect(et.engine.domNode.style.height).toBe("20px");
		});

		// manual: render <$edit-text tiddler="T" field="caption" autoHeight="no"/>
		// — the element is a single-line <input> and the CSS height should
		// remain unset (no height fallback applies to inputs).
		it("tag=input: neither resize nor fixed-height fallback runs", function() {
			var et = renderEditText({field: "caption", autoHeight: "no"});
			callFixHeight(et);
			expect(resizeSpy).not.toHaveBeenCalled();
			expect(et.engine.domNode.style.height).toBe("");
		});
	});
});
