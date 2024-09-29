/*\
title: $:/core/modules/widgets/refresh-blocker.js
type: application/javascript
module-type: widget

RefreshBlocker widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var RefreshBlockerWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
RefreshBlockerWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
RefreshBlockerWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
RefreshBlockerWidget.prototype.execute = function() {
	this.refreshBlockerList = this.getAttribute("refreshBlockerList");
	// Make child widgets
	this.makeChildWidgets();
};

RefreshBlockerWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.refreshBlockerList) {
		this.refreshSelf();
		return true;
	} else if(this.refreshBlockerList && $tw.utils.hopArray(changedTiddlers,this.wiki.filterTiddlers(this.refreshBlockerList))) {
		return false;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

exports["refresh-blocker"] = RefreshBlockerWidget;

})();