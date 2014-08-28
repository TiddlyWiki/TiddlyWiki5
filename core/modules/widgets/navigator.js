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

var IMPORT_TITLE = "$:/Import";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var NavigatorWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
	this.addEventListeners([
		{type: "tm-navigate", handler: "handleNavigateEvent"},
		{type: "tm-edit-tiddler", handler: "handleEditTiddlerEvent"},
		{type: "tm-delete-tiddler", handler: "handleDeleteTiddlerEvent"},
		{type: "tm-save-tiddler", handler: "handleSaveTiddlerEvent"},
		{type: "tm-cancel-tiddler", handler: "handleCancelTiddlerEvent"},
		{type: "tm-close-tiddler", handler: "handleCloseTiddlerEvent"},
		{type: "tm-close-all-tiddlers", handler: "handleCloseAllTiddlersEvent"},
		{type: "tm-close-other-tiddlers", handler: "handleCloseOtherTiddlersEvent"},
		{type: "tm-new-tiddler", handler: "handleNewTiddlerEvent"},
		{type: "tm-import-tiddlers", handler: "handleImportTiddlersEvent"},
		{type: "tm-perform-import", handler: "handlePerformImportEvent"}
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
	this.wiki.addToHistory(title,fromPageRect,this.historyTitle);
};

/*
Handle a tm-navigate event
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
	var self = this;
	function isUnmodifiedShadow(title) {
		// jshint eqnull:true
		var tiddler = self.wiki.getTiddler(title);
		return (
			self.wiki.isShadowTiddler(title) &&
			tiddler.fields.modified == null
		);
	}
	function confirmEditShadow(title) {
		return confirm($tw.language.getString(
			"ConfirmEditShadowTiddler",
			{variables:
				{title: title}
			}
		));
	}
	var title = event.param || event.tiddlerTitle;
	if(isUnmodifiedShadow(title) && !confirmEditShadow(title)) {
		return false;
	}
	// Replace the specified tiddler with a draft in edit mode
	var draftTiddler = this.makeDraftTiddler(title),
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
		storyList = this.getStoryList(),
		originalTitle, confirmationTitle;
	// Check if the tiddler we're deleting is in draft mode
	if(tiddler.hasField("draft.title")) {
		// If so, we'll prompt for confirmation referencing the original tiddler
		originalTitle = tiddler.fields["draft.of"];
		confirmationTitle = originalTitle;
	} else {
		// If not a draft, then prompt for confirmation referencing the specified tiddler
		originalTitle = null;
		confirmationTitle = title;
	}
	// Seek confirmation
	if(!confirm($tw.language.getString(
				"ConfirmDeleteTiddler",
				{variables:
					{title: confirmationTitle}
				}
			))) {
		return false;
	}
	// Delete the original tiddler
	if(originalTitle) {
		this.wiki.deleteTiddler(originalTitle);
		this.removeTitleFromStory(storyList,originalTitle);
	}
	// Delete this tiddler
	this.wiki.deleteTiddler(title);
	// Remove the closed tiddler from the story
	this.removeTitleFromStory(storyList,title);
	this.saveStoryList(storyList);
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
		storyList = this.getStoryList();
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
			if(!isRename && !this.wiki.isDraftModified(title)) {
				event.type = "tm-cancel-tiddler";
				this.dispatchEvent(event);
			} else if(isConfirmed) {
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
		// Ask for confirmation if the tiddler text has changed
		var isConfirmed = true;
		if(this.wiki.getTiddlerText(draftTitle) !== this.wiki.getTiddlerText(originalTitle)) {
			isConfirmed = confirm($tw.language.getString(
				"ConfirmCancelTiddler",
				{variables:
					{title: draftTitle}
				}
			));
		}
		// Remove the draft tiddler
		if(isConfirmed) {
			this.wiki.deleteTiddler(draftTitle);
			this.replaceFirstTitleInStory(storyList,draftTitle,originalTitle);
			this.addToHistory(originalTitle,event.navigateFromClientRect);
			this.saveStoryList(storyList);
		}
	}
	return false;
};

// Create a new draft tiddler
NavigatorWidget.prototype.handleNewTiddlerEvent = function(event) {
	// Get the story details
	var storyList = this.getStoryList();
	// Get the template tiddler if there is one
	var templateTiddler = this.wiki.getTiddler(event.param);
	// Title the new tiddler
	var title = this.wiki.generateNewTitle((templateTiddler && templateTiddler.fields.title) || "New Tiddler");
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

// Import JSON tiddlers into a pending import tiddler
NavigatorWidget.prototype.handleImportTiddlersEvent = function(event) {
	var self = this;
	// Get the tiddlers
	var tiddlers = [];
	try {
		tiddlers = JSON.parse(event.param);	
	} catch(e) {
	}
	// Get the current $:/Import tiddler
	var importTiddler = this.wiki.getTiddler(IMPORT_TITLE),
		importData = this.wiki.getTiddlerData(IMPORT_TITLE,{}),
		newFields = new Object({
			title: IMPORT_TITLE,
			type: "application/json",
			"plugin-type": "import",
			"status": "pending"
		}),
		incomingTiddlers = [];
	// Process each tiddler
	importData.tiddlers = importData.tiddlers || {};
	$tw.utils.each(tiddlers,function(tiddlerFields) {
		var title = tiddlerFields.title;
		if(title) {
			incomingTiddlers.push(title);
			importData.tiddlers[title] = tiddlerFields;
		}
	});
	// Give the active upgrader modules a chance to process the incoming tiddlers
	var messages = this.wiki.invokeUpgraders(incomingTiddlers,importData.tiddlers);
	$tw.utils.each(messages,function(message,title) {
		newFields["message-" + title] = message;
	});
	// Deselect any suppressed tiddlers
	$tw.utils.each(importData.tiddlers,function(tiddler,title) {
		if($tw.utils.count(tiddler) === 0) {
			newFields["selection-" + title] = "unchecked";
		}
	});
	// Save the $:/Import tiddler
	newFields.text = JSON.stringify(importData,null,$tw.config.preferences.jsonSpaces);
	this.wiki.addTiddler(new $tw.Tiddler(importTiddler,newFields));
	// Update the story and history details
	if(this.getVariable("tw-auto-open-on-import") !== "no") {
		var storyList = this.getStoryList(),
			history = [];
		// Add it to the story
		if(storyList.indexOf(IMPORT_TITLE) === -1) {
			storyList.unshift(IMPORT_TITLE);
		}
		// And to history
		history.push(IMPORT_TITLE);
		// Save the updated story and history
		this.saveStoryList(storyList);
		this.addToHistory(history);		
	}
	return false;
};

// 
NavigatorWidget.prototype.handlePerformImportEvent = function(event) {
	var self = this,
		importTiddler = this.wiki.getTiddler(event.param),
		importData = this.wiki.getTiddlerData(event.param,{tiddlers: {}}),
		importReport = [];
	// Add the tiddlers to the store
	importReport.push("The following tiddlers were imported:\n");
	$tw.utils.each(importData.tiddlers,function(tiddlerFields) {
		var title = tiddlerFields.title;
		if(title && importTiddler && importTiddler.fields["selection-" + title] !== "unchecked") {
			self.wiki.addTiddler(new $tw.Tiddler(tiddlerFields));
			importReport.push("# [[" + tiddlerFields.title + "]]");
		}
	});
	// Replace the $:/Import tiddler with an import report
	this.wiki.addTiddler(new $tw.Tiddler({
		title: IMPORT_TITLE,
		text: importReport.join("\n"),
		"status": "complete"
	}));
	// Navigate to the $:/Import tiddler
	this.addToHistory([IMPORT_TITLE]);
};

exports.navigator = NavigatorWidget;

})();
