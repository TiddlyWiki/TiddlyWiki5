/*\
title: $:/core/modules/widgets/action-createtiddler.js
type: application/javascript
module-type: widget

Action widget to create a new tiddler with a unique name and specified fields.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var CreateTiddlerWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
CreateTiddlerWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
CreateTiddlerWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
CreateTiddlerWidget.prototype.execute = function() {
	this.actionBaseTitle = this.getAttribute("$basetitle");
	this.actionSaveTitle = this.getAttribute("$savetitle");
	this.actionTimestamp = this.getAttribute("$timestamp","yes") === "yes";
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
CreateTiddlerWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if($tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
CreateTiddlerWidget.prototype.invokeAction = function(triggeringWidget,event) {
	var title = this.wiki.generateNewTitle(this.actionBaseTitle),
		fields = {},
		creationFields,
		modificationFields;
	$tw.utils.each(this.attributes,function(attribute,name) {
		if(name.charAt(0) !== "$") {
			fields[name] = attribute;
		}
	});
	if(this.actionTimestamp) {
		creationFields = this.wiki.getCreationFields();
		modificationFields = this.wiki.getModificationFields();
	}
	var tiddler = this.wiki.addTiddler(new $tw.Tiddler(creationFields,fields,modificationFields,{title: title}));
	if(this.actionSaveTitle) {
		this.wiki.setTextReference(this.actionSaveTitle,title,this.getVariable("currentTiddler"));
	}
	return true; // Action was invoked
};

exports["action-createtiddler"] = CreateTiddlerWidget;

})();
