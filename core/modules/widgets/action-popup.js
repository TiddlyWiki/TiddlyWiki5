/*\
title: $:/core/modules/widgets/action-popup.js
type: application/javascript
module-type: widget

Action widget to trigger a popup.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ActionPopupWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ActionPopupWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ActionPopupWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
ActionPopupWidget.prototype.execute = function() {
	this.actionState = this.getAttribute("$state");
	this.actionCoords = this.getAttribute("$coords");
	this.floating = this.getAttribute("$floating","no") === "yes";
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
ActionPopupWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$state"] || changedAttributes["$coords"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
ActionPopupWidget.prototype.invokeAction = function(triggeringWidget,event) {
	// Trigger the popup
	var popupLocationRegExp = /^\((-?[0-9\.E]+),(-?[0-9\.E]+),(-?[0-9\.E]+),(-?[0-9\.E]+)\)$/,
		match = popupLocationRegExp.exec(this.actionCoords || "");
	if(match) {
		$tw.popup.triggerPopup({
			domNode: null,
			domNodeRect: {
				left: parseFloat(match[1]),
				top: parseFloat(match[2]),
				width: parseFloat(match[3]),
				height: parseFloat(match[4])
			},
			title: this.actionState,
			wiki: this.wiki,
			floating: this.floating
		});
	} else {
		$tw.popup.cancel(0);
	}
	return true; // Action was invoked
};

exports["action-popup"] = ActionPopupWidget;

})();
