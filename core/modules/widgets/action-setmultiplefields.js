/*\
title: $:/core/modules/widgets/action-setmultiplefields.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var SetMultipleFieldsWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

SetMultipleFieldsWidget.prototype = new Widget();

SetMultipleFieldsWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

SetMultipleFieldsWidget.prototype.execute = function() {
	this.actionTiddler = this.getAttribute("$tiddler",this.getVariable("currentTiddler"));
	this.actionFields = this.getAttribute("$fields");
	this.actionIndexes = this.getAttribute("$indexes");
	this.actionValues = this.getAttribute("$values");
	this.actionTimestamp = this.getAttribute("$timestamp","yes") === "yes";
};

SetMultipleFieldsWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$tiddler"] || changedAttributes["$fields"] || changedAttributes["$indexes"] || changedAttributes["$values"] || changedAttributes["$timestamp"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

SetMultipleFieldsWidget.prototype.invokeAction = function(triggeringWidget,event) {
	var tiddler = this.wiki.getTiddler(this.actionTiddler),
		names, values = this.wiki.filterTiddlers(this.actionValues,this);
	if(this.actionFields) {
		var additions = {};
		names = this.wiki.filterTiddlers(this.actionFields,this);
		$tw.utils.each(names,function(fieldname,index) {
			additions[fieldname] = values[index] || "";
		});
		var creationFields = this.actionTimestamp ? this.wiki.getCreationFields() : undefined,
			modificationFields = this.actionTimestamp ? this.wiki.getModificationFields() : undefined;
		this.wiki.addTiddler(new $tw.Tiddler(creationFields,tiddler,{title: this.actionTiddler},modificationFields,additions));
	} else if(this.actionIndexes) {
		var data = this.wiki.getTiddlerData(this.actionTiddler,Object.create(null));
		names = this.wiki.filterTiddlers(this.actionIndexes,this);
		$tw.utils.each(names,function(name,index) {
			data[name] = values[index] || "";
		});
		this.wiki.setTiddlerData(this.actionTiddler,data,{},{suppressTimestamp: !this.actionTimestamp});
	}
	return true; // Action was invoked
};

exports["action-setmultiplefields"] = SetMultipleFieldsWidget;
