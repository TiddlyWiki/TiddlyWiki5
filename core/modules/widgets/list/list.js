/*\
title: $:/core/modules/widgets/list/list.js
type: application/javascript
module-type: widget

The list widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var ListWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate widget elements
	this.generate();
};

/*
These types are shorthands for particular filters
*/
var typeMappings = {
	all: "[!is[shadow]sort[title]]",
	recent: "[!is[shadow]sort[modified]]",
	missing: "[is[missing]sort[title]]",
	orphans: "[is[orphan]sort[title]]",
	shadows: "[is[shadow]sort[title]]"
};

ListWidget.prototype.generate = function() {
	// Get our attributes
	this.itemClass = this.renderer.getAttribute("itemClass");
	this.template = this.renderer.getAttribute("template");
	this.editTemplate = this.renderer.getAttribute("editTemplate");
	this.emptyMessage = this.renderer.getAttribute("emptyMessage");
	// Get the list of tiddlers object
	this.getTiddlerList();
	// Create the list
	var listMembers = [];
	if(this.list.length === 0) {
		// Check for an empty list
		listMembers = [this.getEmptyMessage()];
	} else {
		// Create the list
		for(var t=0; t<this.list.length; t++) {
			listMembers.push(this.createListElement(this.list[t]));
		}		
	}
	// Create the list frame element
	this.tag = this.renderer.parseTreeNode.isBlock ? "div" : "span";
	this.attributes = {
		"class": "tw-list-frame"
	};
	this.children = this.renderer.renderTree.createRenderers(this.renderer.renderContext,listMembers);
};

ListWidget.prototype.getTiddlerList = function() {
	var filter;
	if(this.renderer.hasAttribute("type")) {
		filter = typeMappings[this.renderer.getAttribute("type")];
	} else if(this.renderer.hasAttribute("filter")) {
		filter = this.renderer.getAttribute("filter");
	}
	if(!filter) {
		filter = "[!is[shadow]]";
	}
	this.list = this.renderer.renderTree.wiki.filterTiddlers(filter,this.renderer.getContextTiddlerTitle());
};

/*
Create and execute the nodes representing the empty message
*/
ListWidget.prototype.getEmptyMessage = function() {
	return {
		type: "element",
		tag: "span",
		children: this.renderer.renderTree.wiki.parseText("text/vnd.tiddlywiki",this.emptyMessage).tree
	};
};

/*
Create a list element representing a given tiddler
*/
ListWidget.prototype.createListElement = function(title) {
	// Define an event handler that adds navigation information to the event
	var handleEvent = function(event) {
			event.navigateFromTitle = title;
			return true;
		},
		classes = ["tw-list-element"];
	// Add any specified classes
	if(this.itemClass) {
		$tw.utils.pushTop(classes,this.itemClass);
	}
	// Return the list element
	return {
		type: "element",
		tag: this.renderer.parseTreeNode.isBlock ? "div" : "span",
		attributes: {
			"class": {type: "string", value: classes.join(" ")}
		},
		children: [this.createListElementMacro(title)],
		events: [
			{name: "tw-navigate", handlerFunction: handleEvent},
			{name: "tw-EditTiddler", handlerFunction: handleEvent},
			{name: "tw-SaveTiddler", handlerFunction: handleEvent},
			{name: "tw-CloseTiddler", handlerFunction: handleEvent},
			{name: "tw-NewTiddler", handlerFunction: handleEvent}
		]
	};
};

/*
Create the tiddler macro needed to represent a given tiddler
*/
ListWidget.prototype.createListElementMacro = function(title) {
	// Check if the tiddler is a draft
	var tiddler = this.renderer.renderTree.wiki.getTiddler(title),
		isDraft = tiddler ? tiddler.hasField("draft.of") : false;
	// Figure out the template to use
	var template = this.template,
		templateTree = undefined;
	if(isDraft && this.editTemplate) {
		template = this.editTemplate;
	}
	// Check for not having a template
	if(!template) {
		if(this.renderer.parseTreeNode.children && this.renderer.parseTreeNode.children.length > 0) {
			// Use our content as the template
			templateTree = this.renderer.parseTreeNode.children;
		} else {
			// Use default content
			templateTree = [{
				type: "element",
				tag: "$view",
				attributes: {
					field: {type: "string", value: "title"},
					format: {type: "string", value: "link"}
				}
			}];
		}
	}
	// Create the transclude widget
	return {
		type: "element",
		tag: "$transclude",
		attributes: {
			target: {type: "string", value: title},
			template: {type: "string", value: template}
		},
		children: templateTree
	};
};

/*
Remove a list element from the list, along with the attendant DOM nodes
*/
ListWidget.prototype.removeListElement = function(index) {
	// Get the list element
	var listElement = this.children[index];
	// Remove the DOM node
	listElement.domNode.parentNode.removeChild(listElement.domNode);
	// Then delete the actual renderer node
	this.children.splice(index,1);
};

/*
Return the index of the list element that corresponds to a particular title
startIndex: index to start search (use zero to search from the top)
title: tiddler title to seach for
*/
ListWidget.prototype.findListElementByTitle = function(startIndex,title) {
	while(startIndex < this.children.length) {
		if(this.children[startIndex].widget.children[0].attributes.target === title) {
			return startIndex;
		}
		startIndex++;
	}
	return undefined;
};

ListWidget.prototype.refreshInDom = function(changedAttributes,changedTiddlers) {
	// Reexecute the widget if any of our attributes have changed
	if(changedAttributes.itemClass || changedAttributes.template || changedAttributes.editTemplate || changedAttributes.emptyMessage || changedAttributes.type || changedAttributes.filter || changedAttributes.template) {
		// Regenerate and rerender the widget and replace the existing DOM node
		this.generate();
		var oldDomNode = this.renderer.domNode,
			newDomNode = this.renderer.renderInDom();
		oldDomNode.parentNode.replaceChild(newDomNode,oldDomNode);
	} else {
		// Handle any changes to the list, and refresh any nodes we're reusing
		this.handleListChanges(changedTiddlers);
	}
};

ListWidget.prototype.handleListChanges = function(changedTiddlers) {
	var t,
		prevListLength = this.list.length;
	// Get the list of tiddlers, having saved the previous length
	this.getTiddlerList();
	// Check if the list is empty
	if(this.list.length === 0) {
		// Check if it was empty before
		if(prevListLength === 0) {
			// If so, just refresh the empty message
			$tw.utils.each(this.children,function(node) {
				if(node.refreshInDom) {
					node.refreshInDom(changedTiddlers);
				}
			});
			return;
		} else {
			// If the list wasn't empty before, empty it
			for(t=prevListLength-1; t>=0; t--) {
				this.removeListElement(t);
			}
			// Insert the empty message
			this.children = this.renderer.renderTree.createRenderers(this.renderer.renderContext,[this.getEmptyMessage()]);
			$tw.utils.each(this.children,function(node) {
				if(node.renderInDom) {
					this.renderer.domNode.appendChild(node.renderInDom());
				}
			});
			return;
		}
	} else {
		// If it is not empty now, but was empty previously, then remove the empty message
		if(prevListLength === 0) {
			this.removeListElement(0);
		}
	}
	// Step through the list and adjust our child list elements appropriately
	for(t=0; t<this.list.length; t++) {
		// Check to see if the list element is already there
		var index = this.findListElementByTitle(t,this.list[t]);
		if(index === undefined) {
			// The list element isn't there, so we need to insert it
			this.children.splice(t,0,this.renderer.renderTree.createRenderer(this.renderer.renderContext,this.createListElement(this.list[t])));
			this.renderer.domNode.insertBefore(this.children[t].renderInDom(),this.renderer.domNode.childNodes[t]);
		} else {
			// Delete any list elements preceding the one we want
			for(var n=index-1; n>=t; n--) {
				this.removeListElement(n);
			}
			// Refresh the node we're reusing
			this.children[t].refreshInDom(changedTiddlers);
		}
	}
	// Remove any left over elements
	for(t=this.children.length-1; t>=this.list.length; t--) {
		this.removeListElement(t);
	}
};

exports.list = ListWidget;

})();
