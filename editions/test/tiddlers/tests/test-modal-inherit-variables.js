/*\
title: test-modal-inherit-variables.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the inheritvariables parameter of tm-modal, which gives the modal the
variables of the widget that sent the message.

\*/

"use strict";

describe("Modal inheritvariables", function() {

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
		pageWidget.setVariable("myProc","from a procedure <<myVar>>",[],false,{isProcedureDefinition: true});
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

	var body = "<<tv-config-toolbar-icons>>/<<myVar>>/<<myProc>>/<<currentTiddler>>";

	var pageVariables = {"tv-config-toolbar-icons": "yes", myVar: "outer", currentTiddler: "Caller"};

	it("should not see the caller's variables by default", function() {
		expect(displayModal(body,pageVariables)).toContain("///SampleModal");
	});

	it("should inherit the caller's variables when asked to", function() {
		expect(displayModal(body,pageVariables,{inheritvariables: "yes"})).toContain("yes/outer/from a procedure outer/SampleModal");
	});

	it("should let variables on the tm-modal message override inherited ones", function() {
		expect(displayModal(body,pageVariables,{inheritvariables: "true", myVar: "message"})).toContain("yes/message/from a procedure message/SampleModal");
	});

});
