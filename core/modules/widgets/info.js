/*\
title: $:/core/modules/widgets/info.js
type: application/javascript
module-type: widget

Implements the info widget that displays various information about a specified tiddler.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var InfoWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generate();
};

InfoWidget.types = {};

InfoWidget.types.changecount = function(options) {
	var text = options.wiki.getChangeCount(options.widget.renderer.tiddlerTitle);
	return [{type: "text", text: text}];
};

InfoWidget.types.currentfield = function(options) {
	var fieldName = options.widget.renderer.renderTree.getContextVariable(options.widget.renderer,"field","text");
	return [{type: "text", text: fieldName}];
};

var FIELD_DESCRIPTION_PREFIX = "$:/docs/fields/";

InfoWidget.types.currentfielddescription = function(options) {
	var fieldName = options.widget.renderer.renderTree.getContextVariable(options.widget.renderer,"field","text"),
		descriptionTitle = FIELD_DESCRIPTION_PREFIX + fieldName;
	return [{
		type: "element",
		tag: "$transclude",
		isBlock: false,
		attributes: {
			target: {type: "string", value: descriptionTitle}
		}
	}];
};

var MODULE_TYPE_DESCRIPTION_PREFIX = "$:/docs/moduletypes/";

/*
Return a list of all the currently loaded modules grouped by type
*/
InfoWidget.types.modules = function(options) {
	var output = [],
		types = [];
	// Collect and sort the module types
	$tw.utils.each($tw.modules.types,function(moduleInfo,type) {
		types.push(type);
	});
	types.sort();
	// Output the module types
	$tw.utils.each(types,function(moduleType) {
		// Heading
		output.push({type: "element", tag: "h2", children: [
				{type: "text", text: moduleType}
			]})
		// Description
		output.push({
			type: "element",
			tag: "$transclude",
			isBlock: false,
			attributes: {
				target: {type: "string", value: MODULE_TYPE_DESCRIPTION_PREFIX + moduleType}
			}
		});
		// List each module
		var list = {type: "element", tag: "ul", children: []},
			modules = [];
		$tw.utils.each($tw.modules.types[moduleType],function(moduleInfo,moduleName) {
			var listItem = {type: "element", tag: "li", children: [
				{type: "element", tag: "$link", attributes: {
					to: {type: "string", value: moduleName}
				}, children: [
					{type: "text", text: moduleName}
				]}
			]}
			list.children.push(listItem);
		});
		output.push(list);
	});
	return output;
};

InfoWidget.prototype.generate = function() {
	// Get attributes
	this.type = this.renderer.getAttribute("type","changecount").toLowerCase();
	// Get the appropriate value for the current tiddler
	var value = "",
		fn = InfoWidget.types[this.type];
	if(fn) {
		value = fn({
			wiki: this.renderer.renderTree.wiki,
			widget: this
		});
	}
	// Set the element
	this.tag = "span";
	this.attributes = {};
	this.children = this.renderer.renderTree.createRenderers(this.renderer,value);
};

exports.info = InfoWidget;

})();
