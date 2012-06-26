/*\
title: $:/core/modules/macros/story/story.js
type: application/javascript
module-type: macro

Displays a sequence of tiddlers defined in two JSON structures. The story tiddler is the sequence of tiddlers currently present in the DOM:

	{
		tiddlers: [
			{title: <string>, draft: <string>}
		]
	}

The optional `draft` member indicates that the tiddler is in edit mode, and the value is the title of the tiddler being used as the draft.

When the story tiddler changes, the story macro adjusts the DOM to match. An optional storyview plugin can be used to visualise the changes.

And the history tiddler is the stack of tiddlers that were navigated to in turn:

	{
		stack: [
			{title: <string>}
		]
	}

The history stack is updated during navigation, and again the storyview plugin is given an opportunity to animate the navigation.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "story",
	params: {
		story: {byName: "default", type: "tiddler"},
		history: {byName: "default", type: "tiddler"},
		defaultViewTemplate: {byName: true, type: "tiddler"},
		defaultEditTemplate: {byName: true, type: "tiddler"},
		storyviewTiddler: {byName: true, type: "tiddler"},
		storyview: {byName: true, type: "text"}
	}
};

/*
Get the data from the JSON story tiddler
*/
exports.getStory = function() {
	var storyTiddler = this.wiki.getTiddler(this.params.story);
	this.story = {
		tiddlers: []
	};
	if(storyTiddler && $tw.utils.hop(storyTiddler.fields,"text")) {
		this.story = JSON.parse(storyTiddler.fields.text);
	}
};

exports.getHistory = function() {
	var historyTiddler = this.wiki.getTiddler(this.params.history);
	this.history = {stack: []};
	if(historyTiddler && $tw.utils.hop(historyTiddler.fields,"text")) {
		this.history = JSON.parse(historyTiddler.fields.text);
	}
};

exports.getViewTemplate = function() {
	if(this.hasParameter("defaultViewTemplate")) {
		return this.params.defaultViewTemplate;
	} else {
		return "$:/templates/ViewTemplate";
	}
};

exports.getEditTemplate = function() {
	if(this.hasParameter("defaultEditTemplate")) {
		return this.params.defaultEditTemplate;
	} else {
		return "$:/templates/EditTemplate";
	}
};

/*
Create a story element representing a given tiddler, optionally being editted
*/
exports.createStoryElement = function(title,draft) {
	var node = this.createStoryElementMacro(title,draft),
		eventHandler = {handleEvent: function(event) {
			// Add context information to the event
			event.navigateFromStoryElement = node;
			event.navigateFromTitle = title;
			return true;
		}};
	node.execute(this.parents,this.tiddlerTitle);
	var storyElement = $tw.Tree.Element("div",{"class": ["tw-story-element"]},[node],{
			events: ["tw-navigate","tw-EditTiddler","tw-SaveTiddler","tw-CloseTiddler"],
			eventHandler: eventHandler
		});
	// Save our data inside the story element node
	storyElement.storyElementInfo = {title: title};
	if(draft) {
		storyElement.storyElementInfo.draft = draft;
	}
	return storyElement;
};

/*
Create the tiddler macro needed to represent a given tiddler and its draft status
*/
exports.createStoryElementMacro = function(title,draft) {
	var srcParams;
	if(draft) {
		srcParams = {target: draft, template: this.getEditTemplate()};
	} else {
		srcParams = {target: title, template: this.getViewTemplate()};
	}
	return $tw.Tree.Macro("tiddler",{
			srcParams: srcParams,
			wiki: this.wiki
		});
};

/*
Remove a story element from the story, along with the attendant DOM nodes
*/
exports.removeStoryElement = function(storyElementIndex) {
	var storyElement = this.storyNode.children[storyElementIndex];
	// Invoke the storyview to animate the removal
	if(this.storyview && this.storyview.remove) {
		if(!this.storyview.remove(storyElement)) {
			// Only delete the DOM element if the storyview.remove() returned false
			storyElement.domNode.parentNode.removeChild(storyElement.domNode);
		}
	}
	// Then delete the actual renderer node
	this.storyNode.children.splice(storyElementIndex,1);
};

/*
Return the index of the story element that corresponds to a particular title
startIndex: index to start search (use zero to search from the top)
tiddlerTitle: tiddler title to seach for
*/
exports.findStoryElementByTitle = function(startIndex,tiddlerTitle) {
	while(startIndex < this.storyNode.children.length) {
		if(this.storyNode.children[startIndex].storyElementInfo.title === tiddlerTitle) {
			return startIndex;
		}
		startIndex++;
	}
	return undefined;
};

exports.executeMacro = function() {
	// Get the story object
	this.getStory();
	// Create the story frame
	var attributes = {"class": "tw-story-frame"};
	this.storyNode = $tw.Tree.Element("div",attributes,[]);
	// Create each story element
	for(var t=0; t<this.story.tiddlers.length; t++) {
		this.storyNode.children.push(this.createStoryElement(this.story.tiddlers[t].title,this.story.tiddlers[t].draft));
	}
	if(this.classes) {
		$tw.utils.pushTop(attributes["class"],this.classes);
	}
	return this.storyNode;
};

exports.postRenderInDom = function() {
	// Reset the record of the previous history stack
	this.prevHistory = {stack: []};
	// Instantiate the story view
	var storyviewName;
	if(this.hasParameter("storyviewTiddler")) {
		storyviewName = this.wiki.getTextReference(this.params.storyviewTiddler);
	}
	if(!storyviewName && this.hasParameter("storyview")) {
		storyviewName = this.params.storyview;
	}
	var StoryView = this.wiki.macros.story.viewers[storyviewName];
	if(StoryView) {
		this.storyview = new StoryView(this);
	}
	if(!this.storyview) {
		StoryView = this.wiki.macros.story.viewers.classic;
		if(StoryView) {
			this.storyview = new StoryView(this);
		}
	}
};

exports.refreshInDom = function(changes) {
	// If the storyview has changed we'll have to completely re-execute the macro
	if(this.hasParameter("storyviewTiddler") && $tw.utils.hop(changes,this.params.storyviewTiddler)) {
		// This logic should be reused from the base macro class, and not duplicated
		var child = this.child;
		while(!child.domNode && child.child) {
			child = child.child;
		}
		var parentDomNode = child.domNode.parentNode,
			insertBefore = child.domNode.nextSibling;
		parentDomNode.removeChild(child.domNode);
		this.execute(this.parents,this.tiddlerTitle);
		this.renderInDom(parentDomNode,insertBefore);
		return;
	}
	// If the story tiddler has changed we need to sync the story elements
	if(this.hasParameter("story") && $tw.utils.hop(changes,this.params.story)) {
		this.processStoryChange(changes);
	} else {
		// If the story didn't change then we must refresh our content
		this.child.refreshInDom(changes);
	}
	// If the history tiddler has changed we may need to visualise something
	if(this.hasParameter("history") && $tw.utils.hop(changes,this.params.history)) {
		this.processHistoryChange();
	}
};

exports.processStoryChange = function(changes) {
	// Get the tiddlers we're supposed to be displaying
	var self = this,storyElement,
		t,n,domNode;
	// Get the story object
	this.getStory();
	// Check through each tiddler in the story
	for(t=0; t<this.story.tiddlers.length; t++) {
		// See if the node we want is already there
		var tiddlerNode = this.findStoryElementByTitle(t,this.story.tiddlers[t].title);
		if(tiddlerNode === undefined) {
			// If not, render the tiddler
			this.storyNode.children.splice(t,0,this.createStoryElement(this.story.tiddlers[t].title,this.story.tiddlers[t].draft));
			this.storyNode.children[t].renderInDom(this.storyNode.domNode,this.storyNode.domNode.childNodes[t]);
			// Invoke the storyview to animate the navigation
			if(this.storyview && this.storyview.insert) {
				this.storyview.insert(this.storyNode.children[t]);
			}
		} else {
			// Delete any nodes preceding the one we want
			if(tiddlerNode > t) {
				for(n=tiddlerNode-1; n>=t; n--) {
					this.removeStoryElement(n);
				}
			}
			storyElement = this.storyNode.children[t];
			// Check that the edit status matches
			if(this.story.tiddlers[t].draft !== storyElement.storyElementInfo.draft) {
				// If not, we'll have to recreate the story element
				storyElement.children[0] = this.createStoryElementMacro(this.story.tiddlers[t].title,this.story.tiddlers[t].draft);
				// Remove the DOM node in the story element
				storyElement.domNode.removeChild(storyElement.domNode.firstChild);
				// Reexecute the story element
				storyElement.children[0].execute(this.parents,this.tiddlerTitle);
				// Render the story element in the DOM
				storyElement.children[0].renderInDom(storyElement.domNode);
				// Reset the information in the story element
				storyElement.storyElementInfo = {title: this.story.tiddlers[t].title, draft: this.story.tiddlers[t].draft};
			} else {
				// If the draft status matches then just refresh the DOM node we're reusing
				this.storyNode.children[t].refreshInDom(changes);
			}
		}
	}
	// Remove any left over nodes
	if(this.storyNode.children.length > this.story.tiddlers.length) {
		for(t=this.storyNode.children.length-1; t>=this.story.tiddlers.length; t--) {
			this.removeStoryElement(t);
		}
	}
};

/*
Respond to a change in the history tiddler. The basic idea is to issue forward/back navigation commands to the story view that correspond to the tiddlers that need to be popped on or off the stack
*/
exports.processHistoryChange = function() {
	// Read the history tiddler
	this.getHistory();
	if(this.storyview) {
		var t,index,
			topCommon = Math.min(this.history.stack.length,this.prevHistory.stack.length);
		// Find the common heritage of the new history stack and the previous one
		for(t=0; t<topCommon; t++) {
			if(this.history.stack[t].title !== this.prevHistory.stack[t].title) {
				topCommon = t;
				break;
			}
		}
		// We now navigate backwards through the previous history to get back to the common ancestor
		for(t=this.prevHistory.stack.length-1; t>=topCommon; t--) {
			index = this.findStoryElementByTitle(0,this.prevHistory.stack[t].title);
			if(index !== undefined && this.storyview.navigateBack) {
				this.storyview.navigateBack(this.storyNode.children[index],this.history.stack[t]);
			}
		}
		// And now we navigate forwards through the new history to get to the latest tiddler
		for(t=topCommon; t<this.history.stack.length; t++) {
			index = this.findStoryElementByTitle(0,this.history.stack[t].title);
			if(index !== undefined && this.storyview.navigateForward) {
				this.storyview.navigateForward(this.storyNode.children[index],this.history.stack[t]);
			}
		}
	}
	// Record the history stack for next time
	this.prevHistory = this.history;
	this.history = undefined;
};

})();
