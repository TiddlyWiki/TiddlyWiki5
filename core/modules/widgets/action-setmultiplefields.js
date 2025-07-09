/*\
title: $:/core/modules/widgets/action-setmultiplefields.js
type: application/javascript
module-type: widget

Action widget to set multiple fields or indexes on a tiddler

\*/

"use strict";

const Widget = require("$:/core/modules/widgets/widget.js").widget;

const SetMultipleFieldsWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
SetMultipleFieldsWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
SetMultipleFieldsWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
SetMultipleFieldsWidget.prototype.execute = function() {
	this.actionTiddler = this.getAttribute("$tiddler",this.getVariable("currentTiddler"));
	this.actionFields = this.getAttribute("$fields");
	this.actionIndexes = this.getAttribute("$indexes");
	this.actionValues = this.getAttribute("$values");
	this.actionTimestamp = this.getAttribute("$timestamp","yes") === "yes";
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
SetMultipleFieldsWidget.prototype.refresh = function(changedTiddlers) {
	const changedAttributes = this.computeAttributes();
	if(changedAttributes["$tiddler"] || changedAttributes["$fields"] || changedAttributes["$indexes"] || changedAttributes["$values"] || changedAttributes["$timestamp"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
SetMultipleFieldsWidget.prototype.invokeAction = function(triggeringWidget,event) {
	const tiddler = this.wiki.getTiddler(this.actionTiddler);
	let names; const values = this.wiki.filterTiddlers(this.actionValues,this);
	if(this.actionFields) {
		const additions = {};
		names = this.wiki.filterTiddlers(this.actionFields,this);
		$tw.utils.each(names,(fieldname,index) => {
			additions[fieldname] = values[index] || "";
		});
		const creationFields = this.actionTimestamp ? this.wiki.getCreationFields() : undefined;
		const modificationFields = this.actionTimestamp ? this.wiki.getModificationFields() : undefined;
		this.wiki.addTiddler(new $tw.Tiddler(creationFields,tiddler,{title: this.actionTiddler},modificationFields,additions));
	} else if(this.actionIndexes) {
		const data = this.wiki.getTiddlerData(this.actionTiddler,Object.create(null));
		names = this.wiki.filterTiddlers(this.actionIndexes,this);
		$tw.utils.each(names,(name,index) => {
			data[name] = values[index] || "";
		});
		this.wiki.setTiddlerData(this.actionTiddler,data,{},{suppressTimestamp: !this.actionTimestamp});
	}
	return true; // Action was invoked
};

exports["action-setmultiplefields"] = SetMultipleFieldsWidget;
