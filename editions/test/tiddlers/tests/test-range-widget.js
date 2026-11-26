/*\
title: test-range-widget.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests range widget action variables, including the regression in #10085.

\*/

"use strict";

describe("Range widget",function() {

	function createRangeWidget(startActions) {
		var wiki = $tw.test.wiki(),
			start = startActions === undefined ? actionString("Start") : startActions;
		wiki.addTiddler({title: "State",value: "5"});
		var parser = wiki.parseText("text/vnd.tiddlywiki",
				'<$range tiddler="State" field="value" min="0" max="10" ' +
				'actionsStart="""' + start + '""" ' +
				'actionsStop="""' + actionString("Stop") + '""" ' +
				'actions="""' + actionString("Input") + '"""/>'),
			widget = wiki.makeWidget(parser,{document: $tw.fakeDocument});
		widget.render($tw.fakeDocument.createElement("div"),null);
		return {wiki: wiki,range: findRangeWidget(widget)};
	}

	function actionString(title) {
		return '<$action-setfield $tiddler="' + title + '" value=<<actionValue>> changed=<<actionValueHasChanged>>/>';
	}

	function findRangeWidget(widget) {
		if(widget.parseTreeNode.type === "range") {
			return widget;
		}
		for(var i = 0; i < widget.children.length; i++) {
			var range = findRangeWidget(widget.children[i]);
			if(range) {
				return range;
			}
		}
	}

	it("reports no change when a drag starts",function() {
		var test = createRangeWidget();
		test.range.handleMouseDownEvent({});
		expect(test.wiki.getTiddler("Start").fields.value).toBe("5");
		expect(test.wiki.getTiddler("Start").fields.changed).toBe("no");
	});

	it("reports no change when a drag stops at its starting value",function() {
		var test = createRangeWidget();
		test.range.handleMouseDownEvent({});
		test.range.handleMouseUpEvent({});
		expect(test.wiki.getTiddler("Stop").fields.value).toBe("5");
		expect(test.wiki.getTiddler("Stop").fields.changed).toBe("no");
	});

	it("reports a change when a drag stops at a different value",function() {
		var test = createRangeWidget();
		test.range.handleMouseDownEvent({});
		test.range.inputDomNode.value = "6";
		test.range.handleInputEvent({});
		test.range.handleMouseUpEvent({});
		expect(test.wiki.getTiddler("State").fields.value).toBe("6");
		expect(test.wiki.getTiddler("Stop").fields.value).toBe("6");
		expect(test.wiki.getTiddler("Stop").fields.changed).toBe("yes");
	});

	it("reports no change when a drag returns to its starting value",function() {
		var test = createRangeWidget();
		test.range.handleMouseDownEvent({});
		test.range.inputDomNode.value = "6";
		test.range.handleInputEvent({});
		test.range.inputDomNode.value = "5";
		test.range.handleInputEvent({});
		test.range.handleMouseUpEvent({});
		expect(test.wiki.getTiddler("Stop").fields.changed).toBe("no");
	});

	it("captures a new starting value for each drag",function() {
		var test = createRangeWidget();
		test.range.handleMouseDownEvent({});
		test.range.inputDomNode.value = "6";
		test.range.handleInputEvent({});
		test.range.handleMouseUpEvent({});
		test.range.handleMouseDownEvent({});
		expect(test.wiki.getTiddler("Start").fields.value).toBe("6");
		expect(test.wiki.getTiddler("Start").fields.changed).toBe("no");
		test.range.handleMouseUpEvent({});
		expect(test.wiki.getTiddler("Stop").fields.changed).toBe("no");
	});

	it("captures the starting value even without actionsStart",function() {
		var test = createRangeWidget("");
		test.range.handleMouseDownEvent({});
		test.range.handleMouseUpEvent({});
		expect(test.wiki.tiddlerExists("Start")).toBe(false);
		expect(test.wiki.getTiddler("Stop").fields.changed).toBe("no");
	});

	["handleInputEvent","handleChangeEvent"].forEach(function(handler) {
		it("reports a change for " + handler + " without a mouse drag",function() {
			var test = createRangeWidget();
			test.range.inputDomNode.value = "6";
			test.range[handler]({});
			expect(test.wiki.getTiddler("State").fields.value).toBe("6");
			expect(test.wiki.getTiddler("Input").fields.value).toBe("6");
			expect(test.wiki.getTiddler("Input").fields.changed).toBe("yes");
		});
	});

});
