/*\
title: $:/core/modules/widgets/fieldmangler.js
type: application/javascript
module-type: widget

Field mangler widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var FieldManglerWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
	this.addEventListeners([
		{type: "tw-remove-field", handler: "handleRemoveFieldEvent"},
		{type: "tw-add-field", handler: "handleAddFieldEvent"},
		{type: "tw-remove-tag", handler: "handleRemoveTagEvent"},
		{type: "tw-add-tag", handler: "handleAddTagEvent"}
	]);
};

/*
Inherit from the base widget class
*/
FieldManglerWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
FieldManglerWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
FieldManglerWidget.prototype.execute = function() {
	// Get our parameters
	this.mangleTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.createText  = this.getAttribute("create",false); 
	// Process create param
	if(typeof(this.createText) === "string") { 
		var createTiddler = $tw.wiki.deserializeTiddlers("application/x-tiddler",this.createText)[0];
		createTiddler['title'] = this.mangleTitle;
		if(!this.wiki.tiddlerExists(this.mangleTitle))
			this.wiki.addTiddler(createTiddler);
	}
	
	
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
FieldManglerWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tiddler) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);		
	}
};

FieldManglerWidget.prototype.handleRemoveFieldEvent = function(event) {
	var tiddler = this.wiki.getTiddler(this.mangleTitle),
		deletion = {};
	deletion[event.param] = undefined;
	this.wiki.addTiddler(new $tw.Tiddler(tiddler,deletion));
	return true;
};

FieldManglerWidget.prototype.handleAddFieldEvent = function(event) {
	var tiddler = this.wiki.getTiddler(this.mangleTitle),
		fieldValidatorRegEx = /^[a-z\-\._]+$/mg;
	if(tiddler && typeof event.param === "string") {
		var name = event.param.toLowerCase();
		if(name !== "" && !$tw.utils.hop(tiddler.fields,name)) {
			if(!fieldValidatorRegEx.test(name)) {
				alert($tw.language.getString(
					"InvalidFieldName",
					{variables:
						{fieldName: name}
					}
				));
				return true;
			}
			var addition = this.wiki.getModificationFields();
			addition[name] = "";
			this.wiki.addTiddler(new $tw.Tiddler(tiddler,addition));
		}
	}
	return true;
};

FieldManglerWidget.prototype.handleRemoveTagEvent = function(event) {
	var tiddler = this.wiki.getTiddler(this.mangleTitle);
	if(tiddler && tiddler.fields.tags) {
		var p = tiddler.fields.tags.indexOf(event.param);
		if(p !== -1) {
			var modification = this.wiki.getModificationFields();
			modification.tags = (tiddler.fields.tags || []).slice(0);
			modification.tags.splice(p,1);
			if(modification.tags.length === 0) {
				modification.tags = undefined;
			}
		this.wiki.addTiddler(new $tw.Tiddler(tiddler,modification));
		}
	}
	return true;
};

FieldManglerWidget.prototype.handleAddTagEvent = function(event) {
	var tiddler = this.wiki.getTiddler(this.mangleTitle);
	if(tiddler && typeof event.param === "string" && event.param !== "") {
		var modification = this.wiki.getModificationFields();
		modification.tags = (tiddler.fields.tags || []).slice(0);
		$tw.utils.pushTop(modification.tags,event.param);
		this.wiki.addTiddler(new $tw.Tiddler(tiddler,modification));
	}
	return true;
};

exports.fieldmangler = FieldManglerWidget;

})();
