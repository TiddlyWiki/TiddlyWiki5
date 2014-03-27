/*\
title: $:/core/modules/widgets/navigator.js
type: application/javascript
module-type: widget

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
		{type: "tw-navigate", handler: "handleNavigateEvent"},
		{type: "tw-edit-tiddler", handler: "handleEditTiddlerEvent"},
		{type: "tw-delete-tiddler", handler: "handleDeleteTiddlerEvent"},
		{type: "tw-save-tiddler", handler: "handleSaveTiddlerEvent"},
		{type: "tw-cancel-tiddler", handler: "handleCancelTiddlerEvent"},
		{type: "tw-close-tiddler", handler: "handleCloseTiddlerEvent"},
		{type: "tw-close-all-tiddlers", handler: "handleCloseAllTiddlersEvent"},
		{type: "tw-close-other-tiddlers", handler: "handleCloseOtherTiddlersEvent"},
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
	return this.storyTitle ? this.wiki.getTiddlerList(this.storyTitle) : null;
};

NavigatorWidget.prototype.saveStoryList = function(storyList) {
	var storyTiddler = this.wiki.getTiddler(this.storyTitle);
	this.wiki.addTiddler(new $tw.Tiddler(
		{title: this.storyTitle},
		storyTiddler,
		{list: storyList}
	));
};

NavigatorWidget.prototype.findTitleInStory = function(storyList,title,defaultIndex) {
	var p = storyList.indexOf(title);
	return p === -1 ? defaultIndex : p;
};

NavigatorWidget.prototype.removeTitleFromStory = function(storyList,title) {
	var p = storyList.indexOf(title);
	while(p !== -1) {
		storyList.splice(p,1);
		p = storyList.indexOf(title);
	}
};

NavigatorWidget.prototype.replaceFirstTitleInStory = function(storyList,oldTitle,newTitle) {
	var pos = storyList.indexOf(oldTitle);
	if(pos !== -1) {
		storyList[pos] = newTitle;
		do {
			pos = storyList.indexOf(oldTitle,pos + 1);
			if(pos !== -1) {
				storyList.splice(pos,1);
			}
		} while(pos !== -1);
	} else {
		storyList.splice(0,0,newTitle);
	}
};

NavigatorWidget.prototype.addToStory = function(title,fromTitle) {
	var storyList = this.getStoryList();
	if(storyList) {
		// See if the tiddler is already there
		var slot = this.findTitleInStory(storyList,title,-1);
		// If not we need to add it
		if(slot === -1) {
			// First we try to find the position of the story element we navigated from
			slot = this.findTitleInStory(storyList,fromTitle,-1) + 1;
			// Add the tiddler
			storyList.splice(slot,0,title);
			// Save the story
			this.saveStoryList(storyList);
		}
	}
};

/*
Add a new record to the top of the history stack
title: a title string or an array of title strings
fromPageRect: page coordinates of the origin of the navigation
*/
NavigatorWidget.prototype.addToHistory = function(title,fromPageRect) {
	var titles = $tw.utils.isArray(title) ? title : [title];
	// Add a new record to the top of the history stack
	if(this.historyTitle) {
		var historyList = this.wiki.getTiddlerData(this.historyTitle,[]);
		$tw.utils.each(titles,function(title) {
			historyList.push({title: title, fromPageRect: fromPageRect});
		});
		this.wiki.setTiddlerData(this.historyTitle,historyList,{"current-tiddler": titles[titles.length-1]});
		this.wiki.addTiddler(new $tw.Tiddler());
	}
};

/*
Handle a tw-navigate event
*/
NavigatorWidget.prototype.handleNavigateEvent = function(event) {
	this.addToStory(event.navigateTo,event.navigateFromTitle);
	if(!event.navigateSuppressNavigation) {
		this.addToHistory(event.navigateTo,event.navigateFromClientRect);
	}
	return false;
};

// Close a specified tiddler
NavigatorWidget.prototype.handleCloseTiddlerEvent = function(event) {
	var title = event.param || event.tiddlerTitle,
		storyList = this.getStoryList();
	// Look for tiddlers with this title to close
	this.removeTitleFromStory(storyList,title);
	this.saveStoryList(storyList);
	return false;
};

// Close all tiddlers
NavigatorWidget.prototype.handleCloseAllTiddlersEvent = function(event) {
	this.saveStoryList([]);
	return false;
};

// Close other tiddlers
NavigatorWidget.prototype.handleCloseOtherTiddlersEvent = function(event) {
	var title = event.param || event.tiddlerTitle;
	this.saveStoryList([title]);
	return false;
};

// Place a tiddler in edit mode
NavigatorWidget.prototype.handleEditTiddlerEvent = function(event) {
	// Replace the specified tiddler with a draft in edit mode
	var title = event.param || event.tiddlerTitle,
		draftTiddler = this.makeDraftTiddler(title),
		draftTitle = draftTiddler.fields.title,
		storyList = this.getStoryList();
	this.removeTitleFromStory(storyList,draftTitle);
	this.replaceFirstTitleInStory(storyList,title,draftTitle);
	this.addToHistory(draftTitle,event.navigateFromClientRect);
	this.saveStoryList(storyList);
	return false;
};

// Delete a tiddler
NavigatorWidget.prototype.handleDeleteTiddlerEvent = function(event) {
	// Get the tiddler we're deleting
	var title = event.param || event.tiddlerTitle,
		tiddler = this.wiki.getTiddler(title),
		storyList = this.getStoryList();
	// Check if the tiddler we're deleting is in draft mode
	if(tiddler.hasField("draft.title")) {
		// Delete the original tiddler
		var originalTitle = tiddler.fields["draft.of"];
		// Ask for confirmation if the tiddler has changed
		if(!confirm($tw.language.getString(
					"ConfirmDeleteTiddler",
					{variables:
						{title: originalTitle}
					}
				))) {
			return false;
		}
		this.wiki.deleteTiddler(originalTitle);
		this.removeTitleFromStory(storyList,originalTitle);
	}
	// Delete this tiddler
	this.wiki.deleteTiddler(title);
	// Remove the closed tiddler from the story
	this.removeTitleFromStory(storyList,title);
	this.saveStoryList(storyList);
	// Send a notification event
	this.dispatchEvent({type: "tw-auto-save-wiki"});
	return false;
};

/*
Create/reuse the draft tiddler for a given title
*/
NavigatorWidget.prototype.makeDraftTiddler = function(targetTitle) {
	// See if there is already a draft tiddler for this tiddler
	var drafts = [];
	this.wiki.forEachTiddler({includeSystem: true},function(title,tiddler) {
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
	var title = event.param || event.tiddlerTitle,
		tiddler = this.wiki.getTiddler(title),
		storyList = this.getStoryList(),
		storyTiddlerModified = false; // We have to special case saving the story tiddler itself
	// Replace the original tiddler with the draft
	if(tiddler) {
		var draftTitle = (tiddler.fields["draft.title"] || "").trim(),
			draftOf = (tiddler.fields["draft.of"] || "").trim();
		if(draftTitle) {
			var isRename = draftOf !== draftTitle,
				isConfirmed = true;
			if(isRename && this.wiki.tiddlerExists(draftTitle)) {
				isConfirmed = confirm($tw.language.getString(
					"ConfirmOverwriteTiddler",
					{variables:
						{title: draftTitle}
					}
				));
			}
			if(isConfirmed) {
				// Save the draft tiddler as the real tiddler
				this.wiki.addTiddler(new $tw.Tiddler(this.wiki.getCreationFields(),tiddler,{
					title: draftTitle,
					"draft.title": undefined, 
					"draft.of": undefined
				},this.wiki.getModificationFields()));
				// Remove the draft tiddler
				this.wiki.deleteTiddler(title);
				// Remove the original tiddler if we're renaming it
				if(isRename) {
					this.wiki.deleteTiddler(draftOf);
				}
				// Replace the draft in the story with the original
				this.replaceFirstTitleInStory(storyList,title,draftTitle);
				this.addToHistory(draftTitle,event.navigateFromClientRect);
				if(draftTitle !== this.storyTitle) {
					this.saveStoryList(storyList);
				}
				// Send a notification event
				this.dispatchEvent({type: "tw-auto-save-wiki"});
			}
		}
	}
	return false;
};

// Take a tiddler out of edit mode without saving the changes
NavigatorWidget.prototype.handleCancelTiddlerEvent = function(event) {
	// Flip the specified tiddler from draft back to the original
	var draftTitle = event.param || event.tiddlerTitle,
		draftTiddler = this.wiki.getTiddler(draftTitle),
		originalTitle = draftTiddler.fields["draft.of"],
		storyList = this.getStoryList();
	if(draftTiddler && originalTitle) {
		// Remove the draft tiddler
		this.wiki.deleteTiddler(draftTitle);
		this.replaceFirstTitleInStory(storyList,draftTitle,originalTitle);
		this.addToHistory(originalTitle,event.navigateFromClientRect);
		this.saveStoryList(storyList);
	}
	return false;
};

// Create a new draft tiddler
NavigatorWidget.prototype.handleNewTiddlerEvent = function(event) {
	// Get the story details
	var storyList = this.getStoryList();
	// Get the template tiddler if there is one
	var parseTiddler = false;
	if(event.param) parseTiddler = (event.param.indexOf("\n") != -1);
	var templateTiddler = parseTiddler ? new $tw.Tiddler($tw.wiki.deserializeTiddlers("application/x-tiddler", event.param)[0]) : this.wiki.getTiddler(event.param);
	// Create the new tiddler
	var title = this.wiki.generateNewTitle((templateTiddler && templateTiddler.fields.title) || "New Tiddler");
	var tiddler = new $tw.Tiddler(this.wiki.getCreationFields(),{
		text: "Newly created tiddler",
		title: title
	},this.wiki.getModificationFields());
	this.wiki.addTiddler(tiddler);
	// Create the draft tiddler
	var draftTitle = this.generateDraftTitle(title),
		draftTiddler = new $tw.Tiddler({
			text: ""
		},templateTiddler,
		this.wiki.getCreationFields(),
		{
			title: draftTitle,
			"draft.title": title,
			"draft.of": title
		},this.wiki.getModificationFields());
	this.wiki.addTiddler(draftTiddler);
	// Update the story to insert the new draft at the top
	var slot = storyList.indexOf(event.navigateFromTitle);
	storyList.splice(slot + 1,0,draftTitle);
	// Save the updated story
	this.saveStoryList(storyList);
	// Add a new record to the top of the history stack
	this.addToHistory(draftTitle);
	return false;
};

// Import JSON tiddlers
NavigatorWidget.prototype.handleImportTiddlersEvent = function(event) {
	var self = this;
	// Get the tiddlers
	var tiddlers = [];
	try {
		tiddlers = JSON.parse(event.param);	
	} catch(e) {
	}
	// Process each tiddler
	var importedTiddlers = [];
	$tw.utils.each(tiddlers,function(tiddlerFields) {
		var title = tiddlerFields.title;
		// Add it to the store
		var imported = self.wiki.importTiddler(new $tw.Tiddler(
			self.wiki.getCreationFields(),
			self.wiki.getModificationFields(),
			tiddlerFields
		));
		if(imported) {
			importedTiddlers.push(title);
		}
	});
	// Get the story and history details
	var storyList = this.getStoryList(),
		history = [];
	// Create the import report tiddler
	if(importedTiddlers.length === 0) {
		return false;
	}
	var title;
	if(importedTiddlers.length > 1) {
		title = this.wiki.generateNewTitle("$:/temp/ImportReport");
		var tiddlerFields = {
			title: title,
			text: "# [[" + importedTiddlers.join("]]\n# [[") + "]]\n"
		};
		this.wiki.addTiddler(new $tw.Tiddler(
			self.wiki.getCreationFields(),
			tiddlerFields,
			self.wiki.getModificationFields()
		));
	} else {
		title = importedTiddlers[0];
	}
	// Add it to the story
	if(storyList.indexOf(title) === -1) {
		storyList.unshift(title);
	}
	// And to history
	history.push(title);
	// Save the updated story and history
	this.saveStoryList(storyList);
	this.addToHistory(history);
	return false;
};

exports.navigator = NavigatorWidget;

})();
