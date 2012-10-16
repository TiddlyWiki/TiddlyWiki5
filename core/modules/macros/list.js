/*\
title: $:/core/modules/macros/list.js
type: application/javascript
module-type: macro

List macro

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "list",
	dependentAll: true, // Tiddlers containing <<list>> macro are dependent on every tiddler
	params: {
		type: {byPos: 0, type: "text"},
		filter: {byName: true, type: "filter"},
		template: {byName: true, type: "tiddler"},
		templateText: {byName: true, type: "text"},
		editTemplate: {byName: true, type: "tiddler"},
		editTemplateText: {byName: true, type: "text"},
		emptyMessage: {byName: true, type: "text"}
	}
};

exports.executeMacro = function() {
	// Get the list of tiddlers object
	this.getTiddlerList();
	// Create the list frame element
	var attributes = {"class": ["tw-list-frame"]};
	if(this.classes) {
		$tw.utils.pushTop(attributes["class"],this.classes);
	}
	this.listFrame = $tw.Tree.Element("div",attributes,[]);
	// Create each list element
	for(var t=0; t<this.list.length; t++) {
		this.listFrame.children.push(this.createListElement(this.list[t]));
	}
	return this.listFrame;
};

exports.getTiddlerList = function() {
	this.list = this.wiki.filterTiddlers(this.params.filter,this.tiddlerTitle);
};

/*
Create a list element representing a given tiddler
*/
exports.createListElement = function(title) {
	var node = this.createListElementMacro(title),
		eventHandler = {handleEvent: function(event) {
			// Add context information to the event
			event.navigateFromListElement = node;
			event.navigateFromTitle = title;
			return true;
		}};
	node.execute(this.parents,this.tiddlerTitle);
	var listElement = $tw.Tree.Element("div",{"class": ["tw-list-element"]},[node],{
			events: ["tw-navigate","tw-EditTiddler","tw-SaveTiddler","tw-CloseTiddler"],
			eventHandler: eventHandler
		});
	// Save our data inside the list element node
	listElement.listElementInfo = {title: title};
	return listElement;
};

/*
Create the tiddler macro needed to represent a given tiddler
*/
exports.createListElementMacro = function(title) {
	// Check if the tiddler is a draft
	var tiddler = this.wiki.getTiddler(title),
		draft = tiddler ? $tw.utils.hop(tiddler.fields,"draft-of") : false;
	// Figure out the template to use
	var template = this.params.template,
		templateText = this.params.templateText;
	if(draft && this.hasParameter("editTemplate")) {
		template = this.params.editTemplate;
	}
	if(draft && this.hasParameter("editTemplateText")) {
		template = this.params.editTemplateText;
	}
	// Create the tiddler macro
	return $tw.Tree.Macro("tiddler",{
			srcParams: {
				target: title,
				template: template,
				templateText: templateText
			},
			wiki: this.wiki
		});
};

/*
Remove a list element from the list, along with the attendant DOM nodes
*/
exports.removelistElement = function(index) {
	// Get the list element
	var listElement = this.listFrame.children[index];
	// Remove the dom node
	listElement.domNode.parentNode.removeChild(listElement.domNode);
	// Then delete the actual renderer node
	this.listFrame.children.splice(index,1);
};

/*
Return the index of the list element that corresponds to a particular title
startIndex: index to start search (use zero to search from the top)
title: tiddler title to seach for
*/
exports.findListElementByTitle = function(startIndex,title) {
	while(startIndex < this.listFrame.children.length) {
		if(this.listFrame.children[startIndex].listElementInfo.title === title) {
			return startIndex;
		}
		startIndex++;
	}
	return undefined;
};

/*
Selectively update the list in response to changes in tiddlers
*/
exports.refreshInDom = function(changes) {
	// If any of our parameters have changed we'll have to completely re-execute the macro
	var paramNames = ["template","editTemplate"];
	for(var t=0; t<paramNames.length; t++) {
		if(this.hasParameter(paramNames[t]) && $tw.utils.hop(changes,this.params[paramNames[t]])) {
			this.reexecuteInDom();
			return;
		}
	}
	// Get the list of tiddlers
	this.getTiddlerList();
	// Step through the list and adjust our child list elements appropriately
	for(t=0; t<this.list.length; t++) {
		// Check to see if the list element is already there
		var index = this.findListElementByTitle(t,this.list[t]);
		if(index === undefined) {
			// The list element isn't there, so we need to insert it
			this.listFrame.children.splice(t,0,this.createListElement(this.list[t]));
			this.listFrame.children[t].renderInDom(this.listFrame.domNode,this.listFrame.domNode.childNodes[t]);
		} else {
			// Delete any list elements preceding the one we want
			if(index > t) {
				for(var n=index-1; n>=t; n--) {
					this.removelistElement(n);
				}
			}
			// Refresh the node we're reusing
			this.listFrame.children[t].refreshInDom(changes);
		}
	}
	// Remove any left over elements
	if(this.listFrame.children.length > this.list.length) {
		for(t=this.listFrame.children.length-1; t>=this.list.length; t--) {
			this.removeStoryElement(t);
		}
	}
};

})();
