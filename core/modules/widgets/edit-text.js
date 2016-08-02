/*\
title: $:/core/modules/widgets/edit-text.js
type: application/javascript
module-type: widget

Edit-text widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var editTextWidgetFactory = require("$:/core/modules/editor/factory.js").editTextWidgetFactory,
	FramedEngine = require("$:/core/modules/editor/engines/framed.js").FramedEngine,
	SimpleEngine = require("$:/core/modules/editor/engines/simple.js").SimpleEngine;

exports["edit-text"] = editTextWidgetFactory(FramedEngine,SimpleEngine);

})();
