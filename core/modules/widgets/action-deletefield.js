/*\
title: $:/core/modules/widgets/action-deletefield.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var DeleteFieldWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

DeleteFieldWidget.prototype = new Widget();

DeleteFieldWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

DeleteFieldWidget.prototype.execute = function() {
	this.actionTiddler = this.getAttribute("$tiddler",this.getVariable("currentTiddler"));
	this.actionField = this.getAttribute("$field",null);
	this.actionTimestamp = this.getAttribute("$timestamp","yes") === "yes";
};

DeleteFieldWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$tiddler"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

DeleteFieldWidget.prototype.invokeAction = function(triggeringWidget,event) {
	var self = this,
		tiddler = this.wiki.getTiddler(self.actionTiddler),
		removeFields = {},
		hasChanged = false;
	if((this.actionField !== null) && tiddler) {
		removeFields[this.actionField] = undefined;
		if(this.actionField in tiddler.fields) {
			hasChanged = true;
		}
	}
	if(tiddler) {
		$tw.utils.each(this.attributes,function(attribute,name) {
			if(name.charAt(0) !== "$" && name !== "title") {
				removeFields[name] = undefined;
				if(name in tiddler.fields) {
					hasChanged = true;
				}
			}
		});
		if(hasChanged) {
			var creationFields = this.actionTimestamp ? this.wiki.getCreationFields() : {};
			var modificationFields = this.actionTimestamp ? this.wiki.getModificationFields() : {};
			this.wiki.addTiddler(new $tw.Tiddler(creationFields,tiddler,removeFields,modificationFields));
		}
	}
	return true; // Action was invoked
};

exports["action-deletefield"] = DeleteFieldWidget;
