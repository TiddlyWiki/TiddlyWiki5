/*\
title: $:/plugins/tiddlywiki/prosemirror/core/widget-loader.js
type: application/javascript
module-type: widget

\*/

if(!$tw.browser) {
	return;
}
// Skip browser-only code when running in Node.js (e.g. tests, server-side rendering).
// ProseMirror depends on DOM APIs that are not available in Node.
const { prosemirror } = require("$:/plugins/tiddlywiki/prosemirror/core/widget.js");
exports.prosemirror = prosemirror;

// Register the factory-based edit widget for integration with $:/core/modules/editor/factory.js
// This allows the ProseMirror editor to be used via <$edit> when EditorTypeMappings maps to "prosemirror"
const { editTextWidgetFactory } = require("$:/core/modules/editor/factory.js");
const { ProseMirrorEngine } = require("$:/plugins/tiddlywiki/prosemirror/core/engine.js");
exports["edit-prosemirror"] = editTextWidgetFactory(ProseMirrorEngine, ProseMirrorEngine);