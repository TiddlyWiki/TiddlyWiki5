/*\
title: $:/core/modules/widgets/action-createtiddler.js
type: application/javascript
module-type: widget

Action widget to create a new tiddler with a unique name and specified fields.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw:false, require:false, exports:false */
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
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	// Render children
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
CreateTiddlerWidget.prototype.execute = function() {
	this.actionBaseTitle = this.getAttribute("$basetitle");
	this.hasBase = !!this.actionBaseTitle;
	this.actionSaveTitle = this.getAttribute("$savetitle");
	this.actionSaveDraftTitle = this.getAttribute("$savedrafttitle");
	this.actionTimestamp = this.getAttribute("$timestamp","yes") === "yes";
	//Following params are new since 5.1.22
	this.actionTemplate = this.getAttribute("$template");
	this.useTemplate = !!this.actionTemplate;
	this.actionOverwrite = this.getAttribute("$overwrite","no");
	// Construct the child widgets
	this.makeChildWidgets();
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
	var title = this.wiki.getTiddlerText("$:/language/DefaultNewTiddlerTitle"), // Get the initial new-tiddler title
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
	if(this.hasBase && this.actionOverwrite === "no") {
		title = this.wiki.generateNewTitle(this.actionBaseTitle);
	} else if (this.hasBase && this.actionOverwrite === "yes") {
		title = this.actionBaseTitle
	}
	// NO $basetitle BUT $template parameter is available
	// the title MUST be unique, otherwise the template would be overwritten
	if (!this.hasBase && this.useTemplate) {
		title = this.wiki.generateNewTitle(this.actionTemplate);
	} else if (!this.hasBase && !this.useTemplate) {
		// If no $basetitle and no $template then use initial title
		title = this.wiki.generateNewTitle(title);
	}
	var templateTiddler = this.wiki.getTiddler(this.actionTemplate) || {};
	this.wiki.addTiddler(new $tw.Tiddler(templateTiddler.fields,creationFields,fields,modificationFields,{title: title}));
	var draftTitle = this.wiki.generateDraftTitle(title);
	if(this.actionSaveTitle) {
		this.wiki.setTextReference(this.actionSaveTitle,title,this.getVariable("currentTiddler"));
	}
	if(this.actionSaveDraftTitle) {
		this.wiki.setTextReference(this.actionSaveDraftTitle,draftTitle,this.getVariable("currentTiddler"));
	}
	this.setVariable("createTiddler-title",title);
	this.setVariable("createTiddler-draftTitle",draftTitle);
	this.refreshChildren();
	return true; // Action was invoked
};

exports["action-createtiddler"] = CreateTiddlerWidget;

})();
