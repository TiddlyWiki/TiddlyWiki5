/*\
title: $:/plugins/tiddlywiki/prosemirror/core/widget-loader.js
type: application/javascript
module-type: widget

\*/

const { editTextWidgetFactory } = require("$:/core/modules/editor/factory.js");
const EditorEngine = $tw.browser ?
	require("$:/plugins/tiddlywiki/prosemirror/core/engine.js").ProseMirrorEngine :
	require("$:/core/modules/editor/engines/simple.js").SimpleEngine;

// Keep server-side rendering and fake-DOM workflows on the standard simple
// engine, while registering the same mapped widget name in every environment.
exports["edit-prosemirror"] = editTextWidgetFactory(EditorEngine,EditorEngine);
