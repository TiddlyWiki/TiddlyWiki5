/*\
title: $:/core/modules/widgets/fieldgrid.js
type: application/javascript
module-type: widget

Implements the fieldgrid widget.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var FieldGridWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generate();
};

FieldGridWidget.prototype.generate = function() {
	// Get attributes
	this.tiddlerTitle = this.renderer.getAttribute("tiddler",this.renderer.tiddlerTitle);
	this.exclude = this.renderer.getAttribute("exclude");
	this["class"] = this.renderer.getAttribute("class");
	// Set up the exclusion array
	var exclude = [];
	if(this.exclude) {
		exclude = this.exclude.split(" ");
	}
	// Get the tiddler
	var tiddler = this.renderer.renderTree.wiki.getTiddler(this.tiddlerTitle);
	// Set up the classes
	var classes = ["tw-fieldgrid-table"];
	if(this["class"]) {
		$tw.utils.pushTop(classes,this["class"]);
	}
	// Set up the header row
	var rows = [
		{type: "element", tag: "tr", children: [
			{type: "element", tag: "th", children: [
				{type: "text", text: "Field"}]},
			{type: "element", tag: "th", children: [
				{type: "text", text: "Value"}]}]}
	];
	// Add the rows for each field
	if(tiddler) {
		var fields = [];
		for(var f in tiddler.fields) {
			if(exclude.indexOf(f) === -1) {
				fields.push(f);
			}
		}
		fields.sort();
		for(f=0; f<fields.length; f++) {
			var value;
			if(fields[f] === "text") {
				value = {type: "element", tag: "em", children: [
					{type: "text", text: "(length: " + tiddler.fields.text.length + ")"}
				]};
			} else {
				value = {type: "text", text: tiddler.getFieldString(fields[f])};
			}
			rows.push({type: "element", tag: "tr", children: [
				{type: "element", tag: "td", children: [
					{type: "text", text: fields[f]}
				]},
				{type: "element", tag: "td", children: [value]}
			]});
		}
	}
	// Return the table element
	this.tag = "table";
	this.attributes ={"class": classes.join(" ")};
	this.children = this.renderer.renderTree.createRenderers(this.renderer,[{
		type: "element",
		tag: "tbody",
		children: rows
	}]);
};

exports.fieldgrid = FieldGridWidget;

})();
