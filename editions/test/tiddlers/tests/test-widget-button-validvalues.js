/*\
title: test-widget-button-validvalues.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the button widget's validValues attribute for state validation.

\*/

"use strict";

describe("Button widget validValues tests", function() {

	var widget = require("$:/core/modules/widgets/widget.js");

	function createWidgetNode(parseTreeNode,wiki) {
		return new widget.widget(parseTreeNode,{
			wiki: wiki,
			document: $tw.fakeDocument
		});
	}

	function parseText(text,wiki) {
		var parser = wiki.parseText("text/vnd.tiddlywiki",text);
		return parser ? {type: "widget", children: parser.tree} : undefined;
	}

	function renderWidgetNode(widgetNode) {
		$tw.fakeDocument.setSequenceNumber(0);
		var wrapper = $tw.fakeDocument.createElement("div");
		widgetNode.render(wrapper,null);
		return wrapper;
	}

	it("should highlight the default button when state is invalid and validValues is set", function() {
		var wiki = new $tw.Wiki();
		wiki.addTiddler({title: "$:/state/test-btn", text: "InvalidValue"});
		var text = '<$button set="$:/state/test-btn" setTo="OptionA" default="OptionA" validValues="OptionA OptionB OptionC" selectedClass="selected">A</$button>' +
			'<$button set="$:/state/test-btn" setTo="OptionB" default="OptionA" validValues="OptionA OptionB OptionC" selectedClass="selected">B</$button>';
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		var wrapper = renderWidgetNode(widgetNode);
		// OptionA button should be selected (it's the default) because state is invalid
		expect(wrapper.children[0].children[0].getAttribute("class")).toContain("selected");
		expect(wrapper.children[0].children[0].getAttribute("aria-checked")).toBe("true");
		// OptionB button should not be selected
		expect(wrapper.children[0].children[1].getAttribute("class")).not.toContain("selected");
		expect(wrapper.children[0].children[1].getAttribute("aria-checked")).toBe("false");
	});

	it("should highlight the correct button when state is valid and validValues is set", function() {
		var wiki = new $tw.Wiki();
		wiki.addTiddler({title: "$:/state/test-btn", text: "OptionB"});
		var text = '<$button set="$:/state/test-btn" setTo="OptionA" default="OptionA" validValues="OptionA OptionB OptionC" selectedClass="selected">A</$button>' +
			'<$button set="$:/state/test-btn" setTo="OptionB" default="OptionA" validValues="OptionA OptionB OptionC" selectedClass="selected">B</$button>';
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		var wrapper = renderWidgetNode(widgetNode);
		// OptionA should not be selected
		expect(wrapper.children[0].children[0].getAttribute("class")).not.toContain("selected");
		expect(wrapper.children[0].children[0].getAttribute("aria-checked")).toBe("false");
		// OptionB should be selected (matches valid state)
		expect(wrapper.children[0].children[1].getAttribute("class")).toContain("selected");
		expect(wrapper.children[0].children[1].getAttribute("aria-checked")).toBe("true");
	});

	it("should highlight the default button when state tiddler does not exist", function() {
		var wiki = new $tw.Wiki();
		// No state tiddler added
		var text = '<$button set="$:/state/test-btn-none" setTo="OptionA" default="OptionA" validValues="OptionA OptionB" selectedClass="selected">A</$button>' +
			'<$button set="$:/state/test-btn-none" setTo="OptionB" default="OptionA" validValues="OptionA OptionB" selectedClass="selected">B</$button>';
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		var wrapper = renderWidgetNode(widgetNode);
		// Default (OptionA) should be selected
		expect(wrapper.children[0].children[0].getAttribute("class")).toContain("selected");
		// OptionB should not be selected
		expect(wrapper.children[0].children[1].getAttribute("class")).not.toContain("selected");
	});

	it("should work without validValues (no regression)", function() {
		var wiki = new $tw.Wiki();
		wiki.addTiddler({title: "$:/state/test-btn", text: "OptionB"});
		var text = '<$button set="$:/state/test-btn" setTo="OptionA" default="OptionA" selectedClass="selected">A</$button>' +
			'<$button set="$:/state/test-btn" setTo="OptionB" default="OptionA" selectedClass="selected">B</$button>';
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		var wrapper = renderWidgetNode(widgetNode);
		// Without validValues, normal behavior: OptionB matches state and is selected
		expect(wrapper.children[0].children[0].getAttribute("class")).not.toContain("selected");
		expect(wrapper.children[0].children[1].getAttribute("class")).toContain("selected");
	});

	it("should work with filter expressions as validValues", function() {
		var wiki = new $tw.Wiki();
		wiki.addTiddler({title: "OptionA", text: "A", tags: "options"});
		wiki.addTiddler({title: "OptionB", text: "B", tags: "options"});
		wiki.addTiddler({title: "$:/state/test-btn", text: "InvalidValue"});
		var text = '<$button set="$:/state/test-btn" setTo="OptionA" default="OptionA" validValues="[tag[options]]" selectedClass="selected">A</$button>' +
			'<$button set="$:/state/test-btn" setTo="OptionB" default="OptionA" validValues="[tag[options]]" selectedClass="selected">B</$button>';
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		var wrapper = renderWidgetNode(widgetNode);
		// State is invalid, should fall back to default (OptionA)
		expect(wrapper.children[0].children[0].getAttribute("class")).toContain("selected");
		expect(wrapper.children[0].children[1].getAttribute("class")).not.toContain("selected");
	});
});
