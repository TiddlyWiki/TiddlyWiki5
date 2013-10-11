/*\
title: $:/core/modules/widgets/navigator.js
type: application/javascript
module-type: new_widget

Navigator widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var NavigatorWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
	this.addEventListeners([
		{type: "tw-navigate", listener: this.handleNavigateEvent},
		{type: "tw-edit-tiddler", listener: this.handleEditTiddlerEvent},
		{type: "tw-delete-tiddler", listener: this.handleDeleteTiddlerEvent},
		{type: "tw-save-tiddler", listener: this.handleSaveTiddlerEvent},
		{type: "tw-cancel-tiddler", listener: this.handleCancelTiddlerEvent},
		{type: "tw-close-tiddler", listener: this.handleCloseTiddlerEvent},
		{type: "tw-close-all-tiddlers", listener: this.handleCloseAllTiddlersEvent},
		{type: "tw-new-tiddler", listener: this.handleNewTiddlerEvent}
	]);
};

/*
Inherit from the base widget class
*/
NavigatorWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
NavigatorWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
NavigatorWidget.prototype.execute = function() {
	// Get our parameters
	this.storyTitle = this.getAttribute("story");
	this.historyTitle = this.getAttribute("history");
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
NavigatorWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.story || changedAttributes.history) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);		
	}
};

exports.navigator = NavigatorWidget;

// Temporarily make other widgets into the same no-op
exports.import = NavigatorWidget;
exports.button = NavigatorWidget;
exports.linkcatcher = NavigatorWidget;
exports.setstyle = NavigatorWidget;

})();
