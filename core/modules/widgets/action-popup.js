/*\
title: $:/core/modules/widgets/action-popup.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var Popup = require("$:/core/modules/utils/dom/popup.js");

var ActionPopupWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

ActionPopupWidget.prototype = new Widget();

ActionPopupWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

ActionPopupWidget.prototype.execute = function() {
	this.actionState = this.getAttribute("$state");
	this.actionCoords = this.getAttribute("$coords");
	this.floating = this.getAttribute("$floating","no") === "yes";
};

ActionPopupWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$state"] || changedAttributes["$coords"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

ActionPopupWidget.prototype.invokeAction = function(triggeringWidget,event) {
	// Trigger the popup
	var coordinates = Popup.parseCoordinates(this.actionCoords || "");
	if(coordinates) {
		$tw.popup.triggerPopup({
			domNode: null,
			domNodeRect: {
				left: coordinates.left,
				top: coordinates.top,
				width: coordinates.width,
				height: coordinates.height
			},
			title: this.actionState,
			wiki: this.wiki,
			floating: this.floating,
			absolute: coordinates.absolute
		});
	} else {
		$tw.popup.cancel(0);
	}
	return true; // Action was invoked
};

exports["action-popup"] = ActionPopupWidget;
