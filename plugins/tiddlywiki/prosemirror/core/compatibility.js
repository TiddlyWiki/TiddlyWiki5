/*\
title: $:/plugins/tiddlywiki/prosemirror/core/compatibility.js
type: application/javascript
module-type: library

Check the editor contract by behaviour, since prerelease cores share a version number.

\*/

"use strict";

exports.supportsEngineHooks = function(EditorWidget) {
	const prototype = EditorWidget.prototype;
	if(typeof prototype.onDestroy !== "function" || typeof prototype.handleEditTextOperationMessage !== "function") {
		return false;
	}
	let handledCalls = 0,
		destroyed = false,
		savedText;
	const engine = {
		handleEditTextOperation() { handledCalls++; return false; },
		createTextOperation() { throw new Error("Legacy text offset path"); },
		getText() { return "structured editor text"; },
		fixHeight() {},
		destroy() { destroyed = true; }
	};
	const owner = {
		engine: engine,
		saveChanges(text) { savedText = text; }
	};
	try {
		prototype.handleEditTextOperationMessage.call(owner,{param: "wrap-selection"});
		if(handledCalls !== 1 || savedText !== undefined) {
			return false;
		}
		engine.handleEditTextOperation = function() { handledCalls++; return true; };
		prototype.handleEditTextOperationMessage.call(owner,{param: "wrap-selection"});
		if(handledCalls !== 2 || savedText !== "structured editor text") {
			return false;
		}
		prototype.onDestroy.call(owner);
		return destroyed && owner.engine === null;
	} catch(error) {
		return false;
	}
};

exports.createSourceEditor = function(editTextWidgetFactory,FramedEngine,SimpleEngine) {
	const SourceEditor = editTextWidgetFactory(FramedEngine,SimpleEngine),
		renderSourceEditor = SourceEditor.prototype.render;
	SourceEditor.prototype.render = function(parent,nextSibling) {
		const notice = this.document.createElement("div");
		notice.className = "tc-message-box tc-prosemirror-core-warning";
		notice.setAttribute("role","status");
		notice.textContent = this.wiki.getTiddlerText("$:/plugins/tiddlywiki/prosemirror/language/Compatibility/Core",
			"ProseMirror requires the core structured-editor operation and cleanup hooks (#10075). Use a wiki built from the matching source branch. This field uses the standard source editor until the core is upgraded.");
		parent.insertBefore(notice,nextSibling);
		this.domNodes.push(notice);
		renderSourceEditor.call(this,parent,nextSibling);
	};
	return SourceEditor;
};
