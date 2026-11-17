/*\
title: test-modal-embedded.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the embedded parameter of tm-modal, which places the modal under the
widget that sent the message.

\*/

"use strict";

describe("Modal embedded", function() {

	var modal = require("$:/core/modules/utils/dom/modal.js"),
		navigator = require("$:/core/modules/widgets/navigator.js"),
		widget = require("$:/core/modules/widgets/widget.js");

	// fakedom has neither a window nor a body, and Modal.display uses both
	function createDocument() {
		var document = Object.create($tw.fakeDocument);
		document.body = document.createElement("body");
		document.defaultView = {innerHeight: 0, setTimeout: function() {}};
		return document;
	}

	function createPage(wiki,document) {
		var pageWidget = new widget.widget({type: "widget"},{wiki: wiki, document: document});
		pageWidget.setVariable("tv-config-toolbar-icons","yes");
		pageWidget.setVariable("myVar","outer");
		pageWidget.setVariable("currentTiddler","Caller");
		pageWidget.setVariable("myProc","from a procedure <<myVar>>",[],false,{isProcedureDefinition: true});
		pageWidget.receivedMessages = [];
		pageWidget.addEventListener("tm-test-message",function(event) {
			pageWidget.receivedMessages.push(event.type);
			return false;
		});
		return pageWidget;
	}

	function displayModal(messageVariables) {
		var wiki = $tw.test.wiki(),
			document = createDocument(),
			pageWidget = createPage(wiki,document),
			sender = new widget.widget({type: "widget"},{wiki: wiki, document: document, parentWidget: pageWidget});
		wiki.addTiddler({title: "SampleModal", text: "<<tv-config-toolbar-icons>>/<<myVar>>/<<myProc>>/<<currentTiddler>>"});
		spyOn(navigator.navigator.prototype,"render").and.callThrough();
		new modal.Modal(wiki).display("SampleModal",{
			variables: messageVariables || {},
			event: {
				widget: sender,
				event: {target: {ownerDocument: document}}
			}
		});
		var modalNavigator = navigator.navigator.prototype.render.calls.mostRecent().object;
		modalNavigator.dispatchEvent({type: "tm-test-message"});
		return {text: document.body.textContent, receivedMessages: pageWidget.receivedMessages};
	}

	it("should neither see the sender's variables nor pass messages to its ancestors by default", function() {
		var result = displayModal();
		expect(result.text).toContain("///SampleModal");
		expect(result.receivedMessages).toEqual([]);
	});

	it("should see the sender's variables and pass messages to its ancestors when embedded", function() {
		var result = displayModal({embedded: "yes"});
		expect(result.text).toContain("yes/outer/from a procedure outer/SampleModal");
		expect(result.receivedMessages).toEqual(["tm-test-message"]);
	});

	it("should let variables on the tm-modal message override the sender's", function() {
		expect(displayModal({embedded: "true", myVar: "message"}).text).toContain("yes/message/from a procedure message/SampleModal");
	});

});
