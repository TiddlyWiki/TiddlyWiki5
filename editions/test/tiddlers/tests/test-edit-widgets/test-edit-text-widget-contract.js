/*\
title: test-edit-text-widget-contract.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the optional structured-operation and lifecycle contract exposed by the
edit-text widget factory.

\*/

"use strict";

describe("Edit-text widget engine contract", function() {
	var editTextWidgetFactory = require("$:/core/modules/editor/factory.js").editTextWidgetFactory,
		helpers = require("$:/tests/test-edit-widgets/helpers");

	function TestEngine(options) {
		this.widget = options.widget;
		this.value = options.value;
		this.createCalls = 0;
		this.executeCalls = 0;
		this.fixHeightCalls = 0;
		this.destroyCalls = 0;
		this.domNode = this.widget.document.createElement("textarea");
		options.parentNode.insertBefore(this.domNode,options.nextSibling);
		this.widget.domNodes.push(this.domNode);
	}

	TestEngine.prototype.getText = function() {
		return this.value;
	};

	TestEngine.prototype.fixHeight = function() {
		this.fixHeightCalls++;
	};

	TestEngine.prototype.focus = function() {};

	TestEngine.prototype.createTextOperation = function() {
		this.createCalls++;
		return {text: this.value};
	};

	TestEngine.prototype.executeTextOperation = function() {
		this.executeCalls++;
		return this.value + "|legacy";
	};

	TestEngine.prototype.destroy = function() {
		this.destroyCalls++;
	};

	function renderEditor() {
		var wiki = helpers.makeWiki([{title: "T", text: "initial"}]),
			EditTextWidget = editTextWidgetFactory(TestEngine,TestEngine),
			parentWidget = {
				variables: Object.create(null),
				children: [],
				getAncestorCount: function() { return 0; }
			},
			widget = new EditTextWidget({
				type: "edit-contract-test",
				attributes: {
					tiddler: {type: "string", value: "T"}
				},
				children: []
			},{wiki: wiki, document: $tw.fakeDocument, parentWidget: parentWidget}),
			wrapper = $tw.fakeDocument.createElement("div");
		parentWidget.children.push(widget);
		widget.render(wrapper,null);
		widget.engine.fixHeightCalls = 0;
		return {widget: widget, wiki: wiki};
	}

	it("delegates undefined structured-operation results to text operations", function() {
		var rendered = renderEditor(),
			engine = rendered.widget.engine;
		engine.handleEditTextOperation = function() {};

		rendered.widget.handleEditTextOperationMessage({param: "unknown"});

		expect(engine.createCalls).toBe(1);
		expect(engine.executeCalls).toBe(1);
		expect(engine.fixHeightCalls).toBe(1);
		expect(rendered.wiki.getTiddlerText("T")).toBe("initial|legacy");
	});

	it("saves operations handled by a structured editor without text fallback", function() {
		var rendered = renderEditor(),
			engine = rendered.widget.engine;
		engine.value = "structured";
		engine.handleEditTextOperation = function() {
			return true;
		};

		rendered.widget.handleEditTextOperationMessage({param: "bold"});

		expect(engine.createCalls).toBe(0);
		expect(engine.executeCalls).toBe(0);
		expect(engine.fixHeightCalls).toBe(1);
		expect(rendered.wiki.getTiddlerText("T")).toBe("structured");
	});

	it("does not run an unsafe fallback when a structured editor declines", function() {
		var rendered = renderEditor(),
			engine = rendered.widget.engine;
		engine.value = "must-not-save";
		engine.handleEditTextOperation = function() {
			return false;
		};

		rendered.widget.handleEditTextOperationMessage({param: "unsupported"});

		expect(engine.createCalls).toBe(0);
		expect(engine.executeCalls).toBe(0);
		expect(engine.fixHeightCalls).toBe(0);
		expect(rendered.wiki.getTiddlerText("T")).toBe("initial");
	});

	it("destroys the engine with the widget", function() {
		var rendered = renderEditor(),
			engine = rendered.widget.engine;

		rendered.widget.destroy();

		expect(engine.destroyCalls).toBe(1);
		expect(rendered.widget.engine).toBeNull();
	});

	it("destroys the previous engine before rerendering", function() {
		var rendered = renderEditor(),
			previousEngine = rendered.widget.engine;

		rendered.widget.refreshSelf();

		expect(previousEngine.destroyCalls).toBe(1);
		expect(rendered.widget.engine).not.toBe(previousEngine);
	});
});
