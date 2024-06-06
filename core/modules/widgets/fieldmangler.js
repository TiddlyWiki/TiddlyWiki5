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
};

/*
Inherit from the base widget class
*/
FieldManglerWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
FieldManglerWidget.prototype.render = function(parent,nextSibling) {
	this.addEventListeners([
		{type: "tm-remove-field", handler: "handleRemoveFieldEvent"},
		{type: "tm-add-field", handler: "handleAddFieldEvent"},
		{type: "tm-remove-tag", handler: "handleRemoveTagEvent"},
		{type: "tm-add-tag", handler: "handleAddTagEvent"}
	]);
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
	return false;
};

FieldManglerWidget.prototype.handleAddFieldEvent = function(event) {
	var tiddler = this.wiki.getTiddler(this.mangleTitle),
		addition = this.wiki.getModificationFields(),
		addField = function(name,value) {
			var trimmedName = name.trim();
			if(!value && tiddler) {
				value = tiddler.fields[trimmedName];
			}
			addition[trimmedName] = value || "";
			return;
		};
	addition.title = this.mangleTitle;
	if(typeof event.param === "string") {
		addField(event.param,"");
	}
	if(typeof event.paramObject === "object") {
		for(var name in event.paramObject) {
			addField(name,event.paramObject[name]);
		}
	}
	this.wiki.addTiddler(new $tw.Tiddler(tiddler,addition));
	return false;
};

FieldManglerWidget.prototype.handleRemoveTagEvent = function(event) {
	var tiddler = this.wiki.getTiddler(this.mangleTitle),
		modification = this.wiki.getModificationFields();
	if(tiddler && tiddler.fields.tags) {
		var p = tiddler.fields.tags.indexOf(event.param);
		if(p !== -1) {
			modification.tags = (tiddler.fields.tags || []).slice(0);
			modification.tags.splice(p,1);
			if(modification.tags.length === 0) {
				modification.tags = undefined;
			}
			this.wiki.addTiddler(new $tw.Tiddler(tiddler,modification));
		}
	}
	return false;
};

FieldManglerWidget.prototype.handleAddTagEvent = function(event) {
	var tiddler = this.wiki.getTiddler(this.mangleTitle),
		modification = this.wiki.getModificationFields();
	if(tiddler && typeof event.param === "string") {
		var tag = event.param.trim();
		if(tag !== "") {
			modification.tags = (tiddler.fields.tags || []).slice(0);
			$tw.utils.pushTop(modification.tags,tag);
			this.wiki.addTiddler(new $tw.Tiddler(tiddler,modification));
		}
	} else if(typeof event.param === "string" && event.param.trim() !== "" && this.mangleTitle.trim() !== "") {
		var tag = [];
		tag.push(event.param.trim());
		this.wiki.addTiddler(new $tw.Tiddler({title: this.mangleTitle, tags: tag},modification));
	}
	return false;
};

exports.fieldmangler = FieldManglerWidget;

})();
