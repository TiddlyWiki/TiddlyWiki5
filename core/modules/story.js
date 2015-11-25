/*\
title: $:/core/modules/story.js
type: application/javascript
module-type: global

Lightweight object for managing interactions with the story and history lists.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Construct Story object with options:
wiki: reference to wiki object to use to resolve tiddler titles
storyTitle: title of story list tiddler
historyTitle: title of history list tiddler
*/
function Story(options) {
	options = options || {};
	this.wiki = options.wiki || $tw.wiki;
	this.storyTitle = options.storyTitle || "$:/StoryList";
	this.historyTitle = options.historyTitle || "$:/HistoryList";
};

Story.prototype.navigateTiddler = function(navigateTo,navigateFromTitle,navigateFromClientRect) {
	this.addToStory(navigateTo,navigateFromTitle);
	this.addToHistory(navigateTo,navigateFromClientRect);
};

Story.prototype.getStoryList = function() {
	return this.wiki.getTiddlerList(this.storyTitle) || [];
};

Story.prototype.addToStory = function(navigateTo,navigateFromTitle,options) {
	options = options || {};
	var storyList = this.getStoryList();
	// See if the tiddler is already there
	var slot = storyList.indexOf(navigateTo);
	// Quit if it already exists in the story river
	if(slot >= 0) {
		return;
	}
	// First we try to find the position of the story element we navigated from
	var fromIndex = storyList.indexOf(navigateFromTitle);
	if(fromIndex >= 0) {
		// The tiddler is added from inside the river
		// Determine where to insert the tiddler; Fallback is "below"
		switch(options.openLinkFromInsideRiver) {
			case "top":
				slot = 0;
				break;
			case "bottom":
				slot = storyList.length;
				break;
			case "above":
				slot = fromIndex;
				break;
			case "below": // Intentional fall-through
			default:
				slot = fromIndex + 1;
				break;
		}
	} else {
		// The tiddler is opened from outside the river. Determine where to insert the tiddler; default is "top"
		if(options.openLinkFromOutsideRiver === "bottom") {
			// Insert at bottom
			slot = storyList.length;
		} else {
			// Insert at top
			slot = 0;
		}
	}
	// Add the tiddler
	storyList.splice(slot,0,navigateTo);
	// Save the story
	this.saveStoryList(storyList);
};

Story.prototype.saveStoryList = function(storyList) {
	var storyTiddler = this.wiki.getTiddler(this.storyTitle);
	this.wiki.addTiddler(new $tw.Tiddler(
		this.wiki.getCreationFields(),
		{title: this.storyTitle},
		storyTiddler,
		{list: storyList},
		this.wiki.getModificationFields()
	));
};

Story.prototype.addToHistory = function(navigateTo,navigateFromClientRect) {
	var titles = $tw.utils.isArray(navigateTo) ? navigateTo : [navigateTo];
	// Add a new record to the top of the history stack
	var historyList = this.wiki.getTiddlerData(this.historyTitle,[]);
	$tw.utils.each(titles,function(title) {
		historyList.push({title: title, fromPageRect: navigateFromClientRect});
	});
	this.wiki.setTiddlerData(this.historyTitle,historyList,{"current-tiddler": titles[titles.length-1]});
};

Story.prototype.storyCloseTiddler = function(targetTitle) {
// TBD
};

Story.prototype.storyCloseAllTiddlers = function() {
// TBD
};

Story.prototype.storyCloseOtherTiddlers = function(targetTitle) {
// TBD
};

Story.prototype.storyEditTiddler = function(targetTitle) {
// TBD
};

Story.prototype.storyDeleteTiddler = function(targetTitle) {
// TBD
};

Story.prototype.storySaveTiddler = function(targetTitle) {
// TBD
};

Story.prototype.storyCancelTiddler = function(targetTitle) {
// TBD
};

Story.prototype.storyNewTiddler = function(targetTitle) {
// TBD
};

exports.Story = Story;


})();
