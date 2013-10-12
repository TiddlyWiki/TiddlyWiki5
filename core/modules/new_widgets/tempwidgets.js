/*\
title: $:/core/modules/new_widgets/tempwidgets.js
type: application/javascript
module-type: new_widget

Temporary shim widgets

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/new_widgets/widget.js").widget;

exports.button = Widget;
exports.linkcatcher = Widget;
exports.setstyle = Widget;
exports["import"] = Widget;

})();
