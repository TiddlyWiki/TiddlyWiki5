/*\
title: $:/core/modules/macros/navigationcatcher.js
type: application/javascript
module-type: macro

Traps navigation events to update a story tiddler and history tiddler. Can also optionally capture navigation target in a specified text reference.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "navigationcatcher",
	params: {
		story: {byName: "default", type: "text"}, // Actually a tiddler, but we don't want it to be a dependency
		history: {byName: "default", type: "text"}, // Actually a tiddler, but we don't want it to be a dependency
		set: {byName: true, type: "tiddler"}
	}
};

exports.getList = function(title) {
	return this.wiki.getTextReference(title,"").split("\n");
};

exports.saveList = function(title,list) {
	var storyTiddler = this.wiki.getTiddler(title);
	this.wiki.addTiddler(new $tw.Tiddler({
		title: title
	},storyTiddler,{text: list.join("\n")}));
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
	this.story = this.getList(this.storyTitle);
	var t,tiddler,slot;
	// See if the tiddler is already there
	for(t=0; t<this.story.length; t++) {
		if(this.story[t].title === event.navigateTo) {
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
			for(t=0; t<this.story.length; t++) {
				if(this.story[t].title === navigateFromTitle) {
					slot = t + 1;
				}
			}	
		}
		// Add the tiddler
		this.story.splice(slot,0,event.navigateTo);
		// Save the story
		this.saveList(this.storyTitle,this.story);
	}
	// Set the tiddler if specified
	if(this.hasParameter("set")) {
		this.wiki.setTextReference(this.params.set,event.navigateTo);
	}
	// Add a new record to the top of the history stack
	this.history = this.getList(this.historyTitle);
	this.history.push(event.navigateTo);
	this.saveList(this.historyTitle,this.history);
	event.stopPropagation();
	return false;
};

// Close a specified tiddler
exports.eventMap["tw-close"] = function(event) {
	this.story = this.getList(this.storyTitle);
	// Look for tiddlers with this title to close
	for(var t=this.story.length-1; t>=0; t--) {
		if(this.story[t] === event.tiddlerTitle) {
			this.story.splice(t,1);
		}
	}
	this.saveList(this.storyTitle,this.story);
	event.stopPropagation();
	return false;
};

// Place a tiddler in edit mode
exports.eventMap["tw-EditTiddler"] = function(event) {
	this.story = this.getList(this.storyTitle);
	// Replace the specified tiddler with a draft in edit mode
	for(var t=0; t<this.story.length; t++) {
		if(this.story[t] === event.tiddlerTitle) {
			// Compute the title for the draft
			var draftTitle = "Draft " + (new Date()) + " of " + event.tiddlerTitle;
			this.story[t] = draftTitle;
			// Get the current value of the tiddler we're editing
			var tiddler = this.wiki.getTiddler(event.tiddlerTitle);
			// Save the initial value of the draft tiddler
			this.wiki.addTiddler(new $tw.Tiddler(
				{
					text: "Type the text for the tiddler '" + event.tiddlerTitle + "'"
				},
				tiddler,
				{
					title: draftTitle,
					"draft.title": event.tiddlerTitle,
					"draft.of": event.tiddlerTitle
				}));
		}
	}
	this.saveList(this.storyTitle,this.story);
	event.stopPropagation();
	return false;
};

// Take a tiddler out of edit mode, saving the changes
exports.eventMap["tw-SaveTiddler"] = function(event) {
	this.story = this.getList(this.storyTitle);
	var storyTiddlerModified = false;
	for(var t=0; t<this.story.length; t++) {
		if(this.story[t] === event.tiddlerTitle) {
			var tiddler = this.wiki.getTiddler(event.tiddlerTitle);
			if(tiddler && $tw.utils.hop(tiddler.fields,"draft.title")) {
				// Save the draft tiddler as the real tiddler
				this.wiki.addTiddler(new $tw.Tiddler(tiddler,{title: tiddler.fields["draft.title"],"draft.title": undefined, "draft.of": undefined}));
				// Remove the draft tiddler
				this.wiki.deleteTiddler(event.tiddlerTitle);
				// Remove the original tiddler if we're renaming it
				if(tiddler.fields["draft.of"] !== tiddler.fields["draft.title"]) {
					this.wiki.deleteTiddler(tiddler.fields["draft.of"]);
				}
				// Make the story record point to the newly saved tiddler
				this.story[t] = tiddler.fields["draft.title"];
				// Check if we're modifying the story tiddler itself
				if(tiddler.fields["draft.title"] === this.params.story) {
					storyTiddlerModified = true;
				}
			}
		}
	}
	if(!storyTiddlerModified) {
		this.saveList(this.storyTitle,this.story);
	}
	event.stopPropagation();
	return false;
};

// Create a new draft tiddler
exports.eventMap["tw-NewTiddler"] = function(event) {
	// Get the story details
	this.story = this.getList(this.storyTitle);
	// Create the new tiddler
	for(var t=0; true; t++) {
		var title = "New Tiddler" + (t ? " " + t : "");
		if(!this.wiki.tiddlerExists(title)) {
			break;
		}
	}
	var tiddler = new $tw.Tiddler({
		title: title,
		text: "Newly created tiddler"
	});
	this.wiki.addTiddler(tiddler);
	// Create the draft tiddler
	var draftTitle = "New Tiddler at " + (new Date()),
		draftTiddler = new $tw.Tiddler({
			text: "Type the text for the new tiddler",
			title: draftTitle,
			"draft.title": title,
			"draft.of": title
		});
	this.wiki.addTiddler(draftTiddler);
	// Update the story to put the new draft at the top
	this.story.splice(0,0,draftTitle);
	// Save the updated story
	this.saveList(this.storyTitle,this.story);
	// Add a new record to the top of the history stack
	this.history = this.getList(this.historyTitle);
	this.history.push(draftTitle);
	this.saveList(this.historyTitle,this.history);
	event.stopPropagation();
	return false;
};

exports.executeMacro = function() {
	// Compute the titles of the story and history list tiddlers
	this.storyTitle = this.params.story || "$:/StoryList";
	this.historyTitle = this.params.history || "$:/HistoryList";
	var attributes = {};
	if(this.classes) {
		attributes["class"] = this.classes.slice(0);
	}
	for(var t=0; t<this.content.length; t++) {
		this.content[t].execute(this.parents,this.tiddlerTitle);
	}
	return $tw.Tree.Element("div",attributes,this.content,{
		events: ["tw-navigate","tw-EditTiddler","tw-SaveTiddler","tw-close","tw-NavigateBack","tw-NewTiddler"],
		eventHandler: this
	});
};

})();
