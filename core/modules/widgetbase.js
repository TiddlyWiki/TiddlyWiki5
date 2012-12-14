/*\
title: $:/core/modules/widgetbase.js
type: application/javascript
module-type: global

Base class for widgets

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
This constructor is always overridden with a blank constructor, and so shouldn't be used
*/
var WidgetBase = function() {
};

/*
To be overridden by individual widgets
*/
WidgetBase.prototype.init = function(renderer) {
	this.renderer = renderer;
};

exports.WidgetBase = WidgetBase;

})();
