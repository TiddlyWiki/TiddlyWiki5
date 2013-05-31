/*\
title: $:/core/modules/widgets/navigator.js
type: application/javascript
module-type: widget

Implements the navigator widget.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var NavigatorWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generate();
};

NavigatorWidget.prototype.generate = function() {
	// Get our parameters
	this.storyTitle = this.renderer.getAttribute("story");
	this.historyTitle = this.renderer.getAttribute("history");
	// Set the element
	this.tag = "div";
	this.attributes = {
		"class": "tw-navigator"
	};
	this.children = this.renderer.renderTree.createRenderers(this.renderer,this.renderer.parseTreeNode.children);
	this.events = [
		{name: "tw-navigate", handlerObject: this, handlerMethod: "handleNavigateEvent"},
		{name: "tw-edit-tiddler", handlerObject: this, handlerMethod: "handleEditTiddlerEvent"},
		{name: "tw-delete-tiddler", handlerObject: this, handlerMethod: "handleDeleteTiddlerEvent"},
		{name: "tw-save-tiddler", handlerObject: this, handlerMethod: "handleSaveTiddlerEvent"},
		{name: "tw-cancel-tiddler", handlerObject: this, handlerMethod: "handleCancelTiddlerEvent"},
		{name: "tw-close-tiddler", handlerObject: this, handlerMethod: "handleCloseTiddlerEvent"},
		{name: "tw-close-all-tiddlers", handlerObject: this, handlerMethod: "handleCloseAllTiddlersEvent"},
		{name: "tw-new-tiddler", handlerObject: this, handlerMethod: "handleNewTiddlerEvent"}
	];
};

NavigatorWidget.prototype.refreshInDom = function(changedAttributes,changedTiddlers) {
	// We don't need to refresh ourselves, so just refresh any child nodes
	$tw.utils.each(this.children,function(node) {
		if(node.refreshInDom) {
			node.refreshInDom(changedTiddlers);
		}
	});
};

NavigatorWidget.prototype.getStoryList = function() {
	var text = this.renderer.renderTree.wiki.getTextReference(this.storyTitle,"");
	if(text && text.length > 0) {
		this.storyList = text.split("\n");
	} else {
		this.storyList = [];
	}
};

NavigatorWidget.prototype.saveStoryList = function() {
	var storyTiddler = this.renderer.renderTree.wiki.getTiddler(this.storyTitle);
	this.renderer.renderTree.wiki.addTiddler(new $tw.Tiddler({
		title: this.storyTitle
	},storyTiddler,{text: this.storyList.join("\n")}));
};

NavigatorWidget.prototype.findTitleInStory = function(title,defaultIndex) {
	for(var t=0; t<this.storyList.length; t++) {
		if(this.storyList[t] === title) {
			return t;
		}
	}	
	return defaultIndex;
};

// Navigate to a specified tiddler
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
		var historyList = this.renderer.renderTree.wiki.getTiddlerData(this.historyTitle,[]);
		historyList.push({title: event.navigateTo, fromPageRect: event.navigateFromClientRect});
		this.renderer.renderTree.wiki.setTiddlerData(this.historyTitle,historyList);
	}
	event.stopPropagation();
	return false;
};

// Close a specified tiddler
NavigatorWidget.prototype.handleCloseTiddlerEvent = function(event) {
	this.getStoryList();
	// Look for tiddlers with this title to close
	var slot = this.findTitleInStory(event.tiddlerTitle,-1);
	if(slot !== -1) {
		this.storyList.splice(slot,1);
		this.saveStoryList();
	}
	event.stopPropagation();
	return false;
};

// Close all tiddlers
NavigatorWidget.prototype.handleCloseAllTiddlersEvent = function(event) {
	this.storyList = [];
	this.saveStoryList();
	event.stopPropagation();
	return false;
};

// Place a tiddler in edit mode
NavigatorWidget.prototype.handleEditTiddlerEvent = function(event) {
	this.getStoryList();
	// Replace the specified tiddler with a draft in edit mode
	for(var t=0; t<this.storyList.length; t++) {
		if(this.storyList[t] === event.tiddlerTitle) {
			// Compute the title for the draft
			var draftTitle = this.generateDraftTitle(event.tiddlerTitle);
			this.storyList[t] = draftTitle;
			// Get the current value of the tiddler we're editing
			var tiddler = this.renderer.renderTree.wiki.getTiddler(event.tiddlerTitle);
			// Save the initial value of the draft tiddler
			this.renderer.renderTree.wiki.addTiddler(new $tw.Tiddler(
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
	this.saveStoryList();
	event.stopPropagation();
	return false;
};

// Delete a tiddler
NavigatorWidget.prototype.handleDeleteTiddlerEvent = function(event) {
	// Get the tiddler title we're deleting
	var tiddler = this.renderer.renderTree.wiki.getTiddler(event.tiddlerTitle);
	// Check if the tiddler we're deleting is in draft mode
	if(tiddler.hasField("draft.title")) {
		// Delete the original tiddler
		this.renderer.renderTree.wiki.deleteTiddler(tiddler.fields["draft.of"]);
	}
	// Delete this tiddler
	this.renderer.renderTree.wiki.deleteTiddler(event.tiddlerTitle);
	// Remove the closed tiddler from the story
	this.getStoryList();
	// Look for tiddler with this title to close
	var slot = this.findTitleInStory(event.tiddlerTitle,-1);
	if(slot !== -1) {
		this.storyList.splice(slot,1);
		this.saveStoryList();
	}
	event.stopPropagation();
	return false;
};

/*
Generate a title for the draft of a given tiddler
*/
NavigatorWidget.prototype.generateDraftTitle = function(title) {
	var c = 0;
	do {
		var draftTitle = "Draft " + (c ? (c + 1) + " " : "") + "of '" + title + "'";
		c++;
	} while(this.renderer.renderTree.wiki.tiddlerExists(draftTitle));
	return draftTitle;
};

// Take a tiddler out of edit mode, saving the changes
NavigatorWidget.prototype.handleSaveTiddlerEvent = function(event) {
	this.getStoryList();
	var storyTiddlerModified = false;
	for(var t=0; t<this.storyList.length; t++) {
		if(this.storyList[t] === event.tiddlerTitle) {
			var tiddler = this.renderer.renderTree.wiki.getTiddler(event.tiddlerTitle);
			if(tiddler.hasField("draft.title")) {
				// Save the draft tiddler as the real tiddler
				this.renderer.renderTree.wiki.addTiddler(new $tw.Tiddler(tiddler,{
					title: tiddler.fields["draft.title"],
					modified: new Date(),
					"draft.title": undefined, 
					"draft.of": undefined
				}));
				// Remove the draft tiddler
				this.renderer.renderTree.wiki.deleteTiddler(event.tiddlerTitle);
				// Remove the original tiddler if we're renaming it
				if(tiddler.fields["draft.of"] !== tiddler.fields["draft.title"]) {
					this.renderer.renderTree.wiki.deleteTiddler(tiddler.fields["draft.of"]);
				}
				// Make the story record point to the newly saved tiddler
				this.storyList[t] = tiddler.fields["draft.title"];
				// Check if we're modifying the story tiddler itself
				if(tiddler.fields["draft.title"] === this.storyTitle) {
					storyTiddlerModified = true;
				}
			}
		}
	}
	if(!storyTiddlerModified) {
		this.saveStoryList();
	}
	event.stopPropagation();
	return false;
};

// Take a tiddler out of edit mode without saving the changes
NavigatorWidget.prototype.handleCancelTiddlerEvent = function(event) {
	this.getStoryList();
	var storyTiddlerModified = false;
	for(var t=0; t<this.storyList.length; t++) {
		if(this.storyList[t] === event.tiddlerTitle) {
			var tiddler = this.renderer.renderTree.wiki.getTiddler(event.tiddlerTitle);
			if(tiddler.hasField("draft.title")) {
				// Remove the draft tiddler
				this.renderer.renderTree.wiki.deleteTiddler(event.tiddlerTitle);
				// Make the story record point to the original tiddler
				this.storyList[t] = tiddler.fields["draft.title"];
				// Check if we're modifying the story tiddler itself
				if(tiddler.fields["draft.title"] === this.storyTitle) {
					storyTiddlerModified = true;
				}
			}
		}
	}
	if(!storyTiddlerModified) {
		this.saveStoryList();
	}
	event.stopPropagation();
	return false;
};

// Create a new draft tiddler
NavigatorWidget.prototype.handleNewTiddlerEvent = function(event) {
	// Get the story details
	this.getStoryList();
	// Create the new tiddler
	var title;
	for(var t=0; true; t++) {
		title = "New Tiddler" + (t ? " " + t : "");
		if(!this.renderer.renderTree.wiki.tiddlerExists(title)) {
			break;
		}
	}
	var tiddler = new $tw.Tiddler({
		title: title,
		text: "Newly created tiddler"
	});
	this.renderer.renderTree.wiki.addTiddler(tiddler);
	// Create the draft tiddler
	var draftTitle = this.generateDraftTitle(title),
		draftTiddler = new $tw.Tiddler({
			text: "Type the text for the new tiddler",
			title: draftTitle,
			"draft.title": title,
			"draft.of": title
		});
	this.renderer.renderTree.wiki.addTiddler(draftTiddler);
	// Update the story to insert the new draft at the top
	var slot = this.findTitleInStory(event.navigateFromTitle,-1) + 1;
	this.storyList.splice(slot,0,draftTitle);
	// Save the updated story
	this.saveStoryList();
	// Add a new record to the top of the history stack
	var history = this.renderer.renderTree.wiki.getTiddlerData(this.historyTitle,[]);
	history.push({title: draftTitle});
	this.renderer.renderTree.wiki.setTiddlerData(this.historyTitle,history);
	event.stopPropagation();
	return false;
};

exports.navigator = NavigatorWidget;

})();
