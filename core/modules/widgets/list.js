/*\
title: $:/core/modules/widgets/list.js
type: application/javascript
module-type: new_widget

List and list item widgets

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

/*
The list widget creates list element sub-widgets that reach back into the list widget for their configuration
*/

var ListWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ListWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ListWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
ListWidget.prototype.execute = function() {
	// Get our attributes
	this.preserveCurrentTiddler = this.getAttribute("preserveCurrentTiddler","no") === "yes";
	// Compose the list elements
	this.list = this.getTiddlerList();
	var members = [],
		self = this;
	// Check for an empty list
	if(this.list.length === 0) {
		members = this.getEmptyMessage();
	} else {
		$tw.utils.each(this.list,function(title,index) {
			members.push({type: "listitem", itemTitle: title, children: self.parseTreeNode.children});
		});
	}
	// Construct the child widgets
	this.makeChildWidgets(members);
};

ListWidget.prototype.getTiddlerList = function() {
	var defaultFilter = "[!is[system]sort[title]]";
	return this.wiki.filterTiddlers(this.getAttribute("filter",defaultFilter),this.getVariable("tiddlerTitle"));
};

ListWidget.prototype.getEmptyMessage = function() {
	var emptyMessage = this.getAttribute("emptyMessage",""),
		parser = this.wiki.new_parseText("text/vnd.tiddlywiki",emptyMessage,{parseAsInline: true});
	if(parser) {
		return parser.tree;
	} else {
		return [];
	}
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ListWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	// Completely refresh if any of our attributes have changed
	if(changedAttributes.filter || changedAttributes.preserveCurrentTiddler) {
		this.refreshSelf();
		return true;
	} else {
		// Handle any changes to the list
		return this.handleListChanges(changedTiddlers);	
	}
};

/*
Process any changes to the list
*/
ListWidget.prototype.handleListChanges = function(changedTiddlers) {
	// Get the new list
	var prevList = this.list;
	this.list = this.getTiddlerList();
	// Check for an empty list
	if(this.list.length === 0) {
		// Check if it was empty before
		if(prevList.length === 0) {
			// If so, just refresh the empty message
			return this.refreshChildren(changedTiddlers);
		} else {
			// Replace the previous content with the empty message
			var nextSibling = this.findNextSibling();
			this.removeChildDomNodes();
			this.makeChildWidgets(this.getEmptyMessage());
			this.renderChildren(this.parentDomNode,nextSibling);
			return true;
		}
	} else {
		// If the list was empty then we need to remove the empty message
		if(prevList.length === 0) {
			this.removeChildDomNodes();
			this.children = [];
		}
		// Cycle through the list, inserting and removing list items as needed
		var hasRefreshed = false;
		for(var t=0; t<this.list.length; t++) {
			var index = this.findListItem(t,this.list[t]);
			if(index === undefined) {
				// The list item must be inserted
				this.insertListItem(t,this.list[t]);
				hasRefreshed = true;
			} else {
				// There are intervening list items that must be removed
				for(var n=index-1; n>=t; n--) {
					this.removeListItem(n);
					hasRefreshed = true;
				}
				// Refresh the item we're reusing
				var refreshed = this.children[t].refresh(changedTiddlers);
				hasRefreshed = hasRefreshed || refreshed;
			}
		}
		// Remove any left over items
		for(t=this.children.length-1; t>=this.list.length; t--) {
			this.removeListItem(t);
			hasRefreshed = true;
		}
		return hasRefreshed;
	}
};

/*
Find the list item with a given title, starting from a specified position
*/
ListWidget.prototype.findListItem = function(startIndex,title) {
	while(startIndex < this.children.length) {
		if(this.children[startIndex].parseTreeNode.itemTitle === title) {
			return startIndex;
		}
		startIndex++;
	}
	return undefined;
};

/*
Insert a new list item at the specified index
*/
ListWidget.prototype.insertListItem = function(index,title) {
	var newItem = this.makeChildWidget({type: "listitem", itemTitle: title, children: this.parseTreeNode.children});
	newItem.parentDomNode = this.parentDomNode; // Hack to enable findNextSibling() to work
	this.children.splice(index,0,newItem);
	var nextSibling = newItem.findNextSibling();
	newItem.render(this.parentDomNode,nextSibling);
	return true;
};

/*
Remvoe the specified list item
*/
ListWidget.prototype.removeListItem = function(index) {
};

exports.list = ListWidget;

var ListItemWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ListItemWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ListItemWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
ListItemWidget.prototype.execute = function() {
	// Set the current list item title
	this.setVariable("listItem",this.parseTreeNode.itemTitle);
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ListItemWidget.prototype.refresh = function(changedTiddlers) {
	return this.refreshChildren(changedTiddlers);
};

exports.listitem = ListItemWidget;

})();
