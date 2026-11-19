/*\
title: $:/plugins/tiddlywiki/prosemirror/core/widget-loader.js
type: application/javascript
module-type: widget

\*/

const { editTextWidgetFactory } = require("$:/core/modules/editor/factory.js");
const { SimpleEngine } = require("$:/core/modules/editor/engines/simple.js");
const compatibility = require("$:/plugins/tiddlywiki/prosemirror/core/compatibility.js");
const SimpleWidget = editTextWidgetFactory(SimpleEngine,SimpleEngine);

// Keep server-side rendering and fake-DOM workflows on the standard simple
// engine, while registering the same mapped widget name in every environment.
if($tw.browser && !compatibility.supportsEngineHooks(SimpleWidget)) {
	// Older cores use WikiText offsets for toolbar actions and cannot dispose
	// structured editors safely. Keep editing the source through their own engine.
	const { FramedEngine } = require("$:/core/modules/editor/engines/framed.js");
	exports["edit-prosemirror"] = compatibility.createSourceEditor(editTextWidgetFactory,FramedEngine,SimpleEngine);
} else if($tw.browser) {
	const { ProseMirrorEngine } = require("$:/plugins/tiddlywiki/prosemirror/core/engine.js");
	exports["edit-prosemirror"] = editTextWidgetFactory(ProseMirrorEngine,ProseMirrorEngine);
} else {
	exports["edit-prosemirror"] = SimpleWidget;
}
// Backwards-compatible spelling, not a second editor implementation.
exports.prosemirror = exports["edit-prosemirror"];
