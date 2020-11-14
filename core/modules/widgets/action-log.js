/*\
title: $:/core/modules/widgets/action-log.js
type: application/javascript
module-type: widget

Action widget to log debug messages

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var LogWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
LogWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
LogWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
LogWidget.prototype.refresh = function(changedTiddlers) {
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
LogWidget.prototype.invokeAction = function(triggeringWidget,event) {
	$tw.utils.logTable(this.attributes,["attribute name","value"]);
	return true; // Action was invoked
};

exports["action-log"] = LogWidget;

})();
