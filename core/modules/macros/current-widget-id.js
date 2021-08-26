/*\
title: $:/core/modules/macros/current-widget-id.js
type: application/javascript
module-type: macro

Macro to qualify a state tiddler title according

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
*/

exports.name = "current-widget-id";

exports.params = [
	{name: "title"}
];

/*
Run the macro
*/
exports.run = function(title) {
	return title + "-" + this.getStateQualifier() + "_" + this.getCurrentWidgetId();
};

})();
