/*\
title: $:/core/modules/widgets/list.js
type: application/javascript
module-type: widget

List and list item widgets

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

/*
The list widget creates list element sub-widgets that reach back into the list widget for their configuration
*/

var ListWidget = function(parseTreeNode,options) {
	// Main initialisation inherited from widget.js
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ListWidget.prototype = new Widget();

ListWidget.prototype.initialise = function(parseTreeNode,options) {
	// Bail if parseTreeNode is undefined, meaning that the ListWidget constructor was called without any arguments so that it can be subclassed
	if(parseTreeNode === undefined) {
		return;
	}
	// First call parent constructor to set everything else up
	Widget.prototype.initialise.call(this,parseTreeNode,options);
	// Now look for <$list-template> and <$list-empty> widgets as immediate child widgets
	// This is safe to do during initialization because parse trees never change after creation
	this.findExplicitTemplates();
}

/*
Render this widget into the DOM
*/
ListWidget.prototype.render = function(parent,nextSibling) {
	// Initialise the storyviews if they've not been done already
	if(!this.storyViews) {
		ListWidget.prototype.storyViews = {};
		$tw.modules.applyMethods("storyview",this.storyViews);
	}
	this.parentDomNode = parent;
	var changedAttributes = this.computeAttributes();
	this.execute(changedAttributes);
	this.renderChildren(parent,nextSibling);
	// Construct the storyview
	var StoryView = this.storyViews[this.storyViewName];
	if(this.storyViewName && !StoryView) {
		StoryView = this.storyViews["classic"];
	}
	if(StoryView && !this.document.isTiddlyWikiFakeDom) {
		this.storyview = new StoryView(this);
	} else {
		this.storyview = null;
	}
	if(this.storyview && this.storyview.renderEnd) {
		this.storyview.renderEnd();
	}
};

/*
Compute the internal state of the widget
*/
ListWidget.prototype.execute = function(changedAttributes) {
	var self = this;
	// Get our attributes
	this.template = this.getAttribute("template");
	this.editTemplate = this.getAttribute("editTemplate");
	this.variableName = this.getAttribute("variable","currentTiddler");
	this.counterName = this.getAttribute("counter");
	this.storyViewName = this.getAttribute("storyview");
	this.historyTitle = this.getAttribute("history");
	// Create join template only if needed
	if(this.join === undefined || (changedAttributes && changedAttributes.join)) {
		this.join = this.makeJoinTemplate();
	}
	// Compose the list elements
	this.list = this.getTiddlerList();
	var members = [],
		self = this;
	// Check for an empty list
	if(this.list.length === 0) {
		members = this.getEmptyMessage();
	} else {
		$tw.utils.each(this.list,function(title,index) {
			members.push(self.makeItemTemplate(title,index));
		});
	}
	// Construct the child widgets
	this.makeChildWidgets(members);
	// Clear the last history
	this.history = [];
};

ListWidget.prototype.findExplicitTemplates = function() {
	var self = this;
	this.explicitListTemplate = null;
	this.explicitEmptyTemplate = null;
	this.explicitJoinTemplate = null;
	this.hasTemplateInBody = false;
	var searchChildren = function(childNodes) {
		var foundInlineTemplate = false;
		$tw.utils.each(childNodes,function(node) {
			if(node.type === "list-template") {
				self.explicitListTemplate = node.children;
			} else if(node.type === "list-empty") {
				self.explicitEmptyTemplate = node.children;
			} else if(node.type === "list-join") {
				self.explicitJoinTemplate = node.children;
			} else if(node.type === "element" && node.tag === "p") {
				searchChildren(node.children);
				foundInlineTemplate = true;
			} else {
				foundInlineTemplate = true;
			}
		});
		return foundInlineTemplate;
	};
	this.hasTemplateInBody = searchChildren(this.parseTreeNode.children);
}

ListWidget.prototype.getTiddlerList = function() {
	var limit = $tw.utils.getInt(this.getAttribute("limit",""),undefined);
	var defaultFilter = "[!is[system]sort[title]]";
	var results = this.wiki.filterTiddlers(this.getAttribute("filter",defaultFilter),this);
	if(limit !== undefined) {
		if(limit >= 0) {
			results = results.slice(0,limit);
		} else {
			results = results.slice(limit);
		}
	}
	return results;
};

ListWidget.prototype.getEmptyMessage = function() {
	var parser,
		emptyMessage = this.getAttribute("emptyMessage");
	// If emptyMessage attribute is not present or empty then look for an explicit empty template
	if(!emptyMessage) {
		if(this.explicitEmptyTemplate) {
			return this.explicitEmptyTemplate;
		} else {
			return [];
		}
	}
	parser = this.wiki.parseText("text/vnd.tiddlywiki",emptyMessage,{parseAsInline: true});
	if(parser) {
		return parser.tree;
	} else {
		return [];
	}
};

/*
Compose the template for a join between list items
*/
ListWidget.prototype.makeJoinTemplate = function() {
	var parser,
		join = this.getAttribute("join","");
	if(join) {
		parser = this.wiki.parseText("text/vnd.tiddlywiki",join,{parseAsInline:true})
		if(parser) {
			return parser.tree;
		} else {
			return [];
		}
	} else {
		return this.explicitJoinTemplate; // May be null, and that's fine
	}
};

/*
Compose the template for a list item
*/
ListWidget.prototype.makeItemTemplate = function(title,index) {
	// Check if the tiddler is a draft
	var tiddler = this.wiki.getTiddler(title),
		isDraft = tiddler && tiddler.hasField("draft.of"),
		template = this.template,
		join = this.join,
		templateTree;
	if(isDraft && this.editTemplate) {
		template = this.editTemplate;
	}
	// Compose the transclusion of the template
	if(template) {
		templateTree = [{type: "transclude", attributes: {tiddler: {type: "string", value: template}}}];
	} else {
		// Check for child nodes of the list widget
		if(this.parseTreeNode.children && this.parseTreeNode.children.length > 0) {
			// Check for a <$list-item> widget
			if(this.explicitListTemplate) {
				templateTree = this.explicitListTemplate;
			} else if(this.hasTemplateInBody) {
				templateTree = this.parseTreeNode.children;
			}
		}
		if(!templateTree || templateTree.length === 0) {
			// Default template is a link to the title
			templateTree = [{type: "element", tag: this.parseTreeNode.isBlock ? "div" : "span", children: [{type: "link", attributes: {to: {type: "string", value: title}}, children: [
				{type: "text", text: title}
			]}]}];
		}
	}
	// Return the list item
	var parseTreeNode = {type: "listitem", itemTitle: title, variableName: this.variableName, children: templateTree, join: join};
	parseTreeNode.isLast = index === this.list.length - 1;
	if(this.counterName) {
		parseTreeNode.counter = (index + 1).toString();
		parseTreeNode.counterName = this.counterName;
		parseTreeNode.isFirst = index === 0;
	}
	return parseTreeNode;
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ListWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes(),
		result;
	// Call the storyview
	if(this.storyview && this.storyview.refreshStart) {
		this.storyview.refreshStart(changedTiddlers,changedAttributes);
	}
	// Completely refresh if any of our attributes have changed
	if(changedAttributes.filter || changedAttributes.variable || changedAttributes.counter || changedAttributes.template || changedAttributes.editTemplate || changedAttributes.join || changedAttributes.emptyMessage || changedAttributes.storyview || changedAttributes.history) {
		this.refreshSelf();
		result = true;
	} else {
		// Handle any changes to the list
		result = this.handleListChanges(changedTiddlers);
		// Handle any changes to the history stack
		if(this.historyTitle && changedTiddlers[this.historyTitle]) {
			this.handleHistoryChanges();
		}
	}
	// Call the storyview
	if(this.storyview && this.storyview.refreshEnd) {
		this.storyview.refreshEnd(changedTiddlers,changedAttributes);
	}
	return result;
};

/*
Handle any changes to the history list
*/
ListWidget.prototype.handleHistoryChanges = function() {
	// Get the history data
	var newHistory = this.wiki.getTiddlerDataCached(this.historyTitle,[]);
	// Ignore any entries of the history that match the previous history
	var entry = 0;
	while(entry < newHistory.length && entry < this.history.length && newHistory[entry].title === this.history[entry].title) {
		entry++;
	}
	// Navigate forwards to each of the new tiddlers
	while(entry < newHistory.length) {
		if(this.storyview && this.storyview.navigateTo) {
			this.storyview.navigateTo(newHistory[entry]);
		}
		entry++;
	}
	// Update the history
	this.history = newHistory;
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
			for(t=this.children.length-1; t>=0; t--) {
				this.removeListItem(t);
			}
			var nextSibling = this.findNextSiblingDomNode();
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
		// If we are providing an counter variable then we must refresh the items, otherwise we can rearrange them
		var hasRefreshed = false,t;
		if(this.counterName) {
			var mustRefreshOldLast = false;
			var oldLength = this.children.length;
			// Cycle through the list and remove and re-insert the first item that has changed, and all the remaining items
			for(t=0; t<this.list.length; t++) {
				if(hasRefreshed || !this.children[t] || this.children[t].parseTreeNode.itemTitle !== this.list[t]) {
					if(this.children[t]) {
						this.removeListItem(t);
					}
					this.insertListItem(t,this.list[t]);
					if(!hasRefreshed && t === oldLength) {
						mustRefreshOldLast = true;
					}
					hasRefreshed = true;
				} else {
					// Refresh the item we're reusing
					var refreshed = this.children[t].refresh(changedTiddlers);
					hasRefreshed = hasRefreshed || refreshed;
				}
			}
			// If items were inserted then we must recreate the item that used to be at the last position as it is no longer last
			if(mustRefreshOldLast && oldLength > 0) {
				var oldLastIdx = oldLength-1;
				this.removeListItem(oldLastIdx);
				this.insertListItem(oldLastIdx,this.list[oldLastIdx]);
			}
			// If there are items to remove and we have not refreshed then recreate the item that will now be at the last position
			if(!hasRefreshed && this.children.length > this.list.length) {
				this.removeListItem(this.list.length-1);
				this.insertListItem(this.list.length-1,this.list[this.list.length-1]);
			}
		} else {
			// Cycle through the list, inserting and removing list items as needed
			var mustRecreateLastItem = false;
			if(this.join && this.join.length) {
				if(this.children.length !== this.list.length) {
						mustRecreateLastItem = true;
				} else if(prevList[prevList.length-1] !== this.list[this.list.length-1]) {
						mustRecreateLastItem = true;
				}
			}
			var isLast = false, wasLast = false;
			for(t=0; t<this.list.length; t++) {
				isLast = t === this.list.length-1;
				var index = this.findListItem(t,this.list[t]);
				wasLast = index === this.children.length-1;
				if(wasLast && (index !== t || this.children.length !== this.list.length)) {
					mustRecreateLastItem = !!(this.join && this.join.length);
				}
				if(index === undefined) {
					// The list item must be inserted
					if(isLast && mustRecreateLastItem && t>0) {
						// First re-create previosly-last item that will no longer be last
						this.removeListItem(t-1);
						this.insertListItem(t-1,this.list[t-1]);
					}
					this.insertListItem(t,this.list[t]);
					hasRefreshed = true;
				} else {
					// There are intervening list items that must be removed
					for(var n=index-1; n>=t; n--) {
						this.removeListItem(n);
						hasRefreshed = true;
					}
					// Refresh the item we're reusing, or recreate if necessary
					if(mustRecreateLastItem && (isLast || wasLast)) {
						this.removeListItem(t);
						this.insertListItem(t,this.list[t]);
						hasRefreshed = true;
					} else {
						var refreshed = this.children[t].refresh(changedTiddlers);
						hasRefreshed = hasRefreshed || refreshed;
					}
				}
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
	// Create, insert and render the new child widgets
	var widget = this.makeChildWidget(this.makeItemTemplate(title,index));
	widget.parentDomNode = this.parentDomNode; // Hack to enable findNextSiblingDomNode() to work
	this.children.splice(index,0,widget);
	var nextSibling = widget.findNextSiblingDomNode();
	widget.render(this.parentDomNode,nextSibling);
	// Animate the insertion if required
	if(this.storyview && this.storyview.insert) {
		this.storyview.insert(widget);
	}
	return true;
};

/*
Remove the specified list item
*/
ListWidget.prototype.removeListItem = function(index) {
	var widget = this.children[index];
	// Animate the removal if required
	if(this.storyview && this.storyview.remove) {
		this.storyview.remove(widget);
	} else {
		widget.removeChildDomNodes();
	}
	// Remove the child widget
	this.children.splice(index,1);
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
	this.setVariable(this.parseTreeNode.variableName,this.parseTreeNode.itemTitle);
	if(this.parseTreeNode.counterName) {
		this.setVariable(this.parseTreeNode.counterName,this.parseTreeNode.counter);
		this.setVariable(this.parseTreeNode.counterName + "-first",this.parseTreeNode.isFirst ? "yes" : "no");
		this.setVariable(this.parseTreeNode.counterName + "-last",this.parseTreeNode.isLast ? "yes" : "no");
	}
	// Add join if needed
	var children = this.parseTreeNode.children,
		join = this.parseTreeNode.join;
	if(join && join.length && !this.parseTreeNode.isLast) {
		children = children.slice(0);
		$tw.utils.each(join,function(joinNode) {
			children.push(joinNode);
		})
	}
	// Construct the child widgets
	this.makeChildWidgets(children);
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ListItemWidget.prototype.refresh = function(changedTiddlers) {
	return this.refreshChildren(changedTiddlers);
};

exports.listitem = ListItemWidget;

/*
Make <$list-template> and <$list-empty> widgets that do nothing
*/
var ListTemplateWidget = function(parseTreeNode,options) {
	// Main initialisation inherited from widget.js
	this.initialise(parseTreeNode,options);
};
ListTemplateWidget.prototype = new Widget();
ListTemplateWidget.prototype.render = function() {}
ListTemplateWidget.prototype.refresh = function() { return false; }

exports["list-template"] = ListTemplateWidget;

var ListEmptyWidget = function(parseTreeNode,options) {
	// Main initialisation inherited from widget.js
	this.initialise(parseTreeNode,options);
};
ListEmptyWidget.prototype = new Widget();
ListEmptyWidget.prototype.render = function() {}
ListEmptyWidget.prototype.refresh = function() { return false; }

exports["list-empty"] = ListEmptyWidget;

var ListJoinWidget = function(parseTreeNode,options) {
	// Main initialisation inherited from widget.js
	this.initialise(parseTreeNode,options);
};
ListJoinWidget.prototype = new Widget();
ListJoinWidget.prototype.render = function() {}
ListJoinWidget.prototype.refresh = function() { return false; }

exports["list-join"] = ListJoinWidget;
