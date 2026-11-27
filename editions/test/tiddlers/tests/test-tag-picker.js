/*\
title: test-tag-picker.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Covers what focussing a tag-picker input does to the popup stack: the
cancelPopups parameter itself, and the two core callers that rely on
opposite settings.

Guards issue #9995. The tag-picker macro forced cancelPopups="yes" onto
its input, so focussing the tag input in $:/Manager ran
$tw.popup.cancel(0) and dropped the popup that reveals the Manager panel
itself: the panel collapsed and the tag dropdown never appeared.

Real focus events need a browser, but SimpleEngine.handleFocusEvent is a
plain method and $tw.popup is a plain object, so the popup calls a focus
would make are observable in fakedom.

manual: open $:/Manager, expand any tiddler, click into the "add tag"
input. The panel must stay open and the tag dropdown must appear. Repeat
in a tiddler's edit template, where focussing the tag input must still
close any other open dropdown.

\*/

"use strict";

describe("tag-picker macro (popup handling on focus)", function() {

	var findEditTextWidget = require("$:/tests/test-edit-widgets/helpers").findEditTextWidget;

	var SNIPPET_TITLE = "$:/temp/test/tag-picker-spec";

	var savedPopup;

	beforeEach(function() {
		savedPopup = $tw.popup;
	});

	afterEach(function() {
		$tw.popup = savedPopup;
	});

	// Render a tiddler and focus its tag input, returning the popup calls that
	// focus produced. The core UI tiddlers under test are shadows, so this uses
	// the test edition's own wiki rather than a bare $tw.test.wiki().
	function popupCallsOnFocus(title) {
		var widgetNode = $tw.wiki.makeTranscludeWidget(title,{
				document: $tw.fakeDocument,
				importPageMacros: true,
				variables: {currentTiddler: "TestTiddler"}
			}),
			calls = [];
		widgetNode.render($tw.fakeDocument.createElement("div"),null);
		$tw.popup = {
			cancel: function(level) { calls.push("cancel(" + level + ")"); },
			triggerPopup: function() { calls.push("triggerPopup"); }
		};
		findEditTextWidget(widgetNode).engine.handleFocusEvent({type: "focus"});
		return calls;
	}

	// The macro needs the global macro scope, which only reaches a tiddler, so a
	// snippet is parked in one for the duration of a single spec.
	function popupCallsForSnippet(snippet) {
		$tw.wiki.addTiddler({title: SNIPPET_TITLE, text: snippet});
		try {
			return popupCallsOnFocus(SNIPPET_TITLE);
		} finally{
			$tw.wiki.deleteTiddler(SNIPPET_TITLE);
		}
	}

	describe("the cancelPopups parameter", function() {

		// manual: <<tag-picker>> in a tiddler, open any other dropdown, then
		// click the tag input — the other dropdown closes.
		it("closes open popups by default", function() {
			expect(popupCallsForSnippet("<<tag-picker>>")).toEqual(["cancel(0)","triggerPopup"]);
		});

		// manual: as above with <<tag-picker cancelPopups:"no">> — the other
		// dropdown stays open and the tag dropdown appears alongside it.
		it("leaves open popups alone when set to no", function() {
			expect(popupCallsForSnippet('<<tag-picker cancelPopups:"no">>')).toEqual(["triggerPopup"]);
		});

	});

	describe("core callers", function() {

		it("opens the dropdown without cancelling popups in $:/Manager", function() {
			expect(popupCallsOnFocus("$:/Manager/ItemSidebar/Tags")).toEqual(["triggerPopup"]);
		});

		it("still cancels other popups in the edit template", function() {
			expect(popupCallsOnFocus("$:/core/ui/EditTemplate/tags")).toEqual(["cancel(0)","triggerPopup"]);
		});

	});

});
