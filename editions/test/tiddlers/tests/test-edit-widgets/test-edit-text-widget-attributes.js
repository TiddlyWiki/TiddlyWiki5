/*\
title: test-edit-text-widget-attributes.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Covers edit-text widget behaviour that is observable in fakedom: value
resolution, tag/type selection, DOM attribute propagation, save-back
and refresh paths.

Each spec has a "manual:" comment with a by-hand recipe so a reviewer
can sanity-check the test against a live wiki.

NOT covered (need a real browser — Playwright territory):
* `focus`, `focusSelectFromStart`/`End`, `focusPopup`, `cancelPopups` — real DOM focus + selection APIs
* `inputActions`, `fileDrop` — synthetic events not dispatched by fakedom
* Pixel measurement / growth of auto-height textareas — `$tw.utils.resizeTextAreaToFit` needs real layout
* FramedEngine — requires a real iframe document

\*/

"use strict";

describe("Edit-text widget (attribute propagation and value handling)", function() {

	// Shared helpers live in $:/tests/test-edit-widgets/helpers. See that
	// file for what each helper prepares and where it is used across the suite.
	var helpers = require("$:/tests/test-edit-widgets/helpers");

	// Local aliases — `render`, `editorValue` etc. read better inline
	// than `helpers.renderFromWikitext`. Each test supplies its own
	// tiddlers, so makeWiki is NOT seeded with TestTiddler here.
	var makeWiki = helpers.makeWiki;
	var render = helpers.renderFromWikitext;
	var refresh = helpers.refresh;
	var editorValue = helpers.editorValue;
	var findEditTextWidget = helpers.findEditTextWidget;

	// spyOnSetText stays file-local because it depends on `jasmine`,
	// which is only in scope for $:/tags/test-spec modules — NOT for
	// library modules loaded via require().
	function spyOnSetText(w) {
		var spy = jasmine.createSpy("setText");
		w.engine.setText = spy;
		return spy;
	}

	// ---------------------------------------------------------------
	// Value and type resolution (getEditInfo)
	// ---------------------------------------------------------------

	describe("value and type resolution", function() {

		// manual: create tiddler "TestTiddler" with text "hello", then in any
		// tiddler render <$edit-text tiddler='TestTiddler'/> — the
		// textarea should show "hello".
		it("reads the text field of an existing tiddler", function() {
			var w = render("<$edit-text tiddler=\"TestTiddler\"/>");
			expect(editorValue(w.widget)).toBe("hello");
		});

		// manual: give a tiddler "T" a caption="Hi" field, then render
		// <$edit-text tiddler="T" field="caption"/> — input should show "Hi".
		it("reads an arbitrary named field", function() {
			var wiki = makeWiki([{title: "T", text: "body", caption: "Hi"}]);
			var w = render("<$edit-text tiddler=\"T\" field=\"caption\"/>",wiki);
			expect(editorValue(w.widget)).toBe("Hi");
		});

		// manual: create tiddler "T" without a caption field, then render
		// <$edit-text tiddler="T" field="caption" default="fallback"/> —
		// input should show "fallback".
		it("falls back to the default attribute when the field is missing", function() {
			var wiki = makeWiki([{title: "T", text: "body"}]);
			var w = render("<$edit-text tiddler=\"T\" field=\"caption\" default=\"fallback\"/>",wiki);
			expect(editorValue(w.widget)).toBe("fallback");
		});

		// manual: create tiddler "T" without a caption field, render
		// <$edit-text tiddler="T" field="caption"/> — input should be empty.
		it("falls back to an empty string when neither field nor default is present", function() {
			var wiki = makeWiki([{title: "T", text: "body"}]);
			var w = render("<$edit-text tiddler=\"T\" field=\"caption\"/>",wiki);
			expect(editorValue(w.widget)).toBe("");
		});

		// manual: ensure NO tiddler named "Missing" exists, then render
		// <$edit-text tiddler="Missing" field="title"/> — input should show
		// "Missing" (the title field of a not-yet-existing tiddler defaults
		// to the tiddler title).
		it("uses the tiddler title as the default for the title field on missing tiddlers", function() {
			var wiki = makeWiki();
			var w = render("<$edit-text tiddler=\"Missing\" field=\"title\"/>",wiki);
			expect(editorValue(w.widget)).toBe("Missing");
		});

		// manual: ensure NO tiddler named "Missing" exists, then render
		// <$edit-text tiddler="Missing" default="seed"/> — textarea should
		// show "seed" until you type into it.
		it("uses default= on a missing tiddler", function() {
			var wiki = makeWiki();
			var w = render("<$edit-text tiddler=\"Missing\" default=\"seed\"/>",wiki);
			expect(editorValue(w.widget)).toBe("seed");
		});

		// manual: create a data tiddler "Data" with type
		// "application/x-tiddler-dictionary" and text "one: 1\ntwo: 2",
		// then render <$edit-text tiddler="Data" index="two"/> — input
		// should show "2".
		it("reads a value from a data tiddler index", function() {
			var wiki = makeWiki([
				{title: "Data", type: "application/x-tiddler-dictionary", text: "one: 1\ntwo: 2"}
			]);
			var w = render("<$edit-text tiddler=\"Data\" index=\"two\"/>",wiki);
			expect(editorValue(w.widget)).toBe("2");
		});

		// manual: with the same "Data" dictionary but no "missing" key,
		// render <$edit-text tiddler="Data" index="missing" default="none"/> —
		// input should show "none".
		it("uses default= for a missing index", function() {
			var wiki = makeWiki([
				{title: "Data", type: "application/x-tiddler-dictionary", text: "one: 1"}
			]);
			var w = render("<$edit-text tiddler=\"Data\" index=\"missing\" default=\"none\"/>",wiki);
			expect(editorValue(w.widget)).toBe("none");
		});
	});

	// ---------------------------------------------------------------
	// Tag and type selection
	// ---------------------------------------------------------------

	describe("tag and type selection", function() {

		// manual: render <$edit-text tiddler="TestTiddler"/> and inspect the
		// element — it should be a <textarea>.
		it("defaults to a textarea for the text field", function() {
			var w = render("<$edit-text tiddler=\"TestTiddler\"/>");
			expect(w.widget.engine.domNode.tag).toBe("textarea");
		});

		// manual: render <$edit-text tiddler="TestTiddler" field="caption"/>
		// and inspect the element — it should be a single-line <input>.
		it("defaults to an input for non-text fields", function() {
			var w = render("<$edit-text tiddler=\"TestTiddler\" field=\"caption\"/>");
			expect(w.widget.engine.domNode.tag).toBe("input");
		});

		// manual: render <$edit-text tiddler="TestTiddler" tag="input"/> —
		// even though the default for the text field is textarea, this
		// should render as a single-line <input>.
		it("tag=input forces an input even for the text field", function() {
			var w = render("<$edit-text tiddler=\"TestTiddler\" tag=\"input\"/>");
			expect(w.widget.engine.domNode.tag).toBe("input");
		});

		// manual: render <$edit-text tiddler="T" tag="input" type="password"/>
		// — the element should be a password input (characters masked as dots).
		it("type= sets the input type attribute", function() {
			var w = render("<$edit-text tiddler=\"TestTiddler\" tag=\"input\" type=\"password\"/>");
			expect(w.widget.engine.domNode.getAttribute("type")).toBe("password");
		});

		// manual: render <$edit-text tiddler="T" type="password"/> (no tag
		// override) — the element should be a plain textarea; type is
		// silently ignored because HTML textareas have no type attribute.
		it("type= is ignored for textareas (no type attribute on textarea)", function() {
			var w = render("<$edit-text tiddler=\"TestTiddler\" type=\"password\"/>");
			expect(w.widget.engine.domNode.getAttribute("type")).toBeUndefined();
		});

		// manual: render <$edit-text tiddler="T" tag="script"/> — must NOT
		// inject a <script> element; tag should fall back to <input>. This
		// is a defence-in-depth check against wiki-authored HTML injection.
		it("unsafe tag names collapse to input", function() {
			var w = render("<$edit-text tiddler=\"TestTiddler\" tag=\"script\"/>");
			expect(w.widget.engine.domNode.tag).toBe("input");
		});
	});

	// ---------------------------------------------------------------
	// DOM attribute propagation
	// ---------------------------------------------------------------

	describe("DOM attribute propagation", function() {

		// manual: render <$edit-text tiddler="TestTiddler" tag="input"
		// class="my-class" placeholder="Type here" size="40" tabindex="3"
		// autocomplete="email" disabled="yes"/> — inspect the element in
		// devtools; every attribute set on the widget should appear on
		// the DOM element with the expected value. disabled="no" would
		// omit the attribute entirely.
		//
		// INFO: View as "raw HTML" in preview panel
		//
		// SimpleEngine has one independent `if(this.widget.editXxx)
		// setAttribute(...)` block per attribute. This combined test
		// exercises every such block in one shot; if any copy breaks,
		// this spec fails and the jasmine expectation report identifies
		// the offending attribute.
		it("copies class, placeholder, size, tabindex, autocomplete and disabled onto the DOM element", function() {
			var w = render(
				"<$edit-text tiddler=\"TestTiddler\" tag=\"input\" " +
				"class=\"my-class\" placeholder=\"Type here\" size=\"40\" " +
				"tabindex=\"3\" autocomplete=\"email\" disabled=\"yes\"/>"
			);
			var dn = w.widget.engine.domNode;
			expect(dn.className).toBe("my-class");
			expect(dn.getAttribute("placeholder")).toBe("Type here");
			expect(dn.getAttribute("size")).toBe("40");
			expect(dn.getAttribute("tabindex")).toBe("3");
			expect(dn.getAttribute("autocomplete")).toBe("email");
			expect(dn.getAttribute("disabled")).toBe("true");
		});

	});

	// ---------------------------------------------------------------
	// Save-back via saveChanges
	// ---------------------------------------------------------------

	describe("saving changes back to the store", function() {

		// manual: with tiddler "T" text="old", render <$edit-text tiddler="T"/>
		// and type "new text"; open T from the sidebar — its text field
		// should update live.
		it("writes a new value to the configured text field", function() {
			var wiki = makeWiki([{title: "T", text: "old"}]);
			var w = render("<$edit-text tiddler=\"T\"/>",wiki);
			w.widget.saveChanges("new text");
			expect(wiki.getTiddler("T").fields.text).toBe("new text");
		});

		// manual: with tiddler "T" caption="old", render
		// <$edit-text tiddler="T" field="caption"/> and type a new caption;
		// {{T!!caption}} elsewhere should update live.
		it("writes to a non-text field", function() {
			var wiki = makeWiki([{title: "T", text: "body", caption: "old"}]);
			var w = render("<$edit-text tiddler=\"T\" field=\"caption\"/>",wiki);
			w.widget.saveChanges("new caption");
			expect(wiki.getTiddler("T").fields.caption).toBe("new caption");
		});

		// manual: ensure no tiddler "NewOne" exists, render
		// <$edit-text tiddler="NewOne" default=""/> and type "created" —
		// a new tiddler "NewOne" should appear in the sidebar with that
		// text.
		it("creates the tiddler if it does not exist", function() {
			var wiki = makeWiki();
			var w = render("<$edit-text tiddler=\"NewOne\" default=\"\"/>",wiki);
			w.widget.saveChanges("created");
			expect(wiki.tiddlerExists("NewOne")).toBe(true);
			expect(wiki.getTiddler("NewOne").fields.text).toBe("created");
		});

		// manual: with dictionary tiddler "Data" containing one:1, two:2,
		// render <$edit-text tiddler="Data" index="one"/> and change the
		// value to "uno"; view Data as text — it should now read
		// "one: uno\ntwo: 2".
		it("writes to a data tiddler index", function() {
			var wiki = makeWiki([
				{title: "Data", type: "application/x-tiddler-dictionary", text: "one: 1\ntwo: 2"}
			]);
			var w = render("<$edit-text tiddler=\"Data\" index=\"one\"/>",wiki);
			w.widget.saveChanges("uno");
			expect(wiki.extractTiddlerDataItem("Data","one")).toBe("uno");
			// Other index entries preserved
			expect(wiki.extractTiddlerDataItem("Data","two")).toBe("2");
		});

		// manual: Select the text. Copy / Paste -> modified does not change
		it("skips the store update when the value is unchanged", function() {
			var wiki = makeWiki([{title: "T", text: "same"}]);
			var before = wiki.getTiddler("T").fields.modified;
			var w = render("<$edit-text tiddler=\"T\"/>",wiki);
			w.widget.saveChanges("same");
			expect(wiki.getTiddler("T").fields.modified).toBe(before);
		});
	});

	// ---------------------------------------------------------------
	// Refresh behaviour
	// ---------------------------------------------------------------

	describe("refresh behaviour", function() {

		// manual: render <$edit-text tiddler="T"/>, in New Tiddler and New Tiddler 1
		// The textarea you are NOT focused on
		// should live-update to reflect the new text field.
		it("propagates an external change of the edited tiddler through engine.setText", function() {
			var wiki = makeWiki([{title: "T", text: "first"}]);
			var w = render("<$edit-text tiddler=\"T\"/>",wiki);
			expect(editorValue(w.widget)).toBe("first");
			var setTextSpy = spyOnSetText(w.widget);
			wiki.addTiddler({title: "T", text: "second"});
			refresh(w.root,w.wrapper,["T"]);
			expect(setTextSpy).toHaveBeenCalled();
			expect(setTextSpy.calls.mostRecent().args[0]).toBe("second");
		});

		// manual:
		// 1. Create tiddlers T (text "initial") and Trigger (text "x").
		// 2. Render <$edit-text tiddler="T" refreshTitle="Trigger"/>.
		// 3. Click into the textarea (it now has focus) and type " typed".
		// 4. Open F12, in console:
		//      $tw.wiki.addTiddler({title:"T",text:"external"})
		//    Focus stays on textarea. Store changes, but setText skips
		//    the DOM write because the node is focused — DOM diverges
		//    from store (textarea still shows "initial typed").
		// 5. In console:
		//      $tw.wiki.addTiddler({title:"Trigger",text:"bump"})
		//    Textarea should VISIBLY flip to "external" while still
		//    focused. updateDomNodeText has no focus check.
		// Without refreshTitle, step 5 does nothing — DOM stays diverged.
		it("refreshTitle triggers updateDomNodeText even when a different tiddler changes", function() {
			var wiki = makeWiki([
				{title: "T", text: "first"},
				{title: "Trigger", text: "x"}
			]);
			var w = render("<$edit-text tiddler=\"T\" refreshTitle=\"Trigger\"/>",wiki);
			// refreshTitle goes through engine.updateDomNodeText, not setText
			var updateSpy = jasmine.createSpy("updateDomNodeText");
			w.widget.engine.updateDomNodeText = updateSpy;
			wiki.addTiddler({title: "T", text: "updated"});
			refresh(w.root,w.wrapper,["Trigger"]);
			expect(updateSpy).toHaveBeenCalledWith("updated");
		});

		// manual: render <$edit-text tiddler="T" class={{ClassSrc}}/> and
		// change ClassSrc's text. Inspect the textarea element in devtools
		// — the class attribute should flip to the new value. This covers
		// a full re-render (refreshSelf), not just an in-place text update.
		it("changes to attributes that require a full rerender trigger refreshSelf", function() {
			// When an attribute like `class` changes via a transcluded variable,
			// the widget should rerender itself. We simulate that by wrapping the
			// edit-text inside a transclusion where the class is indirect.
			var wiki = makeWiki([
				{title: "T", text: "body"},
				{title: "ClassSrc", text: "first-class"}
			]);
			var w = render(
				"<$edit-text tiddler=\"T\" class={{ClassSrc}}/>",
				wiki
			);
			expect(w.widget.engine.domNode.className).toBe("first-class");
			wiki.addTiddler({title: "ClassSrc", text: "second-class"});
			refresh(w.root,w.wrapper,["ClassSrc"]);
			// Re-locate the widget because a full refresh creates a new instance
			var fresh = findEditTextWidget(w.root);
			expect(fresh.engine.domNode.className).toBe("second-class");
		});
	});
});
