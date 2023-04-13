/*\
title: $:/core/modules/widgets/data.js
type: application/javascript
module-type: widget

Widget to represent a single item of data

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var DataWidget = function(parseTreeNode,options) {
	this.dataWidgetTag = parseTreeNode.type;
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
DataWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
DataWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
DataWidget.prototype.execute = function() {
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Read the tiddler value(s) from a data widget – must be called after the .render() method
*/
DataWidget.prototype.readDataTiddlerValues = function() {
	var self = this;
	// Start with a blank object
	var item = Object.create(null);
	// Read any attributes not prefixed with $
	$tw.utils.each(this.attributes,function(value,name) {
		if(name.charAt(0) !== "$") {
			item[name] = value;			
		}
	});
	// Deal with $tiddler or $filter attributes
	var titles;
	if(this.hasAttribute("$tiddler")) {
		titles = [this.getAttribute("$tiddler")];
	} else if(this.hasAttribute("$filter")) {
		titles = this.wiki.filterTiddlers(this.getAttribute("$filter"));
	}
	if(titles) {
		var results = [];
		$tw.utils.each(titles,function(title,index) {
			var tiddler = self.wiki.getTiddler(title),
				fields;
			if(tiddler) {
				fields = tiddler.getFieldStrings();
			}
			results.push($tw.utils.extend({},fields,item));
		})
		return results;
	} else {
		return [item];
	}
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
DataWidget.prototype.refresh = function(changedTiddlers) {
	// Refresh our attributes
	var changedAttributes = this.computeAttributes();
	// Refresh our children
	return this.refreshChildren(changedTiddlers);
};

exports.data = DataWidget;

})();
