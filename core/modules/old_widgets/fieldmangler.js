/*\
title: $:/core/modules/widgets/fieldmangler.js
type: application/javascript
module-type: widget

The fieldmangler widget modifies the fields of the current tiddler in response to messages.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var FieldManglerWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generate();
};

FieldManglerWidget.prototype.generate = function() {
	var self = this;
	// Get parameters from our attributes
	this.tiddlerTitle = this.renderer.getAttribute("tiddler",this.renderer.tiddlerTitle);
	// Set the element
	this.tag = "div";
	this.attributes = {
		"class": "tw-fieldmangler"
	};
	// Set event handlers
	this.events = [
		{name: "tw-remove-field", handlerObject: this, handlerMethod: "handleRemoveFieldEvent"},
		{name: "tw-add-field", handlerObject: this, handlerMethod: "handleAddFieldEvent"},
		{name: "tw-remove-tag", handlerObject: this, handlerMethod: "handleRemoveTagEvent"},
		{name: "tw-add-tag", handlerObject: this, handlerMethod: "handleAddTagEvent"}
	];
	// Render the children
	this.children = this.renderer.renderTree.createRenderers(this.renderer,this.renderer.parseTreeNode.children);
};

FieldManglerWidget.prototype.handleRemoveFieldEvent = function(event) {
	var tiddler = this.renderer.renderTree.wiki.getTiddler(this.tiddlerTitle),
		deletion = {};
	deletion[event.param] = undefined;
	this.renderer.renderTree.wiki.addTiddler(new $tw.Tiddler(tiddler,deletion));
	return true;
};

FieldManglerWidget.prototype.handleAddFieldEvent = function(event) {
	var tiddler = this.renderer.renderTree.wiki.getTiddler(this.tiddlerTitle);
	if(tiddler && typeof event.param === "string" && event.param !== "" && !$tw.utils.hop(tiddler.fields,event.param)) {
		var addition = {};
		addition[event.param] = "";
		this.renderer.renderTree.wiki.addTiddler(new $tw.Tiddler(tiddler,addition));
	}
	return true;
};

FieldManglerWidget.prototype.handleRemoveTagEvent = function(event) {
	var tiddler = this.renderer.renderTree.wiki.getTiddler(this.tiddlerTitle);
	if(tiddler && tiddler.fields.tags) {
		var p = tiddler.fields.tags.indexOf(event.param);
		if(p !== -1) {
			var modification = {};
			modification.tags = (tiddler.fields.tags || []).slice(0);
			modification.tags.splice(p,1);
		this.renderer.renderTree.wiki.addTiddler(new $tw.Tiddler(tiddler,modification));
		}
	}
	return true;
};

FieldManglerWidget.prototype.handleAddTagEvent = function(event) {
	var tiddler = this.renderer.renderTree.wiki.getTiddler(this.tiddlerTitle);
	if(tiddler && typeof event.param === "string" && event.param !== "") {
		var modification = {};
		modification.tags = (tiddler.fields.tags || []).slice(0);
		$tw.utils.pushTop(modification.tags,event.param);
		this.renderer.renderTree.wiki.addTiddler(new $tw.Tiddler(tiddler,modification));
	}
	return true;
};

exports.fieldmangler = FieldManglerWidget;

})();
