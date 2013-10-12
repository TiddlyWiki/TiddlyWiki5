/*\
title: $:/core/modules/new_widgets/navigator.js
type: application/javascript
module-type: new_widget

Navigator widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/new_widgets/widget.js").widget;

var NavigatorWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
	this.addEventListeners([
		{type: "tw-navigate", handler: "handleNavigateEvent"},
		{type: "tw-edit-tiddler", handler: "handleEditTiddlerEvent"},
		{type: "tw-delete-tiddler", handler: "handleDeleteTiddlerEvent"},
		{type: "tw-save-tiddler", handler: "handleSaveTiddlerEvent"},
		{type: "tw-cancel-tiddler", handler: "handleCancelTiddlerEvent"},
		{type: "tw-close-tiddler", handler: "handleCloseTiddlerEvent"},
		{type: "tw-close-all-tiddlers", handler: "handleCloseAllTiddlersEvent"},
		{type: "tw-new-tiddler", handler: "handleNewTiddlerEvent"}
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

NavigatorWidget.prototype.getStoryList = function() {
	this.storyList = this.wiki.getTiddlerList(this.storyTitle);
};

NavigatorWidget.prototype.saveStoryList = function() {
	var storyTiddler = this.wiki.getTiddler(this.storyTitle);
	this.wiki.addTiddler(new $tw.Tiddler({
		title: this.storyTitle
	},storyTiddler,{list: this.storyList}));
};

NavigatorWidget.prototype.findTitleInStory = function(title,defaultIndex) {
	for(var t=0; t<this.storyList.length; t++) {
		if(this.storyList[t] === title) {
			return t;
		}
	}	
	return defaultIndex;
};

/*
Handle a tw-navigate event
*/
NavigatorWidget.prototype.handleNavigateEvent = function(event) {
	if(this.storyTitle) {
		// Update the story tiddler if specified
		this.getStoryList();
		// See if the tiddler is already there
		var slot = this.findTitleInStory(event.navigateTo,-1);
		// If not we need to add it
		if(slot === -1) {
			// First we try to find the position of the story element we navigated from
			slot = this.findTitleInStory(event.navigateFromTitle,-1) + 1;
			// Add the tiddler
			this.storyList.splice(slot,0,event.navigateTo);
			// Save the story
			this.saveStoryList();
		}
	}
	// Add a new record to the top of the history stack
	if(this.historyTitle) {
		var historyList = this.wiki.getTiddlerData(this.historyTitle,[]);
		historyList.push({title: event.navigateTo, fromPageRect: event.navigateFromClientRect});
		this.wiki.setTiddlerData(this.historyTitle,historyList);
	}
	return false;
};

exports.navigator = NavigatorWidget;

})();
