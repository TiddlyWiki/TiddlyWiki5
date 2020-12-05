/*\
title: $:/core/modules/widgets/log.js
type: application/javascript
module-type: widget-subclass

Widget to log debug messages

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.baseClass = "action-log";

exports.name = "log";

exports.constructor = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
}

exports.prototype = {};

exports.prototype.render = function(event) {
	Object.getPrototypeOf(Object.getPrototypeOf(this)).render.call(this,event);	
	Object.getPrototypeOf(Object.getPrototypeOf(this)).log.call(this);
}

})();