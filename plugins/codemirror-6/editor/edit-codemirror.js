/*\
title: $:/plugins/tiddlywiki/codemirror-6/edit-codemirror.js
type: application/javascript
module-type: widget

Edit-codemirror widget

\*/

/*jslint node: true, browser: true */
"use strict";

// Only export the CodeMirror widget in browser environments
// Node.js builds should not attempt to use CodeMirror (it requires DOM APIs)
if($tw.browser) {
	var editTextWidgetFactory = require("$:/core/modules/editor/factory.js").editTextWidgetFactory,
		CodeMirrorEngine = require("$:/plugins/tiddlywiki/codemirror-6/engine.js").CodeMirrorEngine;

	exports["edit-codemirror-6"] = editTextWidgetFactory(CodeMirrorEngine, CodeMirrorEngine);
}
