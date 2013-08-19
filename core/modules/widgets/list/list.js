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
	// Initialise the listviews if they've not been done already
	if(!this.listViews) {
		ListWidget.prototype.listViews = {};
		$tw.modules.applyMethods("listview",this.listViews);
	}
	// Generate widget elements
	this.generate();
};

var typeInfoByType = {
	plain: {
		frame: {
			block: "div", inline: "span"
		},
		member: {
			block: "div", inline: "span"
		}
	},
	ul: {
		frame: {
			block: "ul", inline: "ul"
		},
		member: {
			block: "li", inline: "li"
		}
	},
	ol: {
		frame: {
			block: "ol", inline: "ol"
		},
		member: {
			block: "li", inline: "li"
		}
	}
};

ListWidget.prototype.generate = function() {
	// Get our attributes
	this.macro = this.renderer.getAttribute("macro");
	this.type = this.renderer.getAttribute("type","plain");
	this.itemClass = this.renderer.getAttribute("itemClass");
	this.template = this.renderer.getAttribute("template");
	this.editTemplate = this.renderer.getAttribute("editTemplate");
	this.emptyMessage = this.renderer.getAttribute("emptyMessage");
	this["class"] = this.renderer.getAttribute("class");
	// Get our type information
	this.typeInfo = typeInfoByType[this.type] || typeInfoByType.plain;
	// Set up the classes
	var classes = ["tw-list-frame"];
	if(this["class"]) {
		$tw.utils.pushTop(classes,this["class"]);
	}
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
	this.tag = this.renderer.parseTreeNode.isBlock ? this.typeInfo.frame.block : this.typeInfo.frame.inline;
	this.attributes = {
		"class": classes.join(" ")
	};
	this.children = this.renderer.renderTree.createRenderers(this.renderer,listMembers);
};

ListWidget.prototype.getTiddlerList = function() {
	var filter;
	if(this.renderer.hasAttribute("filter")) {
		filter = this.renderer.getAttribute("filter");
	}
	if(!filter) {
		filter = "[!is[system]]";
	}
	this.list = this.renderer.renderTree.wiki.filterTiddlers(filter,this.renderer.tiddlerTitle);
};

/*
Create and execute the nodes representing the empty message
*/
ListWidget.prototype.getEmptyMessage = function() {
	return {
		type: "element",
		tag: "span",
		children: this.renderer.renderTree.wiki.parseText("text/vnd.tiddlywiki",this.emptyMessage,{parseAsInline: true}).tree
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
		tag: this.renderer.parseTreeNode.isBlock ? this.typeInfo.member.block : this.typeInfo.member.inline,
		attributes: {
			"class": {type: "string", value: classes.join(" ")}
		},
		children: [this.createListElementParseTree(title)],
		events: [
			{name: "tw-navigate", handlerFunction: handleEvent},
			{name: "tw-edit-tiddler", handlerFunction: handleEvent},
			{name: "tw-save-tiddler", handlerFunction: handleEvent},
			{name: "tw-close-tiddler", handlerFunction: handleEvent},
			{name: "tw-new-tiddler", handlerFunction: handleEvent}
		]
	};
};

/*
Create the parse tree nodes needed to represent a given list element
*/
ListWidget.prototype.createListElementParseTree = function(title) {
	if(this.macro) {
		return this.createListElementMacro(title);
	} else {
		return this.createListElementTransclusion(title);
	}
};

/*
Create a macro call to represent a list element
*/
ListWidget.prototype.createListElementMacro = function(title) {
	// Create the macrocall rendertree node
	return {
		type: "macrocall",
		name: this.macro,
		params: [
			{name: "title", value: title}
		]
	};
};

/*
Create a transclusion to represent a list element
*/
ListWidget.prototype.createListElementTransclusion = function(title) {
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
		isBlock: this.renderer.parseTreeNode.isBlock,
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
	// Invoke the listview to animate the removal
	if(this.listview && this.listview.remove) {
		if(!this.listview.remove(index)) {
			// Only delete the DOM element if the listview.remove() returned false
			listElement.domNode.parentNode.removeChild(listElement.domNode);
		}
	} else {
		// Always remove the DOM node if we didn't invoke the listview
		listElement.domNode.parentNode.removeChild(listElement.domNode);
	}
	// Then delete the actual renderer node
	this.children.splice(index,1);
};

/*
Return the index of the list element that corresponds to a particular title
startIndex: index to start search (use zero to search from the top)
title: tiddler title to seach for
*/
ListWidget.prototype.findListElementByTitle = function(startIndex,title) {
	var testNode = this.macro ? function(node) {
		// We're looking for a macro list element
		return node.widget.children[0].parseTreeNode.params[0].value === title;
	} : function(node) {
		// We're looking for a transclusion list element
		return node.widget.children[0].attributes.target === title;
	};
	// Search for the list element
	while(startIndex < this.children.length) {
		if(testNode(this.children[startIndex])) {
			return startIndex;
		}
		startIndex++;
	}
	return undefined;
};

ListWidget.prototype.postRenderInDom = function() {
	this.listview = this.chooseListView();
	this.history = [];
};

/*
Select the appropriate list viewer
*/
ListWidget.prototype.chooseListView = function() {
	// Instantiate the list view
	var listviewName = this.renderer.getAttribute("listview");
	var ListView = this.listViews[listviewName];
	return ListView ? new ListView(this) : null;
};

ListWidget.prototype.refreshInDom = function(changedAttributes,changedTiddlers) {
	// Reexecute the widget if any of our attributes have changed
	if(changedAttributes.itemClass || changedAttributes.template || changedAttributes.editTemplate || changedAttributes.emptyMessage || changedAttributes.type || changedAttributes.filter || changedAttributes.template || changedAttributes.history || changedAttributes.listview) {
		// Regenerate and rerender the widget and replace the existing DOM node
		this.generate();
		var oldDomNode = this.renderer.domNode,
			newDomNode = this.renderer.renderInDom();
		oldDomNode.parentNode.replaceChild(newDomNode,oldDomNode);
	} else {
		// Handle any changes to the list, and refresh any nodes we're reusing
		this.handleListChanges(changedTiddlers);
		// Update the history list
		var history = this.renderer.getAttribute("history");
		if(history && changedTiddlers[history]) {
			this.handleHistoryChanges();
		}
	}
};

ListWidget.prototype.handleListChanges = function(changedTiddlers) {
	var t,
		prevListLength = this.list.length,
		self = this;
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
			this.children = this.renderer.renderTree.createRenderers(this.renderer,[this.getEmptyMessage()]);
			$tw.utils.each(this.children,function(node) {
				if(node.renderInDom) {
					self.renderer.domNode.appendChild(node.renderInDom());
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
			this.children.splice(t,0,this.renderer.renderTree.createRenderer(this.renderer,this.createListElement(this.list[t])));
			this.renderer.domNode.insertBefore(this.children[t].renderInDom(),this.renderer.domNode.childNodes[t]);
			// Ask the listview to animate the insertion
			if(this.listview && this.listview.insert) {
				this.listview.insert(t);
			}
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

/*
Handle any changes to the history list
*/
ListWidget.prototype.handleHistoryChanges = function() {
	// Get the history data
	var historyAtt = this.renderer.getAttribute("history"),
		newHistory = this.renderer.renderTree.wiki.getTiddlerData(historyAtt,[]);
	// Ignore any entries of the history that match the previous history
	var entry = 0;
	while(entry < newHistory.length && entry < this.history.length && newHistory[entry].title === this.history[entry].title) {
		entry++;
	}
	// Navigate forwards to each of the new tiddlers
	while(entry < newHistory.length) {
		if(this.listview && this.listview.navigateTo) {
			this.listview.navigateTo(newHistory[entry]);
		}
		entry++;
	}
	// Update the history
	this.history = newHistory;
};

exports.list = ListWidget;

})();
