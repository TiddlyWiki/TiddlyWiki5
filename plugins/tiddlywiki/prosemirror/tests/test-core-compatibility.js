/*\
title: test-prosemirror-core-compatibility.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for the minimum structured editor contract and safe source fallback.

\*/

"use strict";

describe("ProseMirror core compatibility", function() {
	const compatibility = require("$:/plugins/tiddlywiki/prosemirror/core/compatibility.js"),
		factory = require("$:/core/modules/editor/factory.js").editTextWidgetFactory,
		FramedEngine = require("$:/core/modules/editor/engines/framed.js").FramedEngine,
		SimpleEngine = require("$:/core/modules/editor/engines/simple.js").SimpleEngine;

	it("accepts the real core engine hooks without reading a version or module source", function() {
		expect(compatibility.supportsEngineHooks(factory(SimpleEngine,SimpleEngine))).toBe(true);
	});

	it("declines a factory without the cleanup hook", function() {
		function LegacyEditor() {}
		LegacyEditor.prototype.handleEditTextOperationMessage = jasmine.createSpy("legacy operation");
		expect(compatibility.supportsEngineHooks(LegacyEditor)).toBe(false);
		expect(LegacyEditor.prototype.handleEditTextOperationMessage).not.toHaveBeenCalled();
	});

	it("declines the legacy text-offset route even if cleanup was backported", function() {
		function PartialEditor() {}
		PartialEditor.prototype.onDestroy = function() {};
		PartialEditor.prototype.handleEditTextOperationMessage = function() { this.engine.createTextOperation(); };
		expect(compatibility.supportsEngineHooks(PartialEditor)).toBe(false);
	});

	it("requires declined commands to leave saved content unchanged", function() {
		const Editor = factory(SimpleEngine,SimpleEngine);
		Editor.prototype.handleEditTextOperationMessage = function() {
			this.engine.handleEditTextOperation({});
			this.saveChanges(this.engine.getText());
		};
		expect(compatibility.supportsEngineHooks(Editor)).toBe(false);
	});

	it("requires handled commands to save the current structured value", function() {
		const Editor = factory(SimpleEngine,SimpleEngine);
		Editor.prototype.handleEditTextOperationMessage = function() { this.engine.handleEditTextOperation({}); };
		expect(compatibility.supportsEngineHooks(Editor)).toBe(false);
	});

	it("requires cleanup to destroy and clear the engine", function() {
		const Editor = factory(SimpleEngine,SimpleEngine);
		Editor.prototype.onDestroy = function() { this.engine = null; };
		expect(compatibility.supportsEngineHooks(Editor)).toBe(false);
	});

	it("renders an escaped notice and unchanged source through the standard engine", function() {
		const wiki = new $tw.Wiki(),
			title = "Core compatibility source",
			source = "Before <<now>>\n\n|Keep|Table|",
			SourceEditor = compatibility.createSourceEditor(factory,FramedEngine,SimpleEngine),
			container = $tw.fakeDocument.createElement("div");
		wiki.addTiddler({title: title, text: source});
		wiki.addTiddler({title: "$:/plugins/tiddlywiki/prosemirror/language/Compatibility/Core", text: "<upgrade core>"});
		const widget = new SourceEditor({type: "edit-prosemirror", attributes: {
			tiddler: {type: "string", value: title},
			tag: {type: "string", value: "textarea"}
		}}, {wiki: wiki, document: $tw.fakeDocument});
		widget.render(container,null);
		expect(widget.engine instanceof SimpleEngine).toBe(true);
		expect(container.innerHTML).toContain("&lt;upgrade core&gt;");
		expect(wiki.getTiddlerText(title)).toBe(source);
		widget.destroy();
		expect(container.innerHTML).toBe("");
	});
});
