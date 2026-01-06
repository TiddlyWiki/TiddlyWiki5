/*\
title: $:/plugins/BurningTreeC/tiddlywiki-codemirror/edit-codemirror.js
type: application/javascript
module-type: widget

Edit-codemirror widget

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var editTextWidgetFactory = require("$:/core/modules/editor/factory.js").editTextWidgetFactory,
	CodeMirrorEngine = require("$:/plugins/BurningTreeC/tiddlywiki-codemirror/engine.js").CodeMirrorEngine;

exports["edit-codemirror-6"] = editTextWidgetFactory(CodeMirrorEngine,CodeMirrorEngine);

