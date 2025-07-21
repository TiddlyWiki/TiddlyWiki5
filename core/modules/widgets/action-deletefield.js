/*\
title: $:/core/modules/widgets/action-deletefield.js
type: application/javascript
module-type: widget

Action widget to delete fields of a tiddler.

\*/

"use strict";

const Widget = require("$:/core/modules/widgets/widget.js").widget;

const DeleteFieldWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
DeleteFieldWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
DeleteFieldWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
DeleteFieldWidget.prototype.execute = function() {
	this.actionTiddler = this.getAttribute("$tiddler",this.getVariable("currentTiddler"));
	this.actionField = this.getAttribute("$field",null);
	this.actionTimestamp = this.getAttribute("$timestamp","yes") === "yes";
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
DeleteFieldWidget.prototype.refresh = function(changedTiddlers) {
	const changedAttributes = this.computeAttributes();
	if(changedAttributes["$tiddler"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
DeleteFieldWidget.prototype.invokeAction = function(triggeringWidget,event) {
	const self = this;
	const tiddler = this.wiki.getTiddler(self.actionTiddler);
	const removeFields = {};
	let hasChanged = false;
	if((this.actionField !== null) && tiddler) {
		removeFields[this.actionField] = undefined;
		if(this.actionField in tiddler.fields) {
			hasChanged = true;
		}
	}
	if(tiddler) {
		$tw.utils.each(this.attributes,(attribute,name) => {
			if(name.charAt(0) !== "$" && name !== "title") {
				removeFields[name] = undefined;
				if(name in tiddler.fields) {
					hasChanged = true;
				}
			}
		});
		if(hasChanged) {
			const creationFields = this.actionTimestamp ? this.wiki.getCreationFields() : {};
			const modificationFields = this.actionTimestamp ? this.wiki.getModificationFields() : {};
			this.wiki.addTiddler(new $tw.Tiddler(creationFields,tiddler,removeFields,modificationFields));
		}
	}
	return true; // Action was invoked
};

exports["action-deletefield"] = DeleteFieldWidget;
