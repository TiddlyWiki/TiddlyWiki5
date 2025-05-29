/*\
title: $:/core/modules/widgets/data.js
type: application/javascript
module-type: widget

Widget to dynamically represent one or more tiddlers

\*/
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var DataWidget = function (parseTreeNode, options) {
	this.dataWidgetTag = parseTreeNode.type;
	this.initialise(parseTreeNode, options);
};

/*
Inherit from the base widget class
*/
DataWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
DataWidget.prototype.render = function (parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.makeChildWidgets();

	this.domNode = this.document.createElement("div");
	this.renderChildren(this.domNode, null);

	this.domNode = this.document.createTextNode(this.readDataTiddlerValuesAsJson());
	parent.insertBefore(this.domNode, nextSibling);
	this.domNodes.push(this.domNode);
};

/*
Compute the internal state of the widget
*/
DataWidget.prototype.execute = function () {
	const children = [];
	const attributesCopy = this.parseTreeNode.attributes;

	this.refreshTiddlerTitles = [];

	if (this.hasAttribute("$filter")) {
		var filter = this.getAttribute("$filter");
		if (filter) {
			var titles = this.wiki.filterTiddlers(filter);
			this.refreshTiddlerTitles.push(...titles);
			$tw.utils.each(titles, function (title) {
				const tiddlerAttribute = { name: '$tiddler', type: 'string', value: title };
				children.push({ type: "dataitem", attributes: { $tiddler: tiddlerAttribute, ...attributesCopy } });
			});
		}
	}

	if (this.hasAttribute("$compound-tiddler")) {
		var title = this.getAttribute("$compound-tiddler"),
			compoundTiddlers = this.getCompoundTiddlers(title, attributesCopy);

		this.refreshTiddlerTitles.push(title);
		children.push(...compoundTiddlers);
	}

	if (this.hasAttribute("$compound-filter")) {
		var self = this;
		var filter = this.getAttribute("$compound-filter");
		if (filter) {
			var titles = this.wiki.filterTiddlers(filter);
			this.refreshTiddlerTitles.push(...titles);
			$tw.utils.each(titles, function (title) {
				let compoundTiddlers = self.getCompoundTiddlers(title, attributesCopy);
				children.push(...compoundTiddlers);
			});
		}
	}

	if (this.hasAttribute("$tiddler") || children.length == 0) {
		this.refreshTiddlerTitles.push(this.getAttribute("$tiddler"));
		children.push({ type: "dataitem", attributes: attributesCopy });
	}

	this.parseTreeNode.children = children;
};

DataWidget.prototype.getCompoundTiddlers = function (title, attributes) {

	const compoundTiddler = this.wiki.getTiddler(title);
	const compoundTiddlers = [];

	if (compoundTiddler && compoundTiddler.fields.text) {

		const parser = $tw.wiki.parseText("text/vnd.tiddlywiki-multiple", compoundTiddler.fields.text, {});
		$tw.utils.each(parser.tree, function (node) {
			compoundTiddlers.push({ type: "dataitem", attributes: { ...node.attributes, ...attributes } });
		});
	}

	return compoundTiddlers;
}

/*
Read the tiddler value(s) from a data widget as an array of tiddler field objects (not $tw.Tiddler objects)
*/
DataWidget.prototype.readDataTiddlerValues = function () {
	var results = [];
	$tw.utils.each(this.children, function (node) {
		results.push(node.tiddler.getFieldStrings());
	});
	return results;
};

/*
Read the tiddler value(s) from a data widget as an array of tiddler field objects (not $tw.Tiddler objects)
*/
DataWidget.prototype.readDataTiddlerValuesAsJson = function () {
	return JSON.stringify(this.readDataTiddlerValues(), null, 4);
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
DataWidget.prototype.refresh = function (changedTiddlers) {
	var changedAttributes = this.computeAttributes();

	if (Object.keys(changedAttributes).length > 0) { 
		this.refreshSelf();
		return true;
	} 
	for (let i = 0; i < this.refreshTiddlerTitles.length; i++) {
		if (changedTiddlers[this.refreshTiddlerTitles[i]]) {
			this.refreshSelf();
			return true;
		}
	}
	return false;	
};

exports.data = DataWidget;
