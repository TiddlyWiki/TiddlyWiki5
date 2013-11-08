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
		{type: "tw-new-tiddler", handler: "handleNewTiddlerEvent"},
		{type: "tw-import-tiddlers", handler: "handleImportTiddlersEvent"},
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

// Close a specified tiddler
NavigatorWidget.prototype.handleCloseTiddlerEvent = function(event) {
	this.getStoryList();
	// Look for tiddlers with this title to close
	var slot = this.findTitleInStory(event.tiddlerTitle,-1);
	if(slot !== -1) {
		this.storyList.splice(slot,1);
		this.saveStoryList();
	}
	return false;
};

// Close all tiddlers
NavigatorWidget.prototype.handleCloseAllTiddlersEvent = function(event) {
	this.storyList = [];
	this.saveStoryList();
	return false;
};

// Place a tiddler in edit mode
NavigatorWidget.prototype.handleEditTiddlerEvent = function(event) {
	this.getStoryList();
	// Replace the specified tiddler with a draft in edit mode
	var draftTiddler = this.getDraftTiddler(event.tiddlerTitle),
		gotOne = false;
	for(var t=this.storyList.length-1; t>=0; t--) {
		// Replace the first story instance of the original tiddler name with the draft title
		if(this.storyList[t] === event.tiddlerTitle) {
			if(!gotOne) {
				this.storyList[t] = draftTiddler.fields.title;
				gotOne = true;
			} else {
				this.storyList.splice(t,1);
			}
		} else if(this.storyList[t] === draftTiddler.fields.title) {
			// Remove any existing references to the draft
			this.storyList.splice(t,1);
		}
	}
	this.saveStoryList();
	return false;
};

// Delete a tiddler
NavigatorWidget.prototype.handleDeleteTiddlerEvent = function(event) {
	// Get the tiddler we're deleting
	var tiddler = this.wiki.getTiddler(event.tiddlerTitle);
	// Check if the tiddler we're deleting is in draft mode
	if(tiddler.hasField("draft.title")) {
		// Delete the original tiddler
		this.wiki.deleteTiddler(tiddler.fields["draft.of"]);
	}
	// Delete this tiddler
	this.wiki.deleteTiddler(event.tiddlerTitle);
	// Remove the closed tiddler from the story
	this.getStoryList();
	// Look for tiddler with this title to close
	var slot = this.findTitleInStory(event.tiddlerTitle,-1);
	if(slot !== -1) {
		this.storyList.splice(slot,1);
		this.saveStoryList();
	}
	return false;
};

/*
Create/reuse the draft tiddler for a given title
*/
NavigatorWidget.prototype.getDraftTiddler = function(targetTitle) {
	// See if there is already a draft tiddler for this tiddler
	var drafts = [];
	this.wiki.forEachTiddler(function(title,tiddler) {
		if(tiddler.fields["draft.title"] && tiddler.fields["draft.of"] === targetTitle) {
			drafts.push(tiddler);
		}
	});
	if(drafts.length > 0) {
		return drafts[0];
	}
	// Get the current value of the tiddler we're editing
	var tiddler = this.wiki.getTiddler(targetTitle),
		draftTitle = this.generateDraftTitle(targetTitle);
	// Save the initial value of the draft tiddler
	var draftTiddler = new $tw.Tiddler(
			{text: "Type the text for the tiddler '" + targetTitle + "'"},
			tiddler,
			{
				title: draftTitle,
				"draft.title": targetTitle,
				"draft.of": targetTitle
			},
			this.wiki.getModificationFields()
		);
	this.wiki.addTiddler(draftTiddler);
	return draftTiddler;
};

/*
Generate a title for the draft of a given tiddler
*/
NavigatorWidget.prototype.generateDraftTitle = function(title) {
	var c = 0;
	do {
		var draftTitle = "Draft " + (c ? (c + 1) + " " : "") + "of '" + title + "'";
		c++;
	} while(this.wiki.tiddlerExists(draftTitle));
	return draftTitle;
};

// Take a tiddler out of edit mode, saving the changes
NavigatorWidget.prototype.handleSaveTiddlerEvent = function(event) {
	this.getStoryList();
	var storyTiddlerModified = false; // We have to special case saving the story tiddler itself
	for(var t=0; t<this.storyList.length; t++) {
		if(this.storyList[t] === event.tiddlerTitle) {
			var tiddler = this.wiki.getTiddler(event.tiddlerTitle);
			if(tiddler) {
				var draftTitle = tiddler.fields["draft.title"],
					draftOf = tiddler.fields["draft.of"];
				if(draftTitle) {
					var isRename = draftOf !== draftTitle,
						isConfirmed = true;
					if(isRename && this.wiki.tiddlerExists(draftTitle)) {
						isConfirmed = confirm("Do you wish to overwrite the tiddler '" + draftTitle + "'?");
					}
					if(isConfirmed) {
						// Save the draft tiddler as the real tiddler
						this.wiki.addTiddler(new $tw.Tiddler(this.wiki.getCreationFields(),tiddler,{
							title: draftTitle,
							"draft.title": undefined, 
							"draft.of": undefined
						},this.wiki.getModificationFields()));
						// Remove the draft tiddler
						this.wiki.deleteTiddler(event.tiddlerTitle);
						// Remove the original tiddler if we're renaming it
						if(isRename) {
							this.wiki.deleteTiddler(draftOf);
						}
						// Make the story record point to the newly saved tiddler
						this.storyList[t] = draftTitle;
						// Check if we're modifying the story tiddler itself
						if(draftTitle === this.storyTitle) {
							storyTiddlerModified = true;
						}
					}
				}
			}
		}
	}
	if(!storyTiddlerModified) {
		this.saveStoryList();
	}
	return false;
};

// Take a tiddler out of edit mode without saving the changes
NavigatorWidget.prototype.handleCancelTiddlerEvent = function(event) {
	this.getStoryList();
	var storyTiddlerModified = false;
	for(var t=0; t<this.storyList.length; t++) {
		if(this.storyList[t] === event.tiddlerTitle) {
			var tiddler = this.wiki.getTiddler(event.tiddlerTitle);
			if(tiddler && tiddler.hasField("draft.title")) {
				// Remove the draft tiddler
				this.wiki.deleteTiddler(event.tiddlerTitle);
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
		if(!this.wiki.tiddlerExists(title)) {
			break;
		}
	}
	var tiddler = new $tw.Tiddler(this.wiki.getCreationFields(),{
		title: title,
		text: "Newly created tiddler"
	},this.wiki.getModificationFields());
	this.wiki.addTiddler(tiddler);
	// Create the draft tiddler
	var draftTitle = this.generateDraftTitle(title),
		draftTiddler = new $tw.Tiddler({
			text: "Type the text for the new tiddler",
			title: draftTitle,
			"draft.title": title,
			"draft.of": title
		},this.wiki.getModificationFields());
	this.wiki.addTiddler(draftTiddler);
	// Update the story to insert the new draft at the top
	var slot = this.findTitleInStory(event.navigateFromTitle,-1) + 1;
	this.storyList.splice(slot,0,draftTitle);
	// Save the updated story
	this.saveStoryList();
	// Add a new record to the top of the history stack
	var history = this.wiki.getTiddlerData(this.historyTitle,[]);
	history.push({title: draftTitle});
	this.wiki.setTiddlerData(this.historyTitle,history);
	return false;
};

// Import JSON tiddlers
NavigatorWidget.prototype.handleImportTiddlersEvent = function(event) {
	var self = this;
	// Get the story and history details
	this.getStoryList();
	var history = this.wiki.getTiddlerData(this.historyTitle,[]);
	// Get the tiddlers
	var tiddlers = [];
	try {
		tiddlers = JSON.parse(event.param);	
	} catch(e) {
	}
	// Process each tiddler
	$tw.utils.each(tiddlers,function(tiddlerFields) {
		// Generate a unique title for the tiddler
		var title = self.wiki.generateNewTitle(tiddlerFields.title);
		// Add it to the store
		self.wiki.addTiddler(new $tw.Tiddler(
			self.wiki.getCreationFields(),
			tiddlerFields,
			self.wiki.getModificationFields(),
			{title: title}
		));
		// Add it to the story
		if(self.storyList.indexOf(title) === -1) {
			self.storyList.unshift(title);
		}
		// And to history
		history.push({title: title});
	});
	// Save the updated story and history
	this.saveStoryList();
	this.wiki.setTiddlerData(this.historyTitle,history);
	return false;
};

exports.navigator = NavigatorWidget;

})();
