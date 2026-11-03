/*\
title: test-modal-toolbar-variables.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests that a modal inherits the toolbar variables of the widget that opened it.
A modal is rendered outside of the page template, which is where they are set.

\*/

"use strict";

describe("Modal toolbar variables", function() {

	var modal = require("$:/core/modules/utils/dom/modal.js"),
		widget = require("$:/core/modules/widgets/widget.js");

	// fakedom has neither a window nor a body, and Modal.display uses both
	function createDocument() {
		var document = Object.create($tw.fakeDocument);
		document.body = document.createElement("body");
		document.defaultView = {innerHeight: 0, setTimeout: function() {}};
		return document;
	}

	function createOpeningWidget(wiki,document,variables) {
		var pageWidget = new widget.widget({type: "widget"},{wiki: wiki, document: document});
		$tw.utils.each(variables,function(value,name) {
			pageWidget.setVariable(name,value);
		});
		return new widget.widget({type: "widget"},{wiki: wiki, document: document, parentWidget: pageWidget});
	}

	function displayModal(text,pageVariables,messageVariables) {
		var wiki = $tw.test.wiki(),
			document = createDocument();
		wiki.addTiddler({title: "SampleModal", text: text});
		new modal.Modal(wiki).display("SampleModal",{
			variables: messageVariables || {},
			event: {
				widget: createOpeningWidget(wiki,document,pageVariables),
				event: {target: {ownerDocument: document}}
			}
		});
		return document.body.textContent;
	}

	var body = "<<tv-config-toolbar-icons>>/<<tv-config-toolbar-text>>/<<tv-config-toolbar-class>>";

	it("should pass the toolbar variables of the opening widget to the modal", function() {
		expect(displayModal(body,{
			"tv-config-toolbar-icons": "yes",
			"tv-config-toolbar-text": "no",
			"tv-config-toolbar-class": "tc-btn-invisible"
		})).toContain("yes/no/tc-btn-invisible");
	});

	it("should let variables on the tm-modal message override them", function() {
		expect(displayModal(body,{
			"tv-config-toolbar-icons": "yes",
			"tv-config-toolbar-text": "no",
			"tv-config-toolbar-class": "tc-btn-invisible"
		},{
			"tv-config-toolbar-text": "yes"
		})).toContain("yes/yes/tc-btn-invisible");
	});

	it("should render when the opening widget has no toolbar variables", function() {
		expect(displayModal("Some text",{})).toContain("Some text");
	});

});
