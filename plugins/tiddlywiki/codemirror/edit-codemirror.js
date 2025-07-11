/*\
title: $:/plugins/tiddlywiki/codemirror/edit-codemirror.js
type: application/javascript
module-type: widget

Edit-codemirror widget

\*/

"use strict";

const {editTextWidgetFactory} = require("$:/core/modules/editor/factory.js");
const {CodeMirrorEngine} = require("$:/plugins/tiddlywiki/codemirror/engine.js");

exports["edit-codemirror"] = editTextWidgetFactory(CodeMirrorEngine,CodeMirrorEngine);
