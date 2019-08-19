/*\
title: $:/core/modules/widgets/action-popup.js
type: application/javascript
module-type: widget

ActionPopup widget

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
        var self = this;
	// Remember parent
	this.parentDomNode = parent;
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();
	var domNode = this.document.createElement("div");
	parent.insertBefore(domNode,nextSibling);
	this.domNodes.push(domNode);
};

ActionPopupWidget.prototype.triggerPopup = function(event) {
		$tw.popup.triggerPopup({
			domNode: this.domNodes[0],
			title: this.popup,
			wiki: this.wiki
		});
};

/*
Compute the internal state of the widget
*/
ActionPopupWidget.prototype.execute = function() {
	// Get attributes
	this.popup = this.getAttribute("$popup");
};
	
ActionPopupWidget.prototype.invokeAction = function(triggeringWidget,event) {
	if(this.popup) {
		this.triggerPopup();
	}
	return true;
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ActionPopupWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$popup"] || (this.popup && changedTiddlers[this.popup])) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports["action-popup"] = ActionPopupWidget;

})();
