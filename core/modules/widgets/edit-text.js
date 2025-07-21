/*\
title: $:/core/modules/widgets/edit-text.js
type: application/javascript
module-type: widget

Edit-text widget

\*/

"use strict";

const {editTextWidgetFactory} = require("$:/core/modules/editor/factory.js");
const {FramedEngine} = require("$:/core/modules/editor/engines/framed.js");
const {SimpleEngine} = require("$:/core/modules/editor/engines/simple.js");

exports["edit-text"] = editTextWidgetFactory(FramedEngine,SimpleEngine);
