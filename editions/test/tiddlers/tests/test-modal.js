/*\
title: test-modal.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Regression tests for #10001 (https://github.com/TiddlyWiki/TiddlyWiki5/issues/10001):
navigation and renaming from within a modal.

A modal builds its own navigator and handles the navigator messages itself, so
the page navigator never sees them and the settings it carries have to be
repeated on the modal navigator.

To replicate by hand at https://tiddlywiki.com: set
$:/config/Navigation/openLinkFromOutsideRiver to "bottom", open the modal in
"WidgetMessage: tm-modal", and click a button holding
<$action-navigate $to="Learning"/>. "Learning" should arrive at the bottom of
the story river. For the rename, tick "Update tags and lists" in the edit
template of a tiddler shown in a modal, rename it, and check that a tiddler
tagged with the old title now carries the new one.

\*/

"use strict";

describe("Modal navigation (#10001)", function() {

	var modal = require("$:/core/modules/utils/dom/modal.js"),
		widget = require("$:/core/modules/widgets/widget.js");

	// Test scaffolding: fakedom is a shared object with neither a window nor a body, both of which Modal.display uses
	function createDocument() {
		var document = Object.create($tw.fakeDocument);
		document.body = document.createElement("body");
		document.defaultView = {innerHeight: 0, setTimeout: function() {}};
		return document;
	}

	// A modal inherits the story it navigates into from the widget that opened it, standing in here for a button in the story river
	function createOpeningWidget(wiki,document) {
		var pageWidget = new widget.widget({type: "widget"},{wiki: wiki, document: document});
		// A widget reads variables from its parent, so the story has to be set one level up, as the page navigator does
		pageWidget.setVariable("tv-story-list","$:/StoryList");
		pageWidget.setVariable("tv-history-list","$:/HistoryList");
		return new widget.widget({type: "widget"},{wiki: wiki, document: document, parentWidget: pageWidget});
	}

	// Returns the widget rendering the modal body, whose parent is the modal's own navigator
	function displayModal(wiki,title,document,openingWidget) {
		var bodyWidget = null,
			makeTranscludeWidget = wiki.makeTranscludeWidget;
		// The header and footer transclusions name a field, the body one does not
		wiki.makeTranscludeWidget = function(title,options) {
			var widgetNode = makeTranscludeWidget.apply(this,arguments);
			if(!options.field) {
				bodyWidget = widgetNode;
			}
			return widgetNode;
		};
		try {
			new modal.Modal(wiki).display(title,{
				variables: {},
				event: {widget: openingWidget, event: {target: {ownerDocument: document}}}
			});
		} finally{
			delete wiki.makeTranscludeWidget;
		}
		return bodyWidget;
	}

	it("should honour openLinkFromOutsideRiver when navigating from a modal", function() {
		var wiki = $tw.test.wiki();
		wiki.addTiddlers([
			{title: "$:/config/Navigation/openLinkFromOutsideRiver", text: "bottom"},
			{title: "$:/StoryList", list: ["TiddlerOne","TiddlerTwo"]},
			{title: "SampleModal", text: "<$button>Open Learning</$button>"},
			{title: "Learning", text: "Learning"}
		]);
		var document = createDocument(),
			bodyWidget = displayModal(wiki,"SampleModal",document,createOpeningWidget(wiki,document));

		bodyWidget.dispatchEvent({type: "tm-navigate", navigateTo: "Learning"});

		expect(wiki.getTiddlerList("$:/StoryList")).toEqual(["TiddlerOne","TiddlerTwo","Learning"]);
	});

	it("should honour relinkOnRename when renaming from a modal", function() {
		var wiki = $tw.test.wiki();
		wiki.addTiddlers([
			{title: "$:/config/RelinkOnRename", text: "yes"},
			{title: "$:/StoryList", list: ["Draft of 'OldTitle'"]},
			{title: "OldTitle", text: "Original"},
			{title: "Tagger", tags: ["OldTitle"]},
			{title: "Draft of 'OldTitle'", "draft.of": "OldTitle", "draft.title": "NewTitle", text: "Edited"},
			{title: "SampleModal", text: "<$button>Save</$button>"}
		]);
		var document = createDocument(),
			bodyWidget = displayModal(wiki,"SampleModal",document,createOpeningWidget(wiki,document)),
			rootWidget = $tw.rootWidget;
		// Saving triggers an autosave on the root widget, which only exists in the browser
		$tw.rootWidget = {dispatchEvent: function() {}};
		try {
			// The empty view stands in for the window the navigator would ask to confirm an overwrite
			bodyWidget.dispatchEvent({type: "tm-save-tiddler", param: "Draft of 'OldTitle'", event: {view: {}}});
		} finally{
			$tw.rootWidget = rootWidget;
		}

		expect(wiki.getTiddler("NewTitle").fields.text).toBe("Edited");
		expect(wiki.getTiddler("Tagger").fields.tags).toEqual(["NewTitle"]);
	});

});
