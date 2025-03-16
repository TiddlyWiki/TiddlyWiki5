/*\
title: $:/core/modules/widgets/action-listops.js
type: application/javascript
module-type: widget

Action widget to apply list operations to any tiddler field (defaults to the 'list' field of the current tiddler)

\*/
"use strict";
var Widget = require("$:/core/modules/widgets/widget.js").widget;
var ActionListopsWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};
/**
 * Inherit from the base widget class
 */
ActionListopsWidget.prototype = new Widget();
/**
 * Render this widget into the DOM
 */
ActionListopsWidget.prototype.render = function(parent, nextSibling) {
	this.computeAttributes();
	this.execute();
};
/**
 * Compute the internal state of the widget
 */
ActionListopsWidget.prototype.execute = function() {
	// Get our parameters
	this.target = this.getAttribute("$tiddler", this.getVariable(
		"currentTiddler"));
	this.filter = this.getAttribute("$filter");
	this.subfilter = this.getAttribute("$subfilter");
	this.listField = this.getAttribute("$field", "list");
	this.listIndex = this.getAttribute("$index");
	this.filtertags = this.getAttribute("$tags");
};
/**
 * 	Refresh the widget by ensuring our attributes are up to date
 */
ActionListopsWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if($tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};
/**
 * 	Invoke the action associated with this widget
 */
ActionListopsWidget.prototype.invokeAction = function(triggeringWidget,
	event) {
	//Apply the specified filters to the lists
	var field = this.listField,
		index,
		list = this.listField;
	if(this.listIndex) {
		field = undefined;
		index = this.listIndex;
		list = this.listIndex;
	}
	if(this.filter) {
		this.wiki.setText(this.target, field, index, $tw.utils.stringifyList(
			this.wiki
			.filterTiddlers(this.filter, this)));
	}
	if(this.subfilter) {
		var inputList = this.wiki.getTiddlerList(this.target,field,index),
			subfilter = "[all[]] " + this.subfilter;
		this.wiki.setText(this.target, field, index, $tw.utils.stringifyList(this.wiki.filterTiddlers(subfilter,this,this.wiki.makeTiddlerIterator(inputList))));
	}
	if(this.filtertags) {
		var tiddler = this.wiki.getTiddler(this.target),
			oldtags = tiddler ? (tiddler.fields.tags || []).slice(0) : [],
			tagfilter = $tw.utils.stringifyList(oldtags) + " " + this.filtertags,
			newtags = this.wiki.filterTiddlers(tagfilter,this);
		if($tw.utils.stringifyList(oldtags.sort()) !== $tw.utils.stringifyList(newtags.sort())) {
			this.wiki.setText(this.target,"tags",undefined,$tw.utils.stringifyList(newtags));
		}
	}
	return true; // Action was invoked
};

exports["action-listops"] = ActionListopsWidget;
