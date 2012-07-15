/*\
title: $:/core/modules/macros/navigator.js
type: application/javascript
module-type: macro

Traps navigation events to update a story tiddler and history tiddler. Can also optionally capture navigation target in a specified text reference.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "navigator",
	params: {
		story: {byName: "default", type: "text"}, // Actually a tiddler, but we don't want it to be a dependency
		history: {byName: "default", type: "text"}, // Actually a tiddler, but we don't want it to be a dependency
		set: {byName: true, type: "tiddler"}
	}
};

exports.getStory = function() {
	var storyTiddler = this.wiki.getTiddler(this.params.story);
	this.story = {tiddlers: []};
	if(storyTiddler && $tw.utils.hop(storyTiddler.fields,"text")) {
		this.story = JSON.parse(storyTiddler.fields.text);
	}
};

exports.saveStory = function() {
	if(this.hasParameter("story")) {
		this.wiki.addTiddler(new $tw.Tiddler(this.wiki.getTiddler(this.params.story),{title: this.params.story, text: JSON.stringify(this.story)}));
	}
};

exports.getHistory = function() {
	var historyTiddler = this.wiki.getTiddler(this.params.history);
	this.history = {stack: []};
	if(historyTiddler && $tw.utils.hop(historyTiddler.fields,"text")) {
		this.history = JSON.parse(historyTiddler.fields.text);
	}
};

exports.saveHistory = function() {
	if(this.hasParameter("history")) {
		this.wiki.addTiddler(new $tw.Tiddler(this.wiki.getTiddler(this.params.history),{title: this.params.history, text: JSON.stringify(this.history)}));
	}
};

exports.handleEvent = function(event) {
	if(this.eventMap[event.type]) {
		this.eventMap[event.type].call(this,event);
	}
};

exports.eventMap = {};

// Navigate to a specified tiddler
exports.eventMap["tw-navigate"] = function(event) {
	// Update the story tiddler if specified
	if(this.hasParameter("story")) {
		this.getStory();
		var t,tiddler,slot;
		// See if the tiddler is already there
		for(t=0; t<this.story.tiddlers.length; t++) {
			if(this.story.tiddlers[t].title === event.navigateTo) {
				tiddler = t;
			}
		}
		// If not we need to add it
		if(tiddler === undefined) {
			// First we try to find the position of the story element we navigated from
			var navigateFromTitle;
			if(event.navigateFromStoryElement) {
				navigateFromTitle = event.navigateFromStoryElement.params.target;
			}
			slot = 0;
			if(navigateFromTitle !== undefined) {
				for(t=0; t<this.story.tiddlers.length; t++) {
					if(this.story.tiddlers[t].title === navigateFromTitle) {
						slot = t + 1;
					}
				}	
			}
			// Add the tiddler
			this.story.tiddlers.splice(slot,0,{title: event.navigateTo});
			// Save the story
			this.saveStory();
		}
	}
	// Set the tiddler if specified
	if(this.hasParameter("set")) {
		this.wiki.setTextReference(this.params.set,event.navigateTo);
	}
	// Add a new record to the top of the history stack
	this.getHistory();
	this.history.stack.push({
		title: event.navigateTo,
		fromTitle: event.navigateFromTitle,
		fromPosition: event.navigateFrom.getNodeBounds(),
		scrollPosition: $tw.utils.getScrollPosition()
	});
	this.saveHistory();
	event.stopPropagation();
	return false;
};

// Navigate to a specified tiddler
exports.eventMap["tw-NavigateBack"] = function(event) {
	// Pop a record record off the top of the history stack
	this.getHistory();
	if(this.history.stack.length < 2) {
		return false; // Bail if there is not enough entries on the history stack
	}
	var fromHistoryInfo = this.history.stack.pop(),
		toHistoryInfo = this.history.stack[this.history.stack.length-1];
	this.saveHistory();
	// Make sure that the tiddler we're navigating back to is open in the story
	if(this.hasParameter("story") && toHistoryInfo) {
		this.getStory();
		var t,tiddler,slot;
		// See if the tiddler is already there
		for(t=0; t<this.story.tiddlers.length; t++) {
			if(this.story.tiddlers[t].title === toHistoryInfo.title) {
				tiddler = t;
			}
		}
		// If not we need to add it
		if(tiddler === undefined) {
			// Add the tiddler
			this.story.tiddlers.splice(slot,0,{title: toHistoryInfo.title});
			// Save the story
			this.saveStory();
		}
	}
	event.stopPropagation();
	return false;
};

// Place a tiddler in edit mode
exports.eventMap["tw-EditTiddler"] = function(event) {
	if(this.hasParameter("story")) {
		var storyTiddler, storyRecord, tiddler, t;
		// Put the specified tiddler into edit mode
		this.getStory();
		for(t=0; t<this.story.tiddlers.length; t++) {
			storyRecord = this.story.tiddlers[t];
			if(storyRecord.title === event.tiddlerTitle && !storyRecord.draft) {
				// Set the story record to the draft of the specified tiddler
				storyRecord.draft = "Draft " + (new Date()) + " of " + event.tiddlerTitle;
				// Get the current value of the tiddler we're editing
				tiddler = this.wiki.getTiddler(event.tiddlerTitle);
				// Save the initial value of the draft tiddler
				this.wiki.addTiddler(new $tw.Tiddler(
					{
						text: "Type the text for the tiddler '" + event.tiddlerTitle + "'"
					},
					tiddler,
					{
						title: storyRecord.draft,
						"draft.title": event.tiddlerTitle,
						"draft.of": event.tiddlerTitle
					}));
			}
		}
		this.saveStory();
	}
	event.stopPropagation();
	return false;
};

// Take a tiddler out of edit mode, saving the changes
exports.eventMap["tw-SaveTiddler"] = function(event) {
	if(this.hasParameter("story")) {
		var storyTiddler, storyRecord, tiddler, storyTiddlerModified, t;
		this.getStory();
		storyTiddlerModified = false;
		for(t=0; t<this.story.tiddlers.length; t++) {
			storyRecord = this.story.tiddlers[t];
			if(storyRecord.draft === event.tiddlerTitle) {
				tiddler = this.wiki.getTiddler(storyRecord.draft);
				if(tiddler && $tw.utils.hop(tiddler.fields,"draft.title")) {
					// Save the draft tiddler as the real tiddler
					this.wiki.addTiddler(new $tw.Tiddler(tiddler,{title: tiddler.fields["draft.title"],"draft.title": undefined, "draft.of": undefined}));
					// Remove the draft tiddler
					this.wiki.deleteTiddler(storyRecord.draft);
					// Remove the original tiddler if we're renaming it
					if(tiddler.fields["draft.of"] !== tiddler.fields["draft.title"]) {
						this.wiki.deleteTiddler(tiddler.fields["draft.of"]);
					}
					// Make the story record point to the newly saved tiddler
					storyRecord.title = tiddler.fields["draft.title"];
					storyRecord.draft = undefined;
					// Check if we're modifying the story tiddler itself
					if(tiddler.fields["draft.title"] === this.params.story) {
						storyTiddlerModified = true;
					}
				}
			}
		}
		if(!storyTiddlerModified) {
			this.saveStory();
		}
	}
	event.stopPropagation();
	return false;
};

// Close a specified tiddler
exports.eventMap["tw-close"] = function(event) {
	if(this.hasParameter("story")) {
		var t,storyElement;
		this.getStory();
		// Look for tiddlers with this title to close
		for(t=this.story.tiddlers.length-1; t>=0; t--) {
			if(this.story.tiddlers[t].title === event.tiddlerTitle) {
				this.story.tiddlers.splice(t,1);
			}
		}
		this.saveStory();
	}
	event.stopPropagation();
	return false;
};

exports.executeMacro = function() {
	var attributes = {};
	if(this.classes) {
		attributes["class"] = this.classes.slice(0);
	}
	for(var t=0; t<this.content.length; t++) {
		this.content[t].execute(this.parents,this.tiddlerTitle);
	}
	return $tw.Tree.Element("div",attributes,this.content,{
		events: ["tw-navigate","tw-EditTiddler","tw-SaveTiddler","tw-close","tw-NavigateBack"],
		eventHandler: this
	});
};

})();
